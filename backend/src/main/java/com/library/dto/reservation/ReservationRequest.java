package com.library.dto.reservation;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 预约请求DTO
 */
@Data
public class ReservationRequest {

    @NotNull(message = "图书ID不能为空")
    private Long bookId;
}
