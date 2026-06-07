package com.library.controller;

import com.library.common.PageResult;
import com.library.common.Result;
import com.library.dto.announcement.AnnouncementCreateRequest;
import com.library.entity.SystemAnnouncement;
import com.library.security.CustomUserDetails;
import com.library.service.AnnouncementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * 系统公告控制器
 */
@RestController
@RequestMapping("/announcements")
@RequiredArgsConstructor
@Tag(name = "系统公告", description = "系统公告的查看、创建及删除")
public class AnnouncementController {

    private final AnnouncementService announcementService;

    /**
     * 获取当前登录用户ID
     */
    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
        return userDetails.getId();
    }

    /**
     * 获取公告列表
     */
    @GetMapping
    @Operation(summary = "获取公告列表", description = "分页获取系统公告列表")
    public Result<PageResult<SystemAnnouncement>> getAnnouncements(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResult<SystemAnnouncement> announcements = announcementService.getAllAnnouncements(page, size);
        return Result.success(announcements);
    }

    /**
     * 创建公告（管理员）
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "创建公告", description = "管理员创建系统公告，同时向所有用户发送通知")
    public Result<SystemAnnouncement> createAnnouncement(@Valid @RequestBody AnnouncementCreateRequest request) {
        Long adminId = getCurrentUserId();
        SystemAnnouncement announcement = announcementService.createAnnouncement(request, adminId);
        return Result.success(announcement);
    }

    /**
     * 删除公告（管理员）
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "删除公告", description = "管理员删除指定系统公告")
    public Result<Void> deleteAnnouncement(@PathVariable Long id) {
        announcementService.deleteAnnouncement(id);
        return Result.success();
    }
}
