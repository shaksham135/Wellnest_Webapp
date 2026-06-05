package com.wellnest.app.controller;

import com.wellnest.app.model.Feedback;
import com.wellnest.app.model.User;
import com.wellnest.app.repository.FeedbackRepository;
import com.wellnest.app.service.EmailService;
import com.wellnest.app.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
@CrossOrigin
public class FeedbackController {

    private final FeedbackRepository feedbackRepository;
    private final UserService userService;
    private final EmailService emailService;

    public FeedbackController(FeedbackRepository feedbackRepository,
                              UserService userService,
                              EmailService emailService) {
        this.feedbackRepository = feedbackRepository;
        this.userService = userService;
        this.emailService = emailService;
    }

    @PostMapping
    public ResponseEntity<?> submitFeedback(@RequestBody Map<String, Object> payload, Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized access. Please log in first."));
        }

        String email = auth.getName();
        User user = userService.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "User not found."));
        }

        String category = (String) payload.get("category");
        Object ratingObj = payload.get("rating");
        String feedbackText = (String) payload.get("feedbackText");

        if (category == null || category.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Category is required (e.g. BUG, SUGGESTION, USABILITY, OTHER)."));
        }

        if (feedbackText == null || feedbackText.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Feedback text is required."));
        }

        Integer rating = 5;
        if (ratingObj instanceof Number) {
            rating = ((Number) ratingObj).intValue();
        } else if (ratingObj instanceof String) {
            try {
                rating = Integer.parseInt((String) ratingObj);
            } catch (NumberFormatException ignored) {}
        }

        if (rating < 1 || rating > 5) {
            return ResponseEntity.badRequest().body(Map.of("error", "Rating must be between 1 and 5."));
        }

        Feedback feedback = new Feedback(user, category.trim().toUpperCase(), rating, feedbackText.trim());
        feedbackRepository.save(feedback);

        // Send Async admin notification
        try {
            emailService.sendFeedbackNotification(
                    user.getEmail(),
                    user.getName(),
                    category.trim().toUpperCase(),
                    feedbackText.trim(),
                    rating
            );
        } catch (Exception e) {
            System.err.println("Error sending feedback notification email: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of(
            "message", "Feedback submitted successfully! Thank you for helping us improve Wellnest. 🚀"
        ));
    }
}
