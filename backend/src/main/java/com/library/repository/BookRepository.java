package com.library.repository;

import com.library.entity.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    Optional<Book> findByIsbn(String isbn);

    List<Book> findByCategoryId(Long categoryId);

    Page<Book> findByCategoryId(Long categoryId, Pageable pageable);

    Page<Book> findByTitleContaining(String keyword, Pageable pageable);

    Page<Book> findByAuthorContaining(String author, Pageable pageable);

    Page<Book> findByTitleContainingOrAuthorContaining(String title, String author, Pageable pageable);

    List<Book> findByStatus(Book.BookStatus status);

    Page<Book> findByStatus(Book.BookStatus status, Pageable pageable);

    @Query("SELECT b FROM Book b WHERE b.categoryId = :categoryId AND b.status = :status")
    List<Book> findByCategoryIdAndStatus(@Param("categoryId") Long categoryId, @Param("status") Book.BookStatus status);

    @Query("SELECT b FROM Book b WHERE b.availableCount > 0 AND b.status = :status")
    List<Book> findAvailableBooks(@Param("status") Book.BookStatus status);

    boolean existsByIsbn(String isbn);

    long countByCategoryId(Long categoryId);

    @Modifying
    @Query("UPDATE Book b SET b.availableCount = b.availableCount - 1 WHERE b.id = :id AND b.availableCount > 0")
    int decrementAvailableCount(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Book b SET b.availableCount = b.availableCount + 1 WHERE b.id = :id")
    int incrementAvailableCount(@Param("id") Long id);
}
