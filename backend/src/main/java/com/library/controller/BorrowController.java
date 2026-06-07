package com.library.controller;

import com.library.common.PageResult;
import com.library.common.Result;
import com.library.dto.borrow.BorrowRequest;
import com.library.entity.BorrowRecord;
import com.library.security.CustomUserDetails;
import com.library.service.BorrowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 借阅控制器
 */
@RestController
@RequestMapping("/borrows")
@RequiredArgsConstructor
@Tag(name = "借阅管理", description = "图书借阅、归还申请、归还审批等操作")
public class BorrowController {

    private final BorrowService borrowService;

    /**
     * 获取当前登录用户ID
     */
    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
        return userDetails.getId();
    }

    /**
     * 借阅图书
     */
    @PostMapping
    @Operation(summary = "借阅图书", description = "用户借阅指定图书")
    public Result<BorrowRecord> borrowBook(@Valid @RequestBody BorrowRequest request) {
        Long userId = getCurrentUserId();
        BorrowRecord record = borrowService.borrowBook(userId, request);
        return Result.success(record);
    }

    /**
     * 申请归还
     */
    @PutMapping("/{id}/return")
    @Operation(summary = "申请归还", description = "用户对指定借阅记录申请归还")
    public Result<BorrowRecord> applyReturn(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        BorrowRecord record = borrowService.applyReturn(userId, id);
        return Result.success(record);
    }

    /**
     * 取消归还申请
     */
    @PutMapping("/{id}/cancel-return")
    @Operation(summary = "取消归还申请", description = "用户取消已提交的归还申请")
    public Result<BorrowRecord> cancelReturn(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        BorrowRecord record = borrowService.cancelReturn(userId, id);
        return Result.success(record);
    }

    /**
     * 获取当前借阅列表
     */
    @GetMapping("/current")
    @Operation(summary = "获取当前借阅列表", description = "获取当前用户正在借阅中的图书列表")
    public Result<PageResult<BorrowRecord>> getCurrentBorrows(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = getCurrentUserId();
        PageResult<BorrowRecord> records = borrowService.getCurrentBorrows(userId, page, size);
        return Result.success(records);
    }

    /**
     * 获取借阅历史
     */
    @GetMapping("/history")
    @Operation(summary = "获取借阅历史", description = "获取当前用户的全部借阅历史记录")
    public Result<PageResult<BorrowRecord>> getBorrowHistory(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = getCurrentUserId();
        PageResult<BorrowRecord> records = borrowService.getBorrowHistory(userId, page, size);
        return Result.success(records);
    }

    /**
     * 获取待审核归还列表（管理员）
     */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "获取待审核归还列表", description = "管理员查询所有待审核的归还申请")
    public Result<PageResult<BorrowRecord>> getPendingReturns(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResult<BorrowRecord> records = borrowService.getPendingReturns(page, size);
        return Result.success(records);
    }

    /**
     * 审批通过归还（管理员）
     */
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "审批通过归还", description = "管理员审批通过指定借阅记录的归还申请")
    public Result<BorrowRecord> approveReturn(@PathVariable Long id) {
        Long adminId = getCurrentUserId();
        BorrowRecord record = borrowService.approveReturn(id, adminId);
        return Result.success(record);
    }

    /**
     * 驳回归还申请（管理员）
     */
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "驳回归还申请", description = "管理员驳回指定借阅记录的归还申请")
    public Result<BorrowRecord> rejectReturn(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Long adminId = getCurrentUserId();
        String reason = body.get("reason");
        BorrowRecord record = borrowService.rejectReturn(id, adminId, reason);
        return Result.success(record);
    }
}
