package com.library.dto.auth;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * 人脸登录请求DTO
 */
@Data
public class FaceLoginRequest {

    /** 单帧特征数据，支持 JSON 数组或 JSON 字符串 */
    @NotNull(message = "人脸特征数据不能为空")
    private Object faceFeature;

    /** 多帧特征数据，用于一致性验证（至少2帧匹配同一用户才允许登录） */
    private List<Object> faceFeatures;
}
