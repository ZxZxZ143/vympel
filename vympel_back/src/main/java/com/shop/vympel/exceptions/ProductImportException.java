package com.shop.vympel.exceptions;

import org.springframework.http.HttpStatus;

public class ProductImportException extends RuntimeException {
    private final String code;
    private final HttpStatus status;

    public ProductImportException(String code, HttpStatus status, String message) {
        super(message);
        this.code = code;
        this.status = status;
    }

    public ProductImportException(String code, HttpStatus status, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
        this.status = status;
    }

    public String getCode() {
        return code;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
