package com.library.dto.review;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * 评价创建请求DTO
 */
@Data
public class ReviewCreateRequest {

    @NotNull(message = "图书ID不能为空")
    private Long bookId;

    @NotNull(message = "评分不能为空")
    @Min(value = 1, message = "评分最低为1")
    @Max(value = 5, message = "评分最高为5")
    private Integer rating;

    @Size(max = 2000, message = "评价内容长度不能超过2000个字符")
    private String content;

    private List<String> tags;
}
