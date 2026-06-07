package com.library.dto.emotion;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 情绪记录请求DTO
 */
@Data
public class EmotionRecordRequest {

    @NotBlank(message = "情绪类型不能为空")
    private String emotion;

    @NotNull(message = "置信度不能为空")
    private Double confidence;

    private Long bookId;
}
