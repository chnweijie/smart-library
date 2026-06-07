package com.library.dto.review;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * 评价更新请求DTO
 * 所有字段可选
 */
@Data
public class ReviewUpdateRequest {

    @Min(value = 1, message = "评分最低为1")
    @Max(value = 5, message = "评分最高为5")
    private Integer rating;

    @Size(max = 2000, message = "评价内容长度不能超过2000个字符")
    private String content;

    private List<String> tags;
}
