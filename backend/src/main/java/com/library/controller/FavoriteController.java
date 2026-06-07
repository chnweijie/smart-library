package com.library.controller;

import com.library.common.PageResult;
import com.library.common.Result;
import com.library.entity.Favorite;
import com.library.security.CustomUserDetails;
import com.library.service.FavoriteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * 收藏控制器
 */
@RestController
@RequestMapping("/favorites")
@RequiredArgsConstructor
@Tag(name = "收藏管理", description = "图书收藏的切换、查询及状态检查")
public class FavoriteController {

    private final FavoriteService favoriteService;

    /**
     * 获取当前登录用户ID
     */
    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
        return userDetails.getId();
    }

    /**
     * 切换收藏状态
     */
    @PostMapping("/{bookId}")
    @Operation(summary = "切换收藏状态", description = "对指定图书进行收藏或取消收藏，返回true表示已收藏，false表示已取消")
    public Result<Boolean> toggleFavorite(@PathVariable Long bookId) {
        Long userId = getCurrentUserId();
        boolean favorited = favoriteService.toggleFavorite(userId, bookId);
        return Result.success(favorited);
    }

    /**
     * 获取用户收藏列表
     */
    @GetMapping
    @Operation(summary = "获取用户收藏列表", description = "分页获取当前用户的收藏图书列表")
    public Result<PageResult<Favorite>> getUserFavorites(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = getCurrentUserId();
        PageResult<Favorite> favorites = favoriteService.getUserFavorites(userId, page, size);
        return Result.success(favorites);
    }

    /**
     * 检查是否已收藏
     */
    @GetMapping("/{bookId}/check")
    @Operation(summary = "检查是否已收藏", description = "检查当前用户是否已收藏指定图书")
    public Result<Boolean> checkFavorite(@PathVariable Long bookId) {
        Long userId = getCurrentUserId();
        boolean isFavorited = favoriteService.isFavorite(userId, bookId);
        return Result.success(isFavorited);
    }
}
