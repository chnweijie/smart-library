package com.library.dto.borrow;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 借阅请求DTO
 */
@Data
public class BorrowRequest {

    @NotNull(message = "图书ID不能为空")
    private Long bookId;
}
