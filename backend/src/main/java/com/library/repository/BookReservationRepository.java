package com.library.repository;

import com.library.entity.BookReservation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookReservationRepository extends JpaRepository<BookReservation, Long> {

    List<BookReservation> findByUserId(Long userId);

    Page<BookReservation> findByUserId(Long userId, Pageable pageable);

    List<BookReservation> findByBookId(Long bookId);

    Page<BookReservation> findByBookId(Long bookId, Pageable pageable);

    List<BookReservation> findByStatus(BookReservation.ReservationStatus status);

    Page<BookReservation> findByStatus(BookReservation.ReservationStatus status, Pageable pageable);

    List<BookReservation> findByUserIdAndStatus(Long userId, BookReservation.ReservationStatus status);

    List<BookReservation> findByBookIdAndStatus(Long bookId, BookReservation.ReservationStatus status);

    boolean existsByBookIdAndUserIdAndStatus(Long bookId, Long userId, BookReservation.ReservationStatus status);

    long countByBookIdAndStatus(Long bookId, BookReservation.ReservationStatus status);

    long countByUserIdAndStatus(Long userId, BookReservation.ReservationStatus status);

    List<BookReservation> findByUserIdAndBookIdAndStatus(Long userId, Long bookId, BookReservation.ReservationStatus status);
}
