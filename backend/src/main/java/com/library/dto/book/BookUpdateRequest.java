package com.library.dto.book;

import lombok.Data;

import java.time.LocalDate;

/**
 * 图书更新请求DTO
 * 所有字段可选，仅更新传入的字段
 */
@Data
public class BookUpdateRequest {

    private String isbn;
    private String title;
    private String author;
    private String publisher;
    private LocalDate publishDate;
    private Long categoryId;
    private String description;
    private String coverUrl;
    private String location;
    private Integer totalCount;
}
