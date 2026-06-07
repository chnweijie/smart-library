package com.library.repository;

import com.library.entity.EmotionRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmotionRecordRepository extends JpaRepository<EmotionRecord, Long> {

    List<EmotionRecord> findByUserId(Long userId);

    Page<EmotionRecord> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    List<EmotionRecord> findByBookId(Long bookId);

    List<EmotionRecord> findByUserIdAndBookId(Long userId, Long bookId);

    List<EmotionRecord> findByEmotion(String emotion);

    @Query("SELECT e.emotion, COUNT(e) FROM EmotionRecord e WHERE e.bookId = :bookId GROUP BY e.emotion ORDER BY COUNT(e) DESC")
    List<Object[]> countByBookIdGroupByEmotion(@Param("bookId") Long bookId);

    @Query("SELECT e.emotion, COUNT(e) FROM EmotionRecord e WHERE e.userId = :userId GROUP BY e.emotion ORDER BY COUNT(e) DESC")
    List<Object[]> countByUserIdGroupByEmotion(@Param("userId") Long userId);

    @Modifying
    @Query(value = "UPDATE emotion_records SET book_id = :bookId WHERE id = :recordId AND user_id = :userId", nativeQuery = true)
    int updateBookId(@Param("recordId") Long recordId, @Param("userId") Long userId, @Param("bookId") Long bookId);
}
