package com.IRCTC.IRCTC.BackEnd.Controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(
            ResponseStatusException ex
    ) {
        return build(
                ex.getStatusCode().value(),
                ex.getReason() == null ? "Request failed" : ex.getReason()
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception ex) {
        return build(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                ex.getMessage() == null ? "Internal server error" : ex.getMessage()
        );
    }

    private ResponseEntity<Map<String, Object>> build(
            int status,
            String message
    ) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status);
        body.put("error", HttpStatus.valueOf(status).getReasonPhrase());
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }
}
