package com.shop.vympel.dtos;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
public class ApiErrorResponse {
    private Instant timestamp;
    private int status;
    private String code;
    private String message;
    private String requestId;
    private String path;
    private Long retryAfterSeconds;
    private Map<String, String> details;
}
