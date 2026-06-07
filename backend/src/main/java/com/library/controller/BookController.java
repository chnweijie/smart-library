package com.library.controller;

import com.library.common.PageResult;
import com.library.common.Result;
import com.library.dto.book.BookCreateRequest;
import com.library.dto.book.BookUpdateRequest;
import com.library.entity.Book;
import com.library.service.BookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 图书控制器
 */
@RestController
@RequestMapping("/books")
@RequiredArgsConstructor
@Tag(name = "图书管理", description = "图书的增删改查及相似推荐")
public class BookController {

    private final BookService bookService;

    /**
     * 获取图书列表
     */
    @GetMapping
    @Operation(summary = "获取图书列表", description = "支持关键词搜索和分类筛选，分页返回图书列表")
    public Result<PageResult<Book>> getBooks(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "100") int size) {
        PageResult<Book> books = bookService.getAllBooks(keyword, categoryId, page, size);
        return Result.success(books);
    }

    /**
     * 获取图书详情
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取图书详情", description = "根据图书ID获取图书详细信息")
    public Result<Book> getBookById(@PathVariable Long id) {
        Book book = bookService.getBookById(id);
        return Result.success(book);
    }

    /**
     * 创建图书（管理员）
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "创建图书", description = "管理员新增图书")
    public Result<Book> createBook(@Valid @RequestBody BookCreateRequest request) {
        Book book = bookService.createBook(request);
        return Result.success(book);
    }

    /**
     * 更新图书（管理员）
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "更新图书", description = "管理员修改图书信息")
    public Result<Book> updateBook(@PathVariable Long id, @RequestBody BookUpdateRequest request) {
        Book book = bookService.updateBook(id, request);
        return Result.success(book);
    }

    /**
     * 删除图书（管理员）
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "删除图书", description = "管理员删除指定图书")
    public Result<Void> deleteBook(@PathVariable Long id) {
        bookService.deleteBook(id);
        return Result.success();
    }

    /**
     * 获取相似图书
     */
    @GetMapping("/{id}/similar")
    @Operation(summary = "获取相似图书", description = "根据图书分类和评分推荐相似图书")
    public Result<List<Book>> getSimilarBooks(@PathVariable Long id) {
        List<Book> books = bookService.getSimilarBooks(id);
        return Result.success(books);
    }
}
