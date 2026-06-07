package com.library.service;

import com.library.common.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Slf4j
public class FileUploadService {

    @Value("${file.upload.path:./uploads/}")
    private String uploadPath;

    @Value("${file.upload.allowed-extensions:jpg,jpeg,png,gif,webp,pdf,doc,docx,xls,xlsx}")
    private String allowedExtensions;

    @Value("${file.upload.max-size:10485760}")
    private long maxFileSize;

    @Value("${file.upload.image-max-size:5242880}")
    private long imageMaxSize;

    private static final List<String> IMAGE_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "gif", "webp");

    private static final long CHUNK_SIZE = 1024 * 1024; // 1MB per chunk

    public String uploadFile(MultipartFile file, String subDir) {
        validateFile(file);

        String originalFilename = file.getOriginalFilename();
        String extension = getExtension(originalFilename);
        String newFilename = UUID.randomUUID().toString().replace("-", "") + "." + extension;

        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        String relativePath = (subDir != null ? subDir + "/" : "") + datePath;
        Path targetDir = Paths.get(uploadPath, relativePath);

        try {
            Files.createDirectories(targetDir);
        } catch (IOException e) {
            log.error("创建上传目录失败: {}", targetDir, e);
            throw BusinessException.badRequest("文件上传失败，请稀后重试");
        }

        Path targetFile = targetDir.resolve(newFilename);
        try {
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
            log.info("文件上传成功: {}", targetFile);
        } catch (IOException e) {
            log.error("文件保存失败: {}", targetFile, e);
            throw BusinessException.badRequest("文件上传失败，请稀后重试");
        }

        return "/uploads/" + relativePath + "/" + newFilename;
    }

    public String uploadCover(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        String extension = getExtension(originalFilename);

        if (!IMAGE_EXTENSIONS.contains(extension.toLowerCase())) {
            throw BusinessException.badRequest("封面图片仅支持 jpg、jpeg、png、gif、webp 格式");
        }

        return uploadFile(file, "covers");
    }

    /**
     * 上传头像图片
     */
    public String uploadAvatar(MultipartFile file) {
        validateImageFile(file);
        return uploadFile(file, "avatars");
    }

    /**
     * 校验图片文件（格式和大小）
     */
    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw BusinessException.badRequest("上传文件不能为空");
        }

        if (file.getSize() > imageMaxSize) {
            throw BusinessException.badRequest("图片大小超过限制（最大5MB）");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw BusinessException.badRequest("文件名不能为空");
        }

        String extension = getExtension(originalFilename);
        if (!IMAGE_EXTENSIONS.contains(extension.toLowerCase())) {
            throw BusinessException.badRequest("图片仅支持 jpg、jpeg、png、gif、webp 格式");
        }
    }

    // ==================== 分片上传（断点续传） ====================

    /**
     * 上传分片
     */
    public void uploadChunk(String fileId, int chunkIndex, int totalChunks,
                            String fileName, MultipartFile chunkFile) {
        validateImageFile(chunkFile);

        Path chunkDir = getChunkDir(fileId);
        try {
            Files.createDirectories(chunkDir);
        } catch (IOException e) {
            log.error("创建分片目录失败: {}", chunkDir, e);
            throw BusinessException.badRequest("分片上传失败，请稀后重试");
        }

        // 保存元信息
        Path metaFile = chunkDir.resolve("meta.properties");
        if (!Files.exists(metaFile)) {
            try {
                Properties meta = new Properties();
                meta.setProperty("fileName", fileName);
                meta.setProperty("totalChunks", String.valueOf(totalChunks));
                meta.store(Files.newOutputStream(metaFile), "chunk upload meta");
            } catch (IOException e) {
                log.error("保存元信息失败", e);
                throw BusinessException.badRequest("分片上传失败");
            }
        }

        // 保存分片
        Path chunkPath = chunkDir.resolve(String.valueOf(chunkIndex));
        try {
            Files.copy(chunkFile.getInputStream(), chunkPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("分片上传成功: fileId={}, chunk={}/{}", fileId, chunkIndex, totalChunks);
        } catch (IOException e) {
            log.error("分片保存失败: {}", chunkPath, e);
            throw BusinessException.badRequest("分片上传失败，请稀后重试");
        }
    }

    /**
     * 检查已上传的分片
     */
    public Map<String, Object> checkChunks(String fileId) {
        Path chunkDir = getChunkDir(fileId);
        List<Integer> uploadedChunks = new ArrayList<>();

        if (Files.exists(chunkDir)) {
            File dir = chunkDir.toFile();
            File[] files = dir.listFiles((d, name) -> {
                try {
                    Integer.parseInt(name);
                    return true;
                } catch (NumberFormatException e) {
                    return false;
                }
            });
            if (files != null) {
                for (File f : files) {
                    uploadedChunks.add(Integer.parseInt(f.getName()));
                }
            }
        }

        Collections.sort(uploadedChunks);
        Map<String, Object> result = new HashMap<>();
        result.put("uploadedChunks", uploadedChunks);

        // 读取元信息
        Path metaFile = chunkDir.resolve("meta.properties");
        if (Files.exists(metaFile)) {
            try {
                Properties meta = new Properties();
                meta.load(Files.newInputStream(metaFile));
                result.put("totalChunks", Integer.parseInt(meta.getProperty("totalChunks", "0")));
                result.put("fileName", meta.getProperty("fileName", ""));
            } catch (IOException e) {
                log.error("读取元信息失败", e);
            }
        }

        return result;
    }

    /**
     * 合并分片
     */
    public String mergeChunks(String fileId) {
        Path chunkDir = getChunkDir(fileId);

        if (!Files.exists(chunkDir)) {
            throw BusinessException.badRequest("未找到分片数据，请重新上传");
        }

        // 读取元信息
        Path metaFile = chunkDir.resolve("meta.properties");
        String fileName;
        int totalChunks;
        try {
            Properties meta = new Properties();
            meta.load(Files.newInputStream(metaFile));
            fileName = meta.getProperty("fileName", "unknown.jpg");
            totalChunks = Integer.parseInt(meta.getProperty("totalChunks", "0"));
        } catch (IOException e) {
            log.error("读取元信息失败", e);
            throw BusinessException.badRequest("合并失败，元信息缺失");
        }

        // 检查所有分片是否已上传
        for (int i = 0; i < totalChunks; i++) {
            if (!Files.exists(chunkDir.resolve(String.valueOf(i)))) {
                throw BusinessException.badRequest("分片不完整，缺少分片 " + i);
            }
        }

        // 生成目标文件路径
        String extension = getExtension(fileName);
        String newFilename = UUID.randomUUID().toString().replace("-", "") + "." + extension;
        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        String relativePath = "images/" + datePath;
        Path targetDir = Paths.get(uploadPath, relativePath);

        try {
            Files.createDirectories(targetDir);
        } catch (IOException e) {
            log.error("创建目标目录失败: {}", targetDir, e);
            throw BusinessException.badRequest("文件合并失败");
        }

        // 合并分片
        Path targetFile = targetDir.resolve(newFilename);
        try (RandomAccessFile raf = new RandomAccessFile(targetFile.toFile(), "rw")) {
            for (int i = 0; i < totalChunks; i++) {
                Path chunkPath = chunkDir.resolve(String.valueOf(i));
                byte[] chunkData = Files.readAllBytes(chunkPath);
                raf.write(chunkData);
            }
        } catch (IOException e) {
            log.error("合并分片失败", e);
            throw BusinessException.badRequest("文件合并失败");
        }

        // 清理分片
        try {
            deleteDirectory(chunkDir.toFile());
        } catch (IOException e) {
            log.warn("清理分片目录失败: {}", chunkDir, e);
        }

        String url = "/uploads/" + relativePath + "/" + newFilename;
        log.info("分片合并成功: {}", url);
        return url;
    }

    private Path getChunkDir(String fileId) {
        return Paths.get(uploadPath, "chunks", fileId);
    }

    private void deleteDirectory(File directory) throws IOException {
        File[] files = directory.listFiles();
        if (files != null) {
            for (File file : files) {
                if (file.isDirectory()) {
                    deleteDirectory(file);
                } else {
                    Files.delete(file.toPath());
                }
            }
        }
        Files.delete(directory.toPath());
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw BusinessException.badRequest("上传文件不能为空");
        }

        if (file.getSize() > maxFileSize) {
            throw BusinessException.badRequest("文件大小超过限制（最大10MB）");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw BusinessException.badRequest("文件名不能为空");
        }

        String extension = getExtension(originalFilename);
        List<String> allowed = Arrays.asList(allowedExtensions.split(","));
        if (!allowed.contains(extension.toLowerCase())) {
            throw BusinessException.badRequest("不支持的文件类型，允许的类型：" + allowedExtensions);
        }
    }

    private String getExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex == -1 || dotIndex == filename.length() - 1) {
            throw BusinessException.badRequest("文件缺少扩展名");
        }
        return filename.substring(dotIndex + 1).toLowerCase();
    }
}
