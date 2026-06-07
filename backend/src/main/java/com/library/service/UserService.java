package com.library.service;

import com.library.common.BusinessException;
import com.library.common.FaceFeatureUtil;
import com.library.common.PageResult;
import com.library.dto.user.AdminUserRequest;
import com.library.dto.user.UserProfileResponse;
import com.library.entity.BookReservation;
import com.library.entity.BookReview;
import com.library.entity.BorrowRecord;
import com.library.entity.Favorite;
import com.library.entity.User;
import com.library.repository.BookReservationRepository;
import com.library.repository.BookReviewRepository;
import com.library.repository.BorrowRecordRepository;
import com.library.repository.FavoriteRepository;
import com.library.repository.NotificationRepository;
import com.library.repository.ReviewLikeRepository;
import com.library.repository.ReviewReplyRepository;
import com.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 用户服务
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final BorrowRecordRepository borrowRecordRepository;
    private final FavoriteRepository favoriteRepository;
    private final BookReservationRepository bookReservationRepository;
    private final BookReviewRepository bookReviewRepository;
    private final ReviewLikeRepository reviewLikeRepository;
    private final ReviewReplyRepository reviewReplyRepository;
    private final NotificationRepository notificationRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    /**
     * 获取用户信息
     */
    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(Long userId) {
        User user = findUserById(userId);
        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .email(user.getEmail())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole().getValue())
                .status(user.getStatus().getValue())
                .faceRegistered(user.getFaceFeature() != null && !user.getFaceFeature().isBlank())
                .createdAt(user.getCreatedAt())
                .build();
    }

    /**
     * 更新用户头像
     */
    @Transactional
    public void updateAvatarUrl(Long userId, String avatarUrl) {
        User user = findUserById(userId);
        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);
    }

    /**
     * 更新用户信息
     */
    @Transactional
    public void updateUserProfile(Long userId, String nickname, String email, String phone) {
        User user = findUserById(userId);

        if (email != null && !email.isEmpty() && !email.equals(user.getEmail())) {
            if (userRepository.existsByEmail(email)) {
                throw BusinessException.badRequest("邮箱已被其他用户使用");
            }
            user.setEmail(email);
        }

        if (phone != null && !phone.isEmpty() && !phone.equals(user.getPhone())) {
            if (userRepository.existsByPhone(phone)) {
                throw BusinessException.badRequest("手机号已被其他用户使用");
            }
            user.setPhone(phone);
        }

        if (nickname != null) {
            user.setNickname(nickname);
        }

        userRepository.save(user);
    }

    /**
     * 修改密码
     */
    @Transactional
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        User user = findUserById(userId);

        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw BusinessException.badRequest("原密码错误");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    /**
     * 注册人脸特征
     */
    @Transactional
    public void registerFace(Long userId, String faceFeature) {
        User user = findUserById(userId);
        user.setFaceFeature(faceFeature);
        userRepository.save(user);
    }

    /**
     * 注销人脸特征
     */
    @Transactional
    public void unregisterFace(Long userId) {
        User user = findUserById(userId);
        user.setFaceFeature(null);
        userRepository.save(user);
    }

    /**
     * 获取所有用户（分页）
     */
    @Transactional(readOnly = true)
    public PageResult<User> getAllUsers(int page, int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.ASC, "id"));
        Page<User> userPage = userRepository.findAll(pageable);
        return PageResult.of(userPage.getContent(), userPage.getTotalElements(), page, size);
    }

    /**
     * 切换用户状态（启用/禁用）
     */
    @Transactional
    public void toggleUserStatus(Long userId) {
        User user = findUserById(userId);

        if (user.getStatus() == User.UserStatus.NORMAL) {
            user.setStatus(User.UserStatus.DISABLED);
        } else {
            user.setStatus(User.UserStatus.NORMAL);
        }

        userRepository.save(user);
    }

    /**
     * 获取用户借阅统计
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getUserBorrowStats(Long userId) {
        findUserById(userId); // 确保用户存在

        long totalBorrow = borrowRecordRepository.countByUserIdAndStatus(userId, BorrowRecord.BorrowStatus.RETURNED);
        long currentBorrow = borrowRecordRepository.countByUserIdAndStatus(userId, BorrowRecord.BorrowStatus.BORROWING)
                + borrowRecordRepository.countByUserIdAndStatus(userId, BorrowRecord.BorrowStatus.PENDING);
        long favorites = favoriteRepository.countByUserId(userId);
        long reservations = bookReservationRepository.countByUserIdAndStatus(userId, BookReservation.ReservationStatus.PENDING);

        Map<String, Long> stats = new HashMap<>();
        stats.put("totalBorrow", totalBorrow);
        stats.put("totalBorrowed", totalBorrow);
        stats.put("currentBorrow", currentBorrow);
        stats.put("currentBorrowed", currentBorrow);
        stats.put("favorites", favorites);
        stats.put("favoriteCount", favorites);
        stats.put("reservations", reservations);
        stats.put("reservingCount", reservations);
        return stats;
    }

    @Transactional
    public User createUser(AdminUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw BusinessException.badRequest("用户名已存在");
        }
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPasswordHash(passwordEncoder.encode(
                request.getPassword() != null ? request.getPassword() : "123456"));
        user.setNickname(request.getNickname());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setRole(request.getRole() != null && request.getRole() == 2
                ? User.UserRole.ADMIN : User.UserRole.USER);
        user.setStatus(User.UserStatus.NORMAL);
        return userRepository.save(user);
    }

    @Transactional
    public User updateUser(Long userId, AdminUserRequest request) {
        User user = findUserById(userId);
        if (request.getNickname() != null) {
            user.setNickname(request.getNickname());
        }
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getRole() != null) {
            user.setRole(request.getRole() == 2 ? User.UserRole.ADMIN : User.UserRole.USER);
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long userId, Long operatorId) {
        if (userId.equals(operatorId)) {
            throw BusinessException.badRequest("不能删除当前登录账号");
        }
        User user = findUserById(userId);

        List<BookReview> reviews = bookReviewRepository.findByUserId(userId);
        for (BookReview review : reviews) {
            reviewLikeRepository.deleteByReviewId(review.getId());
            reviewReplyRepository.deleteByReviewId(review.getId());
        }
        bookReviewRepository.deleteAll(reviews);

        reviewLikeRepository.findByUserId(userId)
                .forEach(like -> reviewLikeRepository.delete(like));

        reviewReplyRepository.findByUserId(userId)
                .forEach(reply -> reviewReplyRepository.delete(reply));

        favoriteRepository.findByUserId(userId)
                .forEach(fav -> favoriteRepository.delete(fav));

        bookReservationRepository.findByUserId(userId)
                .forEach(reservation -> bookReservationRepository.delete(reservation));

        borrowRecordRepository.findByUserId(userId)
                .forEach(record -> borrowRecordRepository.delete(record));

        notificationRepository.deleteByUserId(userId);

        userRepository.delete(user);
    }

    /**
     * 根据ID查找用户
     */
    private User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("用户不存在"));
    }
}
