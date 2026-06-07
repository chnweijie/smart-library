package com.library.controller;

import com.library.common.PageResult;
import com.library.common.Result;
import com.library.dto.user.AdminUserRequest;
import com.library.dto.user.UserProfileResponse;
import jakarta.validation.Valid;
import com.library.entity.User;
import com.library.security.CustomUserDetails;
import com.library.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 用户控制器
 */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "用户管理", description = "用户个人信息管理及管理员用户管理")
public class UserController {

    private final UserService userService;

    /**
     * 获取当前登录用户ID
     */
    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
        return userDetails.getId();
    }

    /**
     * 获取当前用户信息
     */
    @GetMapping("/me")
    @Operation(summary = "获取当前用户信息", description = "获取当前登录用户的个人资料")
    public Result<UserProfileResponse> getCurrentUserProfile() {
        Long userId = getCurrentUserId();
        UserProfileResponse profile = userService.getUserProfile(userId);
        return Result.success(profile);
    }

    /**
     * 更新用户信息
     */
    @PutMapping("/me")
    @Operation(summary = "更新用户信息", description = "更新当前用户的昵称、邮箱、手机号")
    public Result<Void> updateProfile(@RequestBody Map<String, String> body) {
        Long userId = getCurrentUserId();
        String nickname = body.get("nickname");
        String email = body.get("email");
        String phone = body.get("phone");
        userService.updateUserProfile(userId, nickname, email, phone);
        return Result.success();
    }

    /**
     * 更新用户头像
     */
    @PutMapping("/me/avatar")
    @Operation(summary = "更新用户头像", description = "更新当前用户的头像URL")
    public Result<Void> updateAvatar(@RequestBody Map<String, String> body) {
        Long userId = getCurrentUserId();
        String avatarUrl = body.get("avatarUrl");
        if (avatarUrl == null || avatarUrl.isEmpty()) {
            return Result.error("头像URL不能为空");
        }
        userService.updateAvatarUrl(userId, avatarUrl);
        return Result.success();
    }

    /**
     * 修改密码
     */
    @PutMapping("/me/password")
    @Operation(summary = "修改密码", description = "修改当前用户的登录密码")
    public Result<Void> changePassword(@RequestBody Map<String, String> body) {
        Long userId = getCurrentUserId();
        String oldPassword = body.get("oldPassword");
        String newPassword = body.get("newPassword");
        userService.changePassword(userId, oldPassword, newPassword);
        return Result.success();
    }

    /**
     * 注册人脸
     */
    @PostMapping("/me/face")
    @Operation(summary = "注册人脸", description = "为当前用户注册人脸特征数据")
    public Result<Void> registerFace(@RequestBody Map<String, Object> body) {
        Long userId = getCurrentUserId();
        Object raw = body.get("faceFeature");
        userService.registerFace(userId, com.library.common.FaceFeatureUtil.fromRequestValue(raw));
        return Result.success();
    }

    /**
     * 注销人脸
     */
    @DeleteMapping("/me/face")
    @Operation(summary = "注销人脸", description = "注销当前用户的人脸特征数据")
    public Result<Void> unregisterFace() {
        Long userId = getCurrentUserId();
        userService.unregisterFace(userId);
        return Result.success();
    }

    /**
     * 获取借阅统计
     */
    @GetMapping("/me/stats")
    @Operation(summary = "获取借阅统计", description = "获取当前用户的借阅统计数据")
    public Result<Map<String, Long>> getUserStats() {
        Long userId = getCurrentUserId();
        Map<String, Long> stats = userService.getUserBorrowStats(userId);
        return Result.success(stats);
    }

    /**
     * 获取所有用户列表（管理员）
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "获取所有用户列表", description = "管理员分页查询所有用户信息")
    public Result<PageResult<User>> getAllUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResult<User> users = userService.getAllUsers(page, size);
        return Result.success(users);
    }

    /**
     * 切换用户状态（管理员）
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "切换用户状态", description = "管理员启用或禁用指定用户账号")
    public Result<Void> toggleUserStatus(@PathVariable Long id) {
        userService.toggleUserStatus(id);
        return Result.success();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "创建用户", description = "管理员新增用户")
    public Result<User> createUser(@Valid @RequestBody AdminUserRequest request) {
        return Result.success(userService.createUser(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "更新用户", description = "管理员修改用户信息")
    public Result<User> updateUser(@PathVariable Long id, @Valid @RequestBody AdminUserRequest request) {
        return Result.success(userService.updateUser(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "删除用户", description = "管理员删除用户")
    public Result<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id, getCurrentUserId());
        return Result.success();
    }
}
