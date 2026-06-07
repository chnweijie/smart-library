package com.library.controller;

import com.library.common.PageResult;
import com.library.common.Result;
import com.library.dto.reservation.ReservationRequest;
import com.library.entity.BookReservation;
import com.library.security.CustomUserDetails;
import com.library.service.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * 预约控制器
 */
@RestController
@RequestMapping("/reservations")
@RequiredArgsConstructor
@Tag(name = "预约管理", description = "图书预约及取消预约")
public class ReservationController {

    private final ReservationService reservationService;

    /**
     * 获取当前登录用户ID
     */
    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
        return userDetails.getId();
    }

    /**
     * 预约图书
     */
    @PostMapping
    @Operation(summary = "预约图书", description = "用户预约指定图书（仅当图书无可借库存时可预约）")
    public Result<BookReservation> reserveBook(@Valid @RequestBody ReservationRequest request) {
        Long userId = getCurrentUserId();
        BookReservation reservation = reservationService.reserveBook(userId, request);
        return Result.success(reservation);
    }

    /**
     * 取消预约
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "取消预约", description = "用户取消指定的预约记录")
    public Result<Void> cancelReservation(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        reservationService.cancelReservation(userId, id);
        return Result.success();
    }

    /**
     * 获取用户预约列表
     */
    @GetMapping
    @Operation(summary = "获取用户预约列表", description = "分页获取当前用户的预约记录")
    public Result<PageResult<BookReservation>> getUserReservations(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = getCurrentUserId();
        PageResult<BookReservation> reservations = reservationService.getUserReservations(userId, page, size);
        return Result.success(reservations);
    }
}
