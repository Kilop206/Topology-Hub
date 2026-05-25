package com.kns.topologiesFiles.exception;

public class ApiError extends RuntimeException {
    public ApiError(String message) {
        super(message);
    }
}
