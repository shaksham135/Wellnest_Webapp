package com.wellnest.app.controller;

import com.wellnest.app.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/contact")
public class ContactController {

    @Autowired
    private EmailService emailService;

    @PostMapping("/submit")
    public ResponseEntity<?> submitContactForm(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String topic = request.get("topic");
        String message = request.get("message");

        if (email == null || message == null) {
            return ResponseEntity.badRequest().body("Email and message are required.");
        }

        // Send email asynchronously can be handled here, but sync is fine for MVP
        emailService.sendContactMessage(email, topic, message);

        return ResponseEntity.ok(Map.of("message", "Message sent successfully"));
    }
}
