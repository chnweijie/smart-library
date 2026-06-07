package com.library.service;

import com.library.common.BusinessException;
import com.library.common.PageResult;
import com.library.dto.borrow.BorrowRequest;
import com.library.entity.Book;
import com.library.entity.BookReservation;
import com.library.entity.BorrowRecord;
import com.library.entity.User;
import com.library.repository.BookRepository;
import com.library.repository.BookReservationRepository;
import com.library.repository.BorrowRecordRepository;
import com.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 借阅服务
 */
@Service
@RequiredArgsConstructor
public class BorrowService {

    private static final int MAX_CONCURRENT_BORROWS = 5;
    private static final int DEFAULT_BORROW_DAYS = 30;

    private final BorrowRecordRepository borrowRecordRepository;
    private final BookRepository bookRepository;
    private final BookReservationRepository bookReservationRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * 借阅图书
     */
    @Transactional
    @CacheEvict(value = {"books", "bookDetail"}, allEntries = true)
    public BorrowRecord borrowBook(Long userId, BorrowRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("用户不存在"));

        // 检查用户状态
        if (user.getStatus() == User.UserStatus.DISABLED) {
            throw BusinessException.forbidden("账号已被禁用，无法借阅");
        }

        // 检查当前借阅数量
        long currentBorrowing = borrowRecordRepository.countByUserIdAndStatus(userId, BorrowRecord.BorrowStatus.BORROWING);
        if (currentBorrowing >= MAX_CONCURRENT_BORROWS) {
            throw BusinessException.badRequest("借阅数量已达上限（最多" + MAX_CONCURRENT_BORROWS + "本）");
        }

        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> BusinessException.notFound("图书不存在"));

        // 检查图书状态
        if (book.getStatus() == Book.BookStatus.OFF) {
            throw BusinessException.badRequest("该图书已下架");
        }

        // 检查可借数量
        if (book.getAvailableCount() <= 0) {
            throw BusinessException.badRequest("该图书暂无可借库存");
        }

        // 检查是否已借阅该书且未归还
        if (borrowRecordRepository.existsByUserIdAndBookIdAndStatus(userId, book.getId(), BorrowRecord.BorrowStatus.BORROWING)) {
            throw BusinessException.badRequest("您已借阅该图书且尚未归还");
        }

        // 创建借阅记录
        BorrowRecord record = new BorrowRecord();
        record.setUser(user);
        record.setUserId(userId);
        record.setBook(book);
        record.setBookId(book.getId());
        record.setBorrowDate(LocalDateTime.now());
        record.setDueDate(LocalDateTime.now().plusDays(DEFAULT_BORROW_DAYS));
        record.setStatus(BorrowRecord.BorrowStatus.BORROWING);

        int updated = bookRepository.decrementAvailableCount(book.getId());
        if (updated == 0) {
            throw BusinessException.badRequest("该图书暂无可借库存");
        }

        BorrowRecord savedRecord = borrowRecordRepository.save(record);

        bookReservationRepository.findByUserIdAndBookIdAndStatus(
                        userId, book.getId(), BookReservation.ReservationStatus.TAKEN)
                .forEach(reservation -> {
                    reservation.setStatus(BookReservation.ReservationStatus.CANCELLED);
                    bookReservationRepository.save(reservation);
                });

        notificationService.createNotification(
                userId,
                1,
                "借阅成功",
                "您已成功借阅《" + book.getTitle() + "》，请在" + DEFAULT_BORROW_DAYS + "天内归还",
                "BORROW",
                savedRecord.getId()
        );

        return savedRecord;
    }

    /**
     * 申请归还
     */
    @Transactional
    public BorrowRecord applyReturn(Long userId, Long borrowRecordId) {
        BorrowRecord record = findBorrowRecordById(borrowRecordId);

        // 验证借阅记录属于当前用户
        if (!record.getUserId().equals(userId)) {
            throw BusinessException.forbidden("无权操作此借阅记录");
        }

        // 检查状态
        if (record.getStatus() != BorrowRecord.BorrowStatus.BORROWING) {
            throw BusinessException.badRequest("当前状态不允许申请归还");
        }

        record.setStatus(BorrowRecord.BorrowStatus.PENDING);
        return borrowRecordRepository.save(record);
    }

    /**
     * 取消归还申请
     */
    @Transactional
    public BorrowRecord cancelReturn(Long userId, Long borrowRecordId) {
        BorrowRecord record = findBorrowRecordById(borrowRecordId);

        // 验证借阅记录属于当前用户
        if (!record.getUserId().equals(userId)) {
            throw BusinessException.forbidden("无权操作此借阅记录");
        }

        // 检查状态
        if (record.getStatus() != BorrowRecord.BorrowStatus.PENDING) {
            throw BusinessException.badRequest("当前状态不允许取消归还");
        }

        record.setStatus(BorrowRecord.BorrowStatus.BORROWING);
        return borrowRecordRepository.save(record);
    }

    /**
     * 获取当前借阅列表
     */
    @Transactional(readOnly = true)
    public PageResult<BorrowRecord> getCurrentBorrows(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "borrowDate"));
        Page<BorrowRecord> recordPage = borrowRecordRepository.findByUserIdAndStatus(
                userId, BorrowRecord.BorrowStatus.BORROWING, pageable);
        return PageResult.of(recordPage.getContent(), recordPage.getTotalElements(), page, size);
    }

    /**
     * 获取借阅历史
     */
    @Transactional(readOnly = true)
    public PageResult<BorrowRecord> getBorrowHistory(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<BorrowRecord> recordPage = borrowRecordRepository.findByUserId(userId, pageable);
        return PageResult.of(recordPage.getContent(), recordPage.getTotalElements(), page, size);
    }

    /**
     * 获取待审核归还列表（管理员）
     */
    @Transactional(readOnly = true)
    public PageResult<BorrowRecord> getPendingReturns(int page, int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.ASC, "createdAt"));
        Page<BorrowRecord> recordPage = borrowRecordRepository.findByStatus(
                BorrowRecord.BorrowStatus.PENDING, pageable);
        return PageResult.of(recordPage.getContent(), recordPage.getTotalElements(), page, size);
    }

    /**
     * 审批通过归还（管理员）
     */
    @Transactional
    @CacheEvict(value = {"books", "bookDetail"}, allEntries = true)
    public BorrowRecord approveReturn(Long borrowRecordId, Long adminId) {
        BorrowRecord record = findBorrowRecordById(borrowRecordId);

        if (record.getStatus() != BorrowRecord.BorrowStatus.PENDING) {
            throw BusinessException.badRequest("该借阅记录不在待审核状态");
        }

        record.setStatus(BorrowRecord.BorrowStatus.RETURNED);
        record.setReturnDate(LocalDateTime.now());
        record.setAuditUserId(adminId);
        record.setAuditTime(LocalDateTime.now());

        Book book = bookRepository.findById(record.getBookId())
                .orElseThrow(() -> BusinessException.notFound("图书不存在"));
        bookRepository.incrementAvailableCount(book.getId());

        BorrowRecord savedRecord = borrowRecordRepository.save(record);

        notificationService.createNotification(
                record.getUserId(),
                1,
                "归还成功",
                "您借阅的《" + book.getTitle() + "》已成功归还",
                "BORROW",
                savedRecord.getId()
        );

        List<BookReservation> pendingReservations = bookReservationRepository
                .findByBookIdAndStatus(book.getId(), BookReservation.ReservationStatus.PENDING);
        if (!pendingReservations.isEmpty()) {
            BookReservation firstReservation = pendingReservations.get(0);
            firstReservation.setStatus(BookReservation.ReservationStatus.TAKEN);
            firstReservation.setExpireAt(java.time.LocalDateTime.now().plusHours(48));
            bookReservationRepository.save(firstReservation);

            notificationService.createNotification(
                    firstReservation.getUserId(),
                    5,
                    "预约图书到货",
                    "您预约的《" + book.getTitle() + "》已有库存，请在48小时内借阅",
                    "RESERVATION",
                    firstReservation.getId()
            );
        }

        return savedRecord;
    }

    /**
     * 驳回归还申请（管理员）
     */
    @Transactional
    public BorrowRecord rejectReturn(Long borrowRecordId, Long adminId, String reason) {
        BorrowRecord record = findBorrowRecordById(borrowRecordId);

        if (record.getStatus() != BorrowRecord.BorrowStatus.PENDING) {
            throw BusinessException.badRequest("该借阅记录不在待审核状态");
        }

        record.setStatus(BorrowRecord.BorrowStatus.BORROWING);
        record.setAuditUserId(adminId);
        record.setAuditTime(LocalDateTime.now());
        record.setRejectReason(reason);

        BorrowRecord savedRecord = borrowRecordRepository.save(record);

        // 发送驳回通知
        Book book = bookRepository.findById(record.getBookId())
                .orElseThrow(() -> BusinessException.notFound("图书不存在"));
        notificationService.createNotification(
                record.getUserId(),
                2,
                "归还申请被驳回",
                "您借阅的《" + book.getTitle() + "》归还申请被驳回，原因：" + reason,
                "BORROW",
                savedRecord.getId()
        );

        return savedRecord;
    }

    /**
     * 根据ID查找借阅记录
     */
    private BorrowRecord findBorrowRecordById(Long id) {
        return borrowRecordRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("借阅记录不存在"));
    }
}
