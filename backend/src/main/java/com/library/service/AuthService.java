package com.library.service;

import com.library.common.BusinessException;
import com.library.common.FaceFeatureUtil;
import com.library.dto.auth.AuthResponse;
import com.library.dto.auth.FaceLoginRequest;
import com.library.dto.auth.LoginRequest;
import com.library.dto.auth.RegisterRequest;
import com.library.entity.User;
import com.library.repository.UserRepository;
import com.library.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 认证服务
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final BCryptPasswordEncoder passwordEncoder;

    /**
     * 用户登录
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> BusinessException.unauthorized("用户名或密码错误"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw BusinessException.unauthorized("用户名或密码错误");
        }

        if (user.getStatus() == User.UserStatus.DISABLED) {
            throw BusinessException.forbidden("账号已被禁用，请联系管理员");
        }

        return buildAuthResponse(user);
    }

    /**
     * 用户注册
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw BusinessException.badRequest("用户名已存在");
        }

        if (request.getEmail() != null && !request.getEmail().isEmpty()
                && userRepository.existsByEmail(request.getEmail())) {
            throw BusinessException.badRequest("邮箱已被注册");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setNickname(request.getNickname());
        user.setEmail(request.getEmail());
        user.setRole(User.UserRole.USER);
        user.setStatus(User.UserStatus.NORMAL);

        User savedUser = userRepository.save(user);

        return buildAuthResponse(savedUser);
    }

    /**
     * 人脸登录
     */
    @Transactional(readOnly = true)
    public AuthResponse faceLogin(FaceLoginRequest request) {
        List<User> usersWithFace = userRepository.findUsersWithFaceFeature();

        if (usersWithFace.isEmpty()) {
            throw BusinessException.unauthorized("未找到已注册人脸的用户");
        }

        double threshold = 0.4; // 欧氏距离阈值

        // 多帧一致性验证：如果提供了多帧特征，要求至少2帧匹配同一用户
        if (request.getFaceFeatures() != null && request.getFaceFeatures().size() >= 2) {
            return faceLoginMultiFrame(usersWithFace, request.getFaceFeatures(), threshold);
        }

        // 单帧验证（兼容旧逻辑）
        double[] inputFeature = FaceFeatureUtil.parse(
                FaceFeatureUtil.fromRequestValue(request.getFaceFeature()));

        User matchedUser = findBestMatch(inputFeature, usersWithFace, threshold);
        if (matchedUser == null) {
            throw BusinessException.unauthorized("人脸识别失败，未匹配到已注册用户");
        }

        if (matchedUser.getStatus() == User.UserStatus.DISABLED) {
            throw BusinessException.forbidden("账号已被禁用，请联系管理员");
        }

        return buildAuthResponse(matchedUser);
    }

    /**
     * 多帧一致性验证：至少2帧匹配同一用户才允许登录
     */
    private AuthResponse faceLoginMultiFrame(List<User> usersWithFace, List<Object> faceFeatures, double threshold) {
        java.util.Map<Long, Integer> matchCounts = new java.util.HashMap<>();
        User lastMatchedUser = null;

        for (Object feature : faceFeatures) {
            double[] inputFeature = FaceFeatureUtil.parse(
                    FaceFeatureUtil.fromRequestValue(feature));
            User matched = findBestMatch(inputFeature, usersWithFace, threshold);
            if (matched != null) {
                matchCounts.merge(matched.getId(), 1, Integer::sum);
                lastMatchedUser = matched;
            }
        }

        // 要求至少2帧匹配同一用户
        boolean consistent = matchCounts.values().stream().anyMatch(count -> count >= 2);
        if (!consistent || lastMatchedUser == null) {
            throw BusinessException.unauthorized("人脸识别失败，多帧验证不一致");
        }

        // 找到匹配次数最多的用户
        Long bestUserId = matchCounts.entrySet().stream()
                .max(java.util.Map.Entry.comparingByValue())
                .map(java.util.Map.Entry::getKey)
                .orElse(null);

        User matchedUser = usersWithFace.stream()
                .filter(u -> u.getId().equals(bestUserId))
                .findFirst()
                .orElseThrow(() -> BusinessException.unauthorized("人脸识别失败"));

        if (matchedUser.getStatus() == User.UserStatus.DISABLED) {
            throw BusinessException.forbidden("账号已被禁用，请联系管理员");
        }

        return buildAuthResponse(matchedUser);
    }

    /**
     * 查找最佳匹配用户，距离必须低于阈值
     */
    private User findBestMatch(double[] inputFeature, List<User> usersWithFace, double threshold) {
        User matchedUser = null;
        double minDistance = Double.MAX_VALUE;

        for (User user : usersWithFace) {
            double distance = FaceFeatureUtil.euclideanDistance(
                    inputFeature, FaceFeatureUtil.parse(user.getFaceFeature()));
            if (distance < minDistance) {
                minDistance = distance;
                matchedUser = user;
            }
        }

        if (matchedUser == null || minDistance > threshold) {
            return null;
        }

        return matchedUser;
    }

    /**
     * 刷新令牌
     */
    @Transactional(readOnly = true)
    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw BusinessException.unauthorized("刷新令牌无效或已过期");
        }

        if (!jwtTokenProvider.isRefreshToken(refreshToken)) {
            throw BusinessException.badRequest("提供的令牌不是刷新令牌");
        }

        Long userId = jwtTokenProvider.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("用户不存在"));

        if (user.getStatus() == User.UserStatus.DISABLED) {
            throw BusinessException.forbidden("账号已被禁用，请联系管理员");
        }

        return buildAuthResponse(user);
    }

    /**
     * 构建认证响应
     */
    private AuthResponse buildAuthResponse(User user) {
        String token = jwtTokenProvider.generateToken(user.getId(), user.getUsername(), user.getRole().getValue());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId(), user.getUsername());

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .username(user.getUsername())
                .role(user.getRole().getValue())
                .build();
    }
}
