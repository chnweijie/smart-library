package com.library.repository;

import com.library.entity.ReviewReply;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewReplyRepository extends JpaRepository<ReviewReply, Long> {

    List<ReviewReply> findByReviewId(Long reviewId);

    Page<ReviewReply> findByReviewId(Long reviewId, Pageable pageable);

    List<ReviewReply> findByReviewIdAndIsDeletedFalseOrderByCreatedAtAsc(Long reviewId);

    Page<ReviewReply> findByReviewIdAndIsDeletedFalse(Long reviewId, Pageable pageable);

    List<ReviewReply> findByUserId(Long userId);

    long countByReviewIdAndIsDeletedFalse(Long reviewId);

    void deleteByReviewId(Long reviewId);
}
