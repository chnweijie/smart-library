package com.library.service;

import com.library.common.BusinessException;
import com.library.common.PageResult;
import com.library.dto.announcement.AnnouncementCreateRequest;
import com.library.entity.SystemAnnouncement;
import com.library.entity.User;
import com.library.repository.SystemAnnouncementRepository;
import com.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 系统公告服务
 */
@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final SystemAnnouncementRepository systemAnnouncementRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * 获取所有公告（分页）
     */
    @Transactional(readOnly = true)
    public PageResult<SystemAnnouncement> getAllAnnouncements(int page, int size) {
        Pageable pageable = PageRequest.of(page - 1, size);
        Page<SystemAnnouncement> announcementPage = systemAnnouncementRepository.findAllByOrderByIdAsc(pageable);
        return PageResult.of(announcementPage.getContent(), announcementPage.getTotalElements(), page, size);
    }

    /**
     * 创建公告
     */
    @Transactional
    public SystemAnnouncement createAnnouncement(AnnouncementCreateRequest request, Long adminId) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> BusinessException.notFound("管理员用户不存在"));

        if (admin.getRole() != User.UserRole.ADMIN) {
            throw BusinessException.forbidden("仅管理员可创建公告");
        }

        SystemAnnouncement announcement = new SystemAnnouncement();
        announcement.setTitle(request.getTitle());
        announcement.setContent(request.getContent());
        announcement.setCreatedBy(adminId);

        // 设置优先级
        if (request.getPriority() != null) {
            announcement.setPriority(SystemAnnouncement.AnnouncementPriority.fromValue(request.getPriority()));
        } else {
            announcement.setPriority(SystemAnnouncement.AnnouncementPriority.LOW);
        }

        SystemAnnouncement savedAnnouncement = systemAnnouncementRepository.save(announcement);

        // 向所有正常状态的用户发送通知
        List<User> normalUsers = userRepository.findByStatus(User.UserStatus.NORMAL);
        for (User user : normalUsers) {
            notificationService.createNotification(
                    user.getId(),
                    6,
                    "系统公告",
                    request.getTitle(),
                    "ANNOUNCEMENT",
                    savedAnnouncement.getId(),
                    savedAnnouncement.getPriority().getValue()
            );
        }

        return savedAnnouncement;
    }

    /**
     * 删除公告
     */
    @Transactional
    public void deleteAnnouncement(Long id) {
        SystemAnnouncement announcement = systemAnnouncementRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("公告不存在"));

        systemAnnouncementRepository.delete(announcement);
    }
}
