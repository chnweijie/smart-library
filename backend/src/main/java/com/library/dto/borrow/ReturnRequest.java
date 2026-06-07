package com.library.dto.borrow;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 归还请求DTO
 */
@Data
public class ReturnRequest {

    @NotNull(message = "借阅记录ID不能为空")
    private Long borrowRecordId;
}
