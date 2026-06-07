package com.library.dto.borrow;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BorrowRecordResponse {

    private Long id;
    private Long userId;
    private Long bookId;
    private LocalDateTime borrowDate;
    private LocalDateTime dueDate;
    private LocalDateTime returnDate;
    private String status;
    private String rejectReason;
    private Long auditUserId;
    private LocalDateTime auditTime;
    private LocalDateTime createdAt;

    private String username;
    private String nickname;
    private String bookTitle;
}
