package com.wellnest.app.controller;

import com.wellnest.app.dto.WeightLogRequest;
import com.wellnest.app.model.User;
import com.wellnest.app.service.UserService;
import com.wellnest.app.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/weight-logs")
@CrossOrigin(origins = "http://localhost:3000")
public class WeightLogController {

        private final UserService userService;
        private final UserRepository userRepository;

        public WeightLogController(UserService userService, UserRepository userRepository) {
                this.userService = userService;
                this.userRepository = userRepository;
        }

        /**
         * Log today's weight using UserService.
         * Handles backfilling and overwriting logic centrally.
         */
        @PostMapping
        public ResponseEntity<?> logWeight(
                        @RequestBody WeightLogRequest request,
                        Authentication authentication) {

                System.out.println("DEBUG WEIGHT: Request received");
                // 🔐 AUTH CHECK
                if (authentication == null || authentication.getName() == null) {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
                }

                Double weight = request.getWeightKg();

                // ✅ STRICT VALIDATION
                if (weight == null) {
                        return ResponseEntity.badRequest().body("Weight is required");
                }

                if (weight < 30 || weight > 300) {
                        return ResponseEntity.badRequest().body("Weight must be between 30kg and 300kg");
                }

                User user = userRepository.findByEmail(authentication.getName())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                // 🔄 DELEGATE TO SERVICE
                // This handles:
                // 1. Backfilling logic (if no history or only-today history exists)
                // 2. Same-day overwrite logic
                // 3. User entity update
                userService.updateWeight(user, weight);

                return ResponseEntity.ok("Weight logged successfully");
        }

        @DeleteMapping
        public ResponseEntity<?> clearHistory(Authentication authentication) {
                if (authentication == null || authentication.getName() == null) {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
                }

                User user = userRepository.findByEmail(authentication.getName())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                userService.clearWeightHistory(user);

                return ResponseEntity.ok("Weight history cleared and reset to current.");
        }
}
