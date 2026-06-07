package com.library.repository;

import com.library.entity.ReviewLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewLikeRepository extends JpaRepository<ReviewLike, Long> {

    Optional<ReviewLike> findByReviewIdAndUserId(Long reviewId, Long userId);

    List<ReviewLike> findByReviewId(Long reviewId);

    List<ReviewLike> findByUserId(Long userId);

    long countByReviewId(Long reviewId);

    boolean existsByReviewIdAndUserId(Long reviewId, Long userId);

    void deleteByReviewIdAndUserId(Long reviewId, Long userId);

    void deleteByReviewId(Long reviewId);
}
