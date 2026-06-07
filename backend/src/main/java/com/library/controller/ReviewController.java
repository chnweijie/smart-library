package com.library.controller;

import com.library.common.PageResult;
import com.library.common.Result;
import com.library.dto.review.ReplyResponse;
import com.library.dto.review.ReviewCreateRequest;
import com.library.dto.review.ReviewResponse;
import com.library.dto.review.ReviewUpdateRequest;
import com.library.entity.BookReview;
import com.library.security.CustomUserDetails;
import com.library.service.ReviewService;
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
 * 评价控制器
 */
@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
@Tag(name = "评价管理", description = "图书评价的增删改查、点赞、回复及审核")
public class ReviewController {

    private final ReviewService reviewService;

    /**
     * 获取当前登录用户ID
     */
    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
        return userDetails.getId();
    }

    /**
     * 创建评价
     */
    @PostMapping
    @Operation(summary = "创建评价", description = "用户对指定图书创建评价")
    public Result<BookReview> createReview(@Valid @RequestBody ReviewCreateRequest request) {
        Long userId = getCurrentUserId();
        BookReview review = reviewService.createReview(userId, request);
        return Result.success(review);
    }

    /**
     * 更新评价
     */
    @PutMapping("/{id}")
    @Operation(summary = "更新评价", description = "用户修改自己发布的评价")
    public Result<BookReview> updateReview(@PathVariable Long id, @RequestBody ReviewUpdateRequest request) {
        Long userId = getCurrentUserId();
        BookReview review = reviewService.updateReview(userId, id, request);
        return Result.success(review);
    }

    /**
     * 删除评价
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除评价", description = "用户删除自己发布的评价（软删除）")
    public Result<Void> deleteReview(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        reviewService.deleteReview(userId, id);
        return Result.success();
    }

    /**
     * 获取图书评价列表
     */
    @GetMapping("/book/{bookId}")
    @Operation(summary = "获取图书评价列表", description = "分页获取指定图书的评价列表，支持按评分、点赞数、时间排序")
    public Result<PageResult<ReviewResponse>> getBookReviews(
            @PathVariable Long bookId,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResult<ReviewResponse> reviews = reviewService.getBookReviews(bookId, sort, page, size);
        return Result.success(reviews);
    }

    /**
     * 切换点赞
     */
    @PostMapping("/{id}/vote")
    @Operation(summary = "切换点赞", description = "对指定评价进行点赞或取消点赞")
    public Result<Boolean> voteHelpful(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        boolean voted = reviewService.voteHelpful(userId, id);
        return Result.success(voted);
    }

    /**
     * 添加回复
     */
    @PostMapping("/{id}/reply")
    @Operation(summary = "添加回复", description = "对指定评价添加回复")
    public Result<ReplyResponse> addReply(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long userId = getCurrentUserId();
        String content = (String) body.get("content");
        Long replyToUserId = body.get("replyToUserId") != null ? Long.valueOf(body.get("replyToUserId").toString()) : null;
        ReplyResponse reply = reviewService.addReply(userId, id, content, replyToUserId);
        return Result.success(reply);
    }

    /**
     * 管理员删除评价
     */
    @DeleteMapping("/{id}/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "管理员删除评价", description = "管理员软删除指定评价")
    public Result<Void> adminDeleteReview(@PathVariable Long id) {
        reviewService.adminDeleteReview(id);
        return Result.success();
    }

    /**
     * 管理员删除回复
     */
    @DeleteMapping("/reply/{replyId}/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "管理员删除回复", description = "管理员软删除指定回复")
    public Result<Void> adminDeleteReply(@PathVariable Long replyId) {
        reviewService.adminDeleteReply(replyId);
        return Result.success();
    }

    /**
     * 获取待审核评价列表（管理员）
     */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "获取待审核评价列表", description = "管理员查询所有待审核的评价")
    public Result<PageResult<BookReview>> getPendingReviews(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResult<BookReview> reviews = reviewService.getPendingReviews(page, size);
        return Result.success(reviews);
    }

    /**
     * 审核通过评价（管理员）
     */
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "审核通过评价", description = "管理员审核通过指定评价")
    public Result<BookReview> approveReview(@PathVariable Long id) {
        BookReview review = reviewService.approveReview(id);
        return Result.success(review);
    }

    /**
     * 审核驳回评价（管理员）
     */
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "审核驳回评价", description = "管理员审核驳回指定评价")
    public Result<BookReview> rejectReview(@PathVariable Long id) {
        BookReview review = reviewService.rejectReview(id);
        return Result.success(review);
    }
}
