package com.library.dto.review;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReplyResponse {
    private Long id;
    private Long reviewId;
    private Long userId;
    private String username;
    private String nickname;
    private Long replyToUserId;
    private String replyToNickname;
    private String content;
    private LocalDateTime createdAt;
}
