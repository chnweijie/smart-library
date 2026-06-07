package com.library.dto.announcement;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 公告创建请求DTO
 */
@Data
public class AnnouncementCreateRequest {

    @NotBlank(message = "公告标题不能为空")
    @Size(max = 200, message = "标题长度不能超过200个字符")
    private String title;

    @NotBlank(message = "公告内容不能为空")
    @Size(max = 5000, message = "内容长度不能超过5000个字符")
    private String content;

    private Integer priority; // 1-高,2-中,3-低
}
