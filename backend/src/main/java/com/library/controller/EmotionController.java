package com.library.controller;

import com.library.common.PageResult;
import com.library.common.Result;
import com.library.dto.emotion.EmotionRecordRequest;
import com.library.entity.Book;
import com.library.entity.EmotionRecord;
import com.library.security.CustomUserDetails;
import com.library.service.EmotionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 情绪分析控制器
 */
@RestController
@RequestMapping("/emotion")
@RequiredArgsConstructor
@Tag(name = "情绪分析", description = "情绪记录、历史查询及基于情绪的图书推荐")
public class EmotionController {

    private final EmotionService emotionService;

    /**
     * 获取当前登录用户ID
     */
    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
        return userDetails.getId();
    }

    /**
     * 记录情绪
     */
    @PostMapping("/record")
    @Operation(summary = "记录情绪", description = "记录用户当前情绪状态及置信度")
    public Result<EmotionRecord> recordEmotion(@Valid @RequestBody EmotionRecordRequest request) {
        Long userId = getCurrentUserId();
        EmotionRecord record = emotionService.recordEmotion(userId, request);
        return Result.success(record);
    }

    /**
     * 更新情绪记录关联的图书
     */
    @PutMapping("/record/{id}/book")
    @Operation(summary = "关联图书", description = "借阅图书后，将图书ID关联到情绪记录")
    public Result<Void> updateEmotionBookId(
            @PathVariable Long id,
            @RequestParam Long bookId) {
        Long userId = getCurrentUserId();
        emotionService.updateEmotionBookId(id, userId, bookId);
        return Result.success();
    }

    /**
     * 获取情绪历史
     */
    @GetMapping("/history")
    @Operation(summary = "获取情绪历史", description = "分页获取当前用户的情绪记录历史")
    public Result<PageResult<EmotionRecord>> getEmotionHistory(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = getCurrentUserId();
        PageResult<EmotionRecord> history = emotionService.getUserEmotionHistory(userId, page, size);
        return Result.success(history);
    }

    /**
     * 根据情绪推荐图书
     */
    @GetMapping("/recommend")
    @Operation(summary = "根据情绪推荐图书", description = "根据指定情绪类型推荐适合的图书列表")
    public Result<List<Book>> getRecommendedBooks(@RequestParam String emotion) {
        List<Book> books = emotionService.getRecommendedBooks(emotion);
        return Result.success(books);
    }
}
