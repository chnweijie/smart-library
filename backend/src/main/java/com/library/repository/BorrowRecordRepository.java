package com.library.repository;

import com.library.entity.BorrowRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BorrowRecordRepository extends JpaRepository<BorrowRecord, Long> {

    List<BorrowRecord> findByUserId(Long userId);

    Page<BorrowRecord> findByUserId(Long userId, Pageable pageable);

    List<BorrowRecord> findByBookId(Long bookId);

    Page<BorrowRecord> findByBookId(Long bookId, Pageable pageable);

    List<BorrowRecord> findByStatus(BorrowRecord.BorrowStatus status);

    Page<BorrowRecord> findByStatus(BorrowRecord.BorrowStatus status, Pageable pageable);

    List<BorrowRecord> findByUserIdAndStatus(Long userId, BorrowRecord.BorrowStatus status);

    Page<BorrowRecord> findByUserIdAndStatus(Long userId, BorrowRecord.BorrowStatus status, Pageable pageable);

    List<BorrowRecord> findByBookIdAndStatus(Long bookId, BorrowRecord.BorrowStatus status);

    @Query("SELECT br FROM BorrowRecord br WHERE br.status = :status AND br.dueDate < CURRENT_TIMESTAMP")
    List<BorrowRecord> findOverdueRecords(@Param("status") BorrowRecord.BorrowStatus status);

    long countByUserIdAndStatus(Long userId, BorrowRecord.BorrowStatus status);

    long countByBookIdAndStatus(Long bookId, BorrowRecord.BorrowStatus status);

    boolean existsByUserIdAndBookIdAndStatus(Long userId, Long bookId, BorrowRecord.BorrowStatus status);
}
