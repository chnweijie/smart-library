package com.library.scheduler;

import com.library.entity.Book;
import com.library.entity.BorrowRecord;
import com.library.repository.BookRepository;
import com.library.repository.BorrowRecordRepository;
import com.library.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class BorrowScheduler {

    private final BorrowRecordRepository borrowRecordRepository;
    private final BookRepository bookRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    @CacheEvict(value = {"books", "bookDetail"}, allEntries = true)
    public void processOverdueRecords() {
        log.info("开始处理逾期借阅记录...");

        List<BorrowRecord> overdueRecords = borrowRecordRepository
                .findOverdueRecords(BorrowRecord.BorrowStatus.BORROWING);

        int overdueCount = 0;
        int preOverdueCount = 0;

        for (BorrowRecord record : overdueRecords) {
            record.setStatus(BorrowRecord.BorrowStatus.OVERDUE);
            borrowRecordRepository.save(record);
            overdueCount++;

            notificationService.createNotification(
                    record.getUserId(),
                    NotificationService.NotificationTypeValue.OVERDUE_NOTICE,
                    "借阅逾期通知",
                    String.format("您借阅的《%s》已逾期，请尽快归还。逾期天数：%d天",
                            record.getBook().getTitle(),
                            ChronoUnit.DAYS.between(record.getDueDate(), LocalDateTime.now())),
                    "BORROW",
                    record.getId()
            );
        }

        log.info("逾期处理完成：共处理 {} 条逾期记录", overdueCount);

        processPreOverdueReminders();
    }

    @Scheduled(cron = "0 0 9 * * ?")
    @Transactional
    public void processPreOverdueReminders() {
        log.info("开始发送即将到期提醒...");

        LocalDateTime deadline = LocalDateTime.now().plusDays(3);

        List<BorrowRecord> borrowingRecords = borrowRecordRepository
                .findByStatus(BorrowRecord.BorrowStatus.BORROWING);

        int count = 0;
        for (BorrowRecord record : borrowingRecords) {
            if (record.getDueDate() != null
                    && record.getDueDate().isBefore(deadline)
                    && record.getDueDate().isAfter(LocalDateTime.now())) {

                long daysLeft = ChronoUnit.DAYS.between(LocalDateTime.now(), record.getDueDate());

                notificationService.createNotification(
                        record.getUserId(),
                        NotificationService.NotificationTypeValue.RETURN_REMINDER,
                        "归还提醒",
                        String.format("您借阅的《%s》将于%d天后到期，请及时归还",
                                record.getBook().getTitle(), daysLeft),
                        "BORROW",
                        record.getId()
                );
                count++;
            }
        }

        log.info("即将到期提醒发送完成：共发送 {} 条提醒", count);
    }

    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void processReservationNotifications() {
        log.info("开始检查预约到货通知...");

        List<BorrowRecord> returnedRecords = borrowRecordRepository
                .findByStatus(BorrowRecord.BorrowStatus.RETURNED);

        log.info("预约到货通知检查完成");
    }
}
