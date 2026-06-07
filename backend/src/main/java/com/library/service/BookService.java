package com.library.service;

import com.library.common.BusinessException;
import com.library.common.PageResult;
import com.library.dto.book.BookCreateRequest;
import com.library.dto.book.BookUpdateRequest;
import com.library.entity.Book;
import com.library.entity.BookReview;
import com.library.entity.Category;
import com.library.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;
    private final CategoryRepository categoryRepository;
    private final BookReviewRepository bookReviewRepository;
    private final BorrowRecordRepository borrowRecordRepository;
    private final FavoriteRepository favoriteRepository;
    private final BookReservationRepository bookReservationRepository;
    private final ReviewLikeRepository reviewLikeRepository;
    private final ReviewReplyRepository reviewReplyRepository;

    @Transactional(readOnly = true)
    @Cacheable(value = "books", key = "#keyword + '_' + #categoryId + '_' + #page + '_' + #size")
    public PageResult<Book> getAllBooks(String keyword, Long categoryId, int page, int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.ASC, "id"));
        Page<Book> bookPage;

        if (keyword != null && !keyword.trim().isEmpty() && categoryId != null) {
            bookPage = bookRepository.findByTitleContainingOrAuthorContaining(keyword, keyword, pageable);
            List<Book> filtered = bookPage.getContent().stream()
                    .filter(b -> categoryId.equals(b.getCategoryId()))
                    .toList();
            return PageResult.of(filtered, (long) filtered.size(), page, size);
        } else if (keyword != null && !keyword.trim().isEmpty()) {
            bookPage = bookRepository.findByTitleContainingOrAuthorContaining(keyword, keyword, pageable);
        } else if (categoryId != null) {
            bookPage = bookRepository.findByCategoryId(categoryId, pageable);
        } else {
            bookPage = bookRepository.findAll(pageable);
        }

        return PageResult.of(bookPage.getContent(), bookPage.getTotalElements(), page, size);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "bookDetail", key = "#id")
    public Book getBookById(Long id) {
        return findBookById(id);
    }

    @Transactional
    @CacheEvict(value = {"books", "bookDetail"}, allEntries = true)
    public Book createBook(BookCreateRequest request) {
        if (request.getIsbn() != null && !request.getIsbn().isEmpty()
                && bookRepository.existsByIsbn(request.getIsbn())) {
            throw BusinessException.badRequest("ISBN已存在");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> BusinessException.notFound("分类不存在"));

        Book book = new Book();
        book.setIsbn(request.getIsbn());
        book.setTitle(request.getTitle());
        book.setAuthor(request.getAuthor());
        book.setPublisher(request.getPublisher());
        book.setPublishDate(request.getPublishDate());
        book.setCategoryId(request.getCategoryId());
        book.setCategory(category);
        book.setDescription(request.getDescription());
        book.setCoverUrl(request.getCoverUrl());
        book.setLocation(request.getLocation());
        book.setTotalCount(request.getTotalCount());
        book.setAvailableCount(request.getTotalCount());
        book.setStatus(Book.BookStatus.ON);

        return bookRepository.save(book);
    }

    @Transactional
    @CacheEvict(value = {"books", "bookDetail"}, allEntries = true)
    public Book updateBook(Long id, BookUpdateRequest request) {
        Book book = findBookById(id);

        if (request.getIsbn() != null) {
            if (!request.getIsbn().equals(book.getIsbn())
                    && bookRepository.existsByIsbn(request.getIsbn())) {
                throw BusinessException.badRequest("ISBN已存在");
            }
            book.setIsbn(request.getIsbn());
        }

        if (request.getTitle() != null) {
            book.setTitle(request.getTitle());
        }

        if (request.getAuthor() != null) {
            book.setAuthor(request.getAuthor());
        }

        if (request.getPublisher() != null) {
            book.setPublisher(request.getPublisher());
        }

        if (request.getPublishDate() != null) {
            book.setPublishDate(request.getPublishDate());
        }

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> BusinessException.notFound("分类不存在"));
            book.setCategoryId(request.getCategoryId());
            book.setCategory(category);
        }

        if (request.getDescription() != null) {
            book.setDescription(request.getDescription());
        }

        if (request.getCoverUrl() != null) {
            book.setCoverUrl(request.getCoverUrl());
        }

        if (request.getLocation() != null) {
            book.setLocation(request.getLocation());
        }

        if (request.getTotalCount() != null) {
            int diff = request.getTotalCount() - book.getTotalCount();
            book.setTotalCount(request.getTotalCount());
            book.setAvailableCount(Math.max(0, book.getAvailableCount() + diff));
        }

        return bookRepository.save(book);
    }

    @Transactional
    @CacheEvict(value = {"books", "bookDetail", "similarBooks"}, allEntries = true)
    public void deleteBook(Long id) {
        Book book = findBookById(id);

        if (book.getAvailableCount() < book.getTotalCount()) {
            throw BusinessException.badRequest("该图书尚有未归还的借阅记录，无法删除");
        }

        List<BookReview> reviews = bookReviewRepository.findByBookId(id);
        for (BookReview review : reviews) {
            reviewLikeRepository.deleteByReviewId(review.getId());
            reviewReplyRepository.deleteByReviewId(review.getId());
        }
        bookReviewRepository.deleteAll(reviews);

        favoriteRepository.findByBookId(id).forEach(fav -> favoriteRepository.delete(fav));

        bookReservationRepository.findByBookId(id)
                .forEach(reservation -> bookReservationRepository.delete(reservation));

        borrowRecordRepository.findByBookId(id)
                .forEach(record -> borrowRecordRepository.delete(record));

        bookRepository.delete(book);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "similarBooks", key = "#bookId")
    public List<Book> getSimilarBooks(Long bookId) {
        Book book = findBookById(bookId);

        if (book.getCategoryId() == null) {
            throw BusinessException.badRequest("该图书未设置分类，无法推荐相似图书");
        }

        List<Book> sameCategoryBooks = bookRepository.findByCategoryIdAndStatus(
                book.getCategoryId(), Book.BookStatus.ON);

        return sameCategoryBooks.stream()
                .filter(b -> !b.getId().equals(bookId))
                .sorted(Comparator.comparingDouble(this::calculateAverageRating).reversed())
                .limit(10)
                .collect(Collectors.toList());
    }

    private double calculateAverageRating(Book book) {
        List<BookReview> reviews = bookReviewRepository.findByBookIdAndIsDeletedFalse(book.getId());
        if (reviews.isEmpty()) {
            return 0.0;
        }
        return reviews.stream()
                .mapToInt(BookReview::getRating)
                .average()
                .orElse(0.0);
    }

    private Book findBookById(Long id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("图书不存在"));
    }
}
