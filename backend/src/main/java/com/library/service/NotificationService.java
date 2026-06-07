package com.library.service;

import com.library.common.BusinessException;
import com.library.common.PageResult;
import com.library.dto.notification.NotificationResponse;
import com.library.entity.Notification;
import com.library.entity.User;
import com.library.repository.NotificationRepository;
import com.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 通知服务
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public static class NotificationTypeValue {
        public static final int BORROW_APPROVED = 1;
        public static final int BORROW_REJECTED = 2;
        public static final int RETURN_REMINDER = 3;
        public static final int OVERDUE_NOTICE = 4;
        public static final int RESERVATION_READY = 5;
        public static final int SYSTEM_ANNOUNCEMENT = 6;
        public static final int REVIEW_REPLIED = 7;
    }

    /**
     * 获取用户通知列表
     */
    @Transactional(readOnly = true)
    public PageResult<NotificationResponse> getUserNotifications(Long userId, String type, int page, int size) {
        userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("用户不存在"));

        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Notification> notificationPage;

        if (type != null && !type.isEmpty()) {
            try {
                Notification.NotificationType notificationType = Notification.NotificationType.valueOf(type);
                notificationPage = notificationRepository.findByUserIdAndType(userId, notificationType, pageable);
            } catch (IllegalArgumentException e) {
                throw BusinessException.badRequest("无效的通知类型: " + type);
            }
        } else {
            notificationPage = notificationRepository.findByUserId(userId, pageable);
        }

        Page<NotificationResponse> responsePage = notificationPage.map(this::convertToResponse);
        return PageResult.of(responsePage.getContent(), responsePage.getTotalElements(), page, size);
    }

    /**
     * 标记通知为已读
     */
    @Transactional
    public void markAsRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> BusinessException.notFound("通知不存在"));

        if (!notification.getUserId().equals(userId)) {
            throw BusinessException.forbidden("无权操作此通知");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    /**
     * 标记所有通知为已读
     */
    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }

    /**
     * 获取未读通知数量
     */
    @Transactional(readOnly = true)
    public Long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsRead(userId, false);
    }

    /**
     * 创建通知
     */
    @Transactional
    public void createNotification(Long userId, Integer type, String title, String content,
                                   String relatedType, Long relatedId) {
        createNotification(userId, type, title, content, relatedType, relatedId, null);
    }

    /**
     * 创建通知（带优先级）
     */
    @Transactional
    public void createNotification(Long userId, Integer type, String title, String content,
                                   String relatedType, Long relatedId, Integer priority) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("用户不存在"));

        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setUser(user);
        notification.setType(convertTypeFromValue(type));
        notification.setTitle(title);
        notification.setContent(content);
        notification.setRelatedType(relatedType);
        notification.setRelatedId(relatedId);
        notification.setIsRead(false);
        notification.setPriority(priority);

        notificationRepository.save(notification);
    }

    /**
     * 将通知实体转换为响应DTO
     */
    private NotificationResponse convertToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType().name())
                .title(notification.getTitle())
                .content(notification.getContent())
                .relatedType(notification.getRelatedType())
                .relatedId(notification.getRelatedId())
                .isRead(notification.getIsRead())
                .priority(notification.getPriority())
                .createdAt(notification.getCreatedAt())
                .build();
    }

    /**
     * 根据枚举值获取通知类型
     */
    private Notification.NotificationType convertTypeFromValue(Integer value) {
        for (Notification.NotificationType type : Notification.NotificationType.values()) {
            if (type.getValue() == value) {
                return type;
            }
        }
        throw BusinessException.badRequest("无效的通知类型值: " + value);
    }
}
