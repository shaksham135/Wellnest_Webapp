package com.wellnest.app.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Backend is up and running!");
    }

    @GetMapping("/")
    public ResponseEntity<String> rootCheck() {
        return ResponseEntity.ok("Wellnest Backend is running. Use /api/... endpoints.");
    }
}
