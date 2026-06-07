package com.library.dto.book;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/**
 * 图书创建请求DTO
 */
@Data
public class BookCreateRequest {

    @Size(max = 20, message = "ISBN长度不能超过20个字符")
    private String isbn;

    @NotBlank(message = "书名不能为空")
    @Size(max = 200, message = "书名长度不能超过200个字符")
    private String title;

    @NotBlank(message = "作者不能为空")
    @Size(max = 100, message = "作者长度不能超过100个字符")
    private String author;

    @Size(max = 100, message = "出版社长度不能超过100个字符")
    private String publisher;

    private LocalDate publishDate;

    @NotNull(message = "分类ID不能为空")
    private Long categoryId;

    @Size(max = 2000, message = "描述长度不能超过2000个字符")
    private String description;

    @Size(max = 500, message = "封面URL长度不能超过500个字符")
    private String coverUrl;

    @Size(max = 100, message = "书架位置长度不能超过100个字符")
    private String location;

    @NotNull(message = "库存数量不能为空")
    @Min(value = 0, message = "库存数量不能为负数")
    private Integer totalCount;
}
