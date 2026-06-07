package com.library.service;

import com.library.common.BusinessException;
import com.library.common.PageResult;
import com.library.dto.reservation.ReservationRequest;
import com.library.entity.Book;
import com.library.entity.BookReservation;
import com.library.entity.User;
import com.library.repository.BookRepository;
import com.library.repository.BookReservationRepository;
import com.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 预约服务
 */
@Service
@RequiredArgsConstructor
public class ReservationService {

    private static final int RESERVATION_EXPIRE_HOURS = 48;

    private final BookReservationRepository bookReservationRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * 预约图书
     */
    @Transactional
    public BookReservation reserveBook(Long userId, ReservationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("用户不存在"));

        if (user.getStatus() == User.UserStatus.DISABLED) {
            throw BusinessException.forbidden("账号已被禁用，无法预约");
        }

        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> BusinessException.notFound("图书不存在"));

        // 检查图书状态
        if (book.getStatus() == Book.BookStatus.OFF) {
            throw BusinessException.badRequest("该图书已下架，无法预约");
        }

        // 检查是否有库存
        if (book.getAvailableCount() > 0) {
            throw BusinessException.badRequest("该图书尚有库存，可直接借阅");
        }

        // 检查是否已预约该书
        if (bookReservationRepository.existsByBookIdAndUserIdAndStatus(
                request.getBookId(), userId, BookReservation.ReservationStatus.PENDING)) {
            throw BusinessException.badRequest("您已预约该图书，请勿重复预约");
        }

        BookReservation reservation = new BookReservation();
        reservation.setUser(user);
        reservation.setUserId(userId);
        reservation.setBook(book);
        reservation.setBookId(book.getId());
        reservation.setStatus(BookReservation.ReservationStatus.PENDING);
        reservation.setExpireAt(LocalDateTime.now().plusHours(RESERVATION_EXPIRE_HOURS));

        return bookReservationRepository.save(reservation);
    }

    /**
     * 取消预约
     */
    @Transactional
    public void cancelReservation(Long userId, Long reservationId) {
        BookReservation reservation = bookReservationRepository.findById(reservationId)
                .orElseThrow(() -> BusinessException.notFound("预约记录不存在"));

        if (!reservation.getUserId().equals(userId)) {
            throw BusinessException.forbidden("无权操作此预约记录");
        }

        if (reservation.getStatus() != BookReservation.ReservationStatus.PENDING) {
            throw BusinessException.badRequest("当前状态不允许取消预约");
        }

        reservation.setStatus(BookReservation.ReservationStatus.CANCELLED);
        bookReservationRepository.save(reservation);
    }

    /**
     * 获取用户预约列表
     */
    @Transactional(readOnly = true)
    public PageResult<BookReservation> getUserReservations(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<BookReservation> reservationPage = bookReservationRepository.findByUserId(userId, pageable);
        reservationPage.getContent().forEach(this::fillBookTitle);
        return PageResult.of(reservationPage.getContent(), reservationPage.getTotalElements(), page, size);
    }

    private void fillBookTitle(BookReservation reservation) {
        if (reservation.getBook() != null) {
            reservation.setBookTitle(reservation.getBook().getTitle());
        } else if (reservation.getBookId() != null) {
            bookRepository.findById(reservation.getBookId())
                    .ifPresent(book -> reservation.setBookTitle(book.getTitle()));
        }
    }

    /**
     * 定时检查并过期预约（每小时执行）
     */
    @Scheduled(cron = "0 0 * * * ?")
    @Transactional
    public void checkAndExpireReservations() {
        List<BookReservation> pendingReservations = bookReservationRepository
                .findByStatus(BookReservation.ReservationStatus.PENDING);

        LocalDateTime now = LocalDateTime.now();

        for (BookReservation reservation : pendingReservations) {
            if (reservation.getExpireAt() != null && now.isAfter(reservation.getExpireAt())) {
                reservation.setStatus(BookReservation.ReservationStatus.EXPIRED);
                bookReservationRepository.save(reservation);

                // 发送预约过期通知
                notificationService.createNotification(
                        reservation.getUserId(),
                        5,
                        "预约已过期",
                        "您预约的图书已过期，请重新预约",
                        "RESERVATION",
                        reservation.getId()
                );
            }
        }
    }
}
