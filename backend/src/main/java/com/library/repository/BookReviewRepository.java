package com.library.repository;

import com.library.entity.BookReview;
import com.library.entity.BookReview.AuditStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookReviewRepository extends JpaRepository<BookReview, Long> {

    List<BookReview> findByBookId(Long bookId);

    Page<BookReview> findByBookId(Long bookId, Pageable pageable);

    List<BookReview> findByBookIdAndIsDeletedFalse(Long bookId);

    Page<BookReview> findByBookIdAndIsDeletedFalse(Long bookId, Pageable pageable);

    List<BookReview> findByUserId(Long userId);

    Page<BookReview> findByUserId(Long userId, Pageable pageable);

    List<BookReview> findByUserIdAndIsDeletedFalse(Long userId);

    List<BookReview> findByBookIdAndUserId(Long bookId, Long userId);

    long countByBookId(Long bookId);

    long countByBookIdAndIsDeletedFalse(Long bookId);

    long countByUserId(Long userId);

    Page<BookReview> findByBookIdAndIsDeletedFalseAndAuditStatus(
            Long bookId, AuditStatus auditStatus, Pageable pageable);

    Page<BookReview> findByAuditStatus(AuditStatus auditStatus, Pageable pageable);
}
