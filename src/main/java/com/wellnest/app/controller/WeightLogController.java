package com.wellnest.app.controller;

import com.wellnest.app.dto.WeightLogRequest;
import com.wellnest.app.model.User;
import com.wellnest.app.model.WeightLog;
import com.wellnest.app.repository.UserRepository;
import com.wellnest.app.repository.WeightLogRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/weight-logs")
@CrossOrigin(origins = "http://localhost:3000")
public class WeightLogController {

        private final WeightLogRepository weightLogRepository;
        private final UserRepository userRepository;

        public WeightLogController(
                        WeightLogRepository weightLogRepository,
                        UserRepository userRepository) {
                this.weightLogRepository = weightLogRepository;
                this.userRepository = userRepository;
        }

        /**
         * Log today's weight
         * - Only ONE entry per day (overwrite allowed)
         * - Valid human range: 30kg – 300kg
         */
        @PostMapping
        public ResponseEntity<?> logWeight(
                        @RequestBody WeightLogRequest request,
                        Authentication authentication) {

                System.out.println("DEBUG WEIGHT: Request received");
                // 🔐 AUTH CHECK
                if (authentication == null || authentication.getName() == null) {
                        System.out.println("DEBUG WEIGHT: Auth is null or name is null. Auth obj: " + authentication);
                        return ResponseEntity
                                        .status(HttpStatus.UNAUTHORIZED)
                                        .body("Unauthorized");
                }
                System.out.println("DEBUG WEIGHT: Auth success for user: " + authentication.getName());

                Double weight = request.getWeightKg();

                // ✅ STRICT VALIDATION
                if (weight == null) {
                        return ResponseEntity
                                        .badRequest()
                                        .body("Weight is required");
                }

                if (weight < 30 || weight > 300) {
                        return ResponseEntity
                                        .badRequest()
                                        .body("Weight must be between 30kg and 300kg");
                }

                User user = userRepository
                                .findByEmail(authentication.getName())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                LocalDate today = LocalDate.now();

                // 🔁 SAME DAY OVERWRITE (BEST PRACTICE)
                List<WeightLog> todayLogs = weightLogRepository.findByUserIdAndLogDateBetween(
                                user.getId(), today, today);

                if (!todayLogs.isEmpty()) {
                        weightLogRepository.deleteAll(todayLogs);
                }

                // 💾 SAVE NEW LOG
                WeightLog log = new WeightLog();
                log.setUser(user);
                log.setWeightKg(weight);
                log.setLogDate(today);
                weightLogRepository.save(log);

                // 🔄 UPDATE CURRENT WEIGHT ON USER
                user.setWeightKg(weight);
                userRepository.save(user);

                return ResponseEntity.ok("Weight logged successfully");
        }
}
