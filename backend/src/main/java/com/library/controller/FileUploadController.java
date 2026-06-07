package com.library.controller;

import com.library.common.Result;
import com.library.service.FileUploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
@Tag(name = "文件管理", description = "文件上传接口")
public class FileUploadController {

    private final FileUploadService fileUploadService;

    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "通用文件上传", description = "上传文件，返回文件访问URL")
    public Result<Map<String, String>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "subDir", required = false) String subDir) {
        String url = fileUploadService.uploadFile(file, subDir);
        return Result.success(Map.of("url", url));
    }

    @PostMapping("/upload/cover")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "封面上传", description = "上传图书封面图片，仅限图片格式")
    public Result<Map<String, String>> uploadCover(@RequestParam("file") MultipartFile file) {
        String url = fileUploadService.uploadCover(file);
        return Result.success(Map.of("url", url));
    }

    @PostMapping("/upload/avatar")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "头像上传", description = "上传用户头像图片，仅限JPG/PNG/GIF/WEBP格式，最大5MB")
    public Result<Map<String, String>> uploadAvatar(@RequestParam("file") MultipartFile file) {
        String url = fileUploadService.uploadAvatar(file);
        return Result.success(Map.of("url", url));
    }

    // ==================== 分片上传（断点续传） ====================

    @PostMapping("/upload/chunk")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "分片上传", description = "上传文件分片，支持断点续传")
    public Result<Void> uploadChunk(
            @RequestParam("file") MultipartFile file,
            @RequestParam("fileId") String fileId,
            @RequestParam("chunkIndex") int chunkIndex,
            @RequestParam("totalChunks") int totalChunks,
            @RequestParam("fileName") String fileName) {
        fileUploadService.uploadChunk(fileId, chunkIndex, totalChunks, fileName, file);
        return Result.success();
    }

    @GetMapping("/upload/chunk-check")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "检查已上传分片", description = "查询已上传的分片列表，用于断点续传")
    public Result<Map<String, Object>> checkChunks(@RequestParam("fileId") String fileId) {
        Map<String, Object> result = fileUploadService.checkChunks(fileId);
        return Result.success(result);
    }

    @PostMapping("/upload/merge")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "合并分片", description = "合并所有分片为完整文件")
    public Result<Map<String, String>> mergeChunks(@RequestParam("fileId") String fileId) {
        String url = fileUploadService.mergeChunks(fileId);
        return Result.success(Map.of("url", url));
    }
}
