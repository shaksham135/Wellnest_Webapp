package com.wellnest.app.controller;

import com.wellnest.app.model.User;
import com.wellnest.app.model.Trainer;
import com.wellnest.app.model.BetaRequest;
import com.wellnest.app.repository.UserRepository;
import com.wellnest.app.repository.TrainerRepository;
import com.wellnest.app.repository.UserActivityLogRepository;
import com.wellnest.app.repository.WorkoutRepository;
import com.wellnest.app.repository.MealRepository;
import com.wellnest.app.repository.WaterIntakeRepository;
import com.wellnest.app.repository.SleepLogRepository;
import com.wellnest.app.repository.BetaRequestRepository;
import com.wellnest.app.dto.TrainerResponse;
import com.wellnest.app.service.NotificationService;
import com.wellnest.app.service.TrainerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final TrainerRepository trainerRepository;
    private final com.wellnest.app.service.UserService userService;
    private final com.wellnest.app.service.BlogService blogService;
    private final com.wellnest.app.service.TrackerService trackerService;
    private final TrainerService trainerService;
    private final NotificationService notificationService;
    private final com.wellnest.app.service.SystemSettingsService systemSettingsService;
    private final UserActivityLogRepository userActivityLogRepository;
    private final WorkoutRepository workoutRepository;
    private final MealRepository mealRepository;
    private final WaterIntakeRepository waterIntakeRepository;
    private final SleepLogRepository sleepLogRepository;
    private final BetaRequestRepository betaRequestRepository;
    private final com.wellnest.app.repository.FeedbackRepository feedbackRepository;
    private final com.wellnest.app.service.EmailService emailService;

    public AdminController(UserRepository userRepository, TrainerRepository trainerRepository,
            com.wellnest.app.service.UserService userService,
            com.wellnest.app.service.BlogService blogService,
            com.wellnest.app.service.TrackerService trackerService,
            TrainerService trainerService,
            NotificationService notificationService,
            com.wellnest.app.service.SystemSettingsService systemSettingsService,
            UserActivityLogRepository userActivityLogRepository,
            WorkoutRepository workoutRepository,
            MealRepository mealRepository,
            WaterIntakeRepository waterIntakeRepository,
            SleepLogRepository sleepLogRepository,
            BetaRequestRepository betaRequestRepository,
            com.wellnest.app.repository.FeedbackRepository feedbackRepository,
            com.wellnest.app.service.EmailService emailService) {
        this.userRepository = userRepository;
        this.trainerRepository = trainerRepository;
        this.userService = userService;
        this.blogService = blogService;
        this.trackerService = trackerService;
        this.trainerService = trainerService;
        this.notificationService = notificationService;
        this.systemSettingsService = systemSettingsService;
        this.userActivityLogRepository = userActivityLogRepository;
        this.workoutRepository = workoutRepository;
        this.mealRepository = mealRepository;
        this.waterIntakeRepository = waterIntakeRepository;
        this.sleepLogRepository = sleepLogRepository;
        this.betaRequestRepository = betaRequestRepository;
        this.feedbackRepository = feedbackRepository;
        this.emailService = emailService;
    }

    @GetMapping("/metrics")
    public ResponseEntity<?> getSystemMetrics() {
        long totalUsers = userRepository.count();
        long premiumUsers = userRepository.findAll().stream().filter(User::isPremium).count();
        long totalTrainers = trainerRepository.count();
        
        java.util.Map<String, Object> metrics = new java.util.HashMap<>();
        metrics.put("totalUsers", totalUsers);
        metrics.put("premiumUsers", premiumUsers);
        metrics.put("totalTrainers", totalTrainers);
        metrics.put("aiEnabled", systemSettingsService.isAiEnabled());
        metrics.put("totalTokens", systemSettingsService.getSettings().getTotalTokensUsed());
        
        return ResponseEntity.ok(metrics);
    }

    @PutMapping("/settings/ai")
    public ResponseEntity<?> toggleAiStatus(@RequestParam boolean enabled) {
        systemSettingsService.setAiEnabled(enabled);
        return ResponseEntity.ok(java.util.Map.of("aiEnabled", enabled, "message", "System AI changed to " + enabled));
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        // Self-heal: If a trainer is verified but user is not, sync them
        boolean changed = false;
        for (User user : users) {
            if ("ROLE_TRAINER".equals(user.getRole()) && !user.isVerified()) {
                java.util.Optional<Trainer> trainerOpt = trainerRepository.findByEmail(user.getEmail());
                if (trainerOpt.isPresent() && trainerOpt.get().isVerified()) {
                    user.setVerified(true);
                    user.setVerificationRequested(false);
                    userRepository.save(user);
                    changed = true;
                }
            }
        }
        // If we fixed anything, return fresh list
        if (changed) return ResponseEntity.ok(userRepository.findAll());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/trainers")
    public ResponseEntity<List<Trainer>> getAllTrainers() {
        return ResponseEntity.ok(trainerRepository.findAll());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        User user = userRepository.findById(id).get();

        // 1. Cleanup Blog Content (Posts, Comments, Likes)
        blogService.cleanupUserContent(id);

        // 2. Cleanup Weight Logs & Tracker Data
        userService.clearWeightHistory(user);
        trackerService.cleanupUserData(id);

        // 3. Delete Trainer Profile if exists
        trainerRepository.findByUserId(id).ifPresent(trainerRepository::delete);

        // 4. Delete User
        userRepository.deleteById(id);
        return ResponseEntity.ok("User deleted successfully");
    }

    @DeleteMapping("/trainers/{id}")
    public ResponseEntity<?> deleteTrainer(@PathVariable Long id) {
        return trainerRepository.findById(id).map(trainer -> {
            User user = trainer.getUser();
            trainerRepository.delete(trainer);

            // Also delete the user account associated with this trainer
            if (user != null) {
                blogService.cleanupUserContent(user.getId());
                userService.clearWeightHistory(user);
                trackerService.cleanupUserData(user.getId());
                userRepository.delete(user);
            }
            return ResponseEntity.ok("Trainer (and associated user) deleted successfully");
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}/verify")
    public ResponseEntity<?> toggleVerification(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            boolean newStatus = !user.isVerified();
            user.setVerified(newStatus);
            // If verified, request is fulfilled
            if (newStatus) {
                user.setVerificationRequested(false);
            }
            userRepository.save(user);
            return ResponseEntity.ok("User verification status updated to: " + newStatus);
        }).orElse(ResponseEntity.notFound().build());
    }

    // GET /api/admin/trainers/pending-verifications — list trainers awaiting cert review
    @GetMapping("/trainers/pending-verifications")
    public ResponseEntity<List<Trainer>> getPendingVerifications() {
        List<Trainer> pending = trainerRepository.findByVerificationRequestedTrue();
        return ResponseEntity.ok(pending);
    }

    // PUT /api/admin/trainers/{id}/verify — approve a trainer's verification
    @PutMapping("/trainers/{id}/verify")
    public ResponseEntity<?> verifyTrainer(@PathVariable Long id) {
        return trainerRepository.findById(id).map(trainer -> {
            trainer.setVerified(true);
            trainer.setVerificationRequested(false);
            
            // Sync with User entity (Robust sync)
            User user = trainer.getUser();
            if (user == null && trainer.getEmail() != null) {
                user = userRepository.findByEmail(trainer.getEmail()).orElse(null);
            }
            
            if (user != null) {
                user.setVerified(true);
                user.setVerificationRequested(false);
                userRepository.save(user);
            }
            
            trainerRepository.save(trainer);
            
            // Notify Trainer
            if (user != null) {
                notificationService.createNotification(user.getId(), "Verification Approved!", 
                    "Congratulations! Your trainer profile has been verified. You can now connect with clients.", "SUCCESS");
            }
            
            return ResponseEntity.ok("Trainer verified successfully");
        }).orElse(ResponseEntity.notFound().build());
    }

    // PUT /api/admin/trainers/{id}/reject — reject a trainer's verification request
    @PutMapping("/trainers/{id}/reject")
    public ResponseEntity<?> rejectTrainerVerification(@PathVariable Long id) {
        return trainerRepository.findById(id).map(trainer -> {
            trainer.setVerified(false);
            trainer.setVerificationRequested(false);
            
            // Sync with User entity (Robust sync)
            User user = trainer.getUser();
            if (user == null && trainer.getEmail() != null) {
                user = userRepository.findByEmail(trainer.getEmail()).orElse(null);
            }
            
            if (user != null) {
                user.setVerified(false);
                user.setVerificationRequested(false);
                userRepository.save(user);
            }
            
            // Clear the certificates on rejection so trainer can re-upload
            trainer.setCertificate1(null);
            trainer.setCertificate2(null);
            trainer.setCertificate3(null);
            trainerRepository.save(trainer);

            // Notify Trainer
            if (user != null) {
                notificationService.createNotification(user.getId(), "Verification Rejected", 
                    "Your trainer verification request was rejected. Please ensure your certificates are valid and try again.", "ALERT");
            }

            return ResponseEntity.ok("Trainer verification request rejected");
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/notifications/broadcast")
    public ResponseEntity<?> broadcastNotification(@RequestBody java.util.Map<String, String> payload) {
        String title = payload.get("title");
        String message = payload.get("message");
        String type = payload.getOrDefault("type", "INFO");
        String target = payload.getOrDefault("target", "ALL");

        if (title == null || message == null) {
            return ResponseEntity.badRequest().body("Title and Message are required");
        }

        notificationService.broadcastNotification(title, message, type, target);
        return ResponseEntity.accepted().body("Notification broadcasted successfully to target audience: " + target);
    }

    @PutMapping("/users/{id}/premium")
    public ResponseEntity<?> togglePremium(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            boolean isPremium = !user.isPremium();
            user.setPremium(isPremium);
            userRepository.save(user);
            
            if (isPremium) {
                notificationService.createNotification(user.getId(), "Welcome to Premium!", 
                    "You have been upgraded to Wellnest Premium! Enjoy full access to AI diagnostics and advanced metrics.", "SUCCESS");
                try {
                    emailService.sendPremiumAccessGrantedEmail(user.getEmail(), user.getName(), "PAID_PREMIUM");
                } catch (Exception e) {
                    System.err.println("Error sending manual premium upgrade email: " + e.getMessage());
                }
            } else {
                notificationService.createNotification(user.getId(), "Premium Revoked", 
                    "Your Wellnest Premium subscription has ended. Contact support for any queries.", "ALERT");
            }
            
            return ResponseEntity.ok(java.util.Map.of("message", "User premium status updated", "isPremium", isPremium));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}/suspend")
    public ResponseEntity<?> toggleSuspension(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            boolean isSuspended = !user.isSuspended();
            user.setSuspended(isSuspended);
            userRepository.save(user);
            return ResponseEntity.ok(java.util.Map.of("message", "User suspension status updated", "isSuspended", isSuspended));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/retention")
    public ResponseEntity<?> getRetentionMetrics() {
        List<User> allUsers = userRepository.findAll();
        long totalSignups = allUsers.size();
        long firstVoiceLogCount = allUsers.stream().filter(u -> u.getFirstVoiceLogAt() != null).count();
        double firstVoiceLogRate = totalSignups > 0 ? ((double) firstVoiceLogCount / totalSignups) * 100 : 0.0;

        long day2Eligible = 0;
        long day2Returned = 0;
        long day7Eligible = 0;
        long day7Returned = 0;

        java.time.LocalDate today = java.time.LocalDate.now();
        for (User u : allUsers) {
            if (u.getCreatedAt() != null) {
                java.time.LocalDate signupDate = u.getCreatedAt().toLocalDate();
                
                // Day 2 (signup + 1)
                if (signupDate.isBefore(today)) {
                    day2Eligible++;
                    if (userActivityLogRepository.existsByUserIdAndActiveDate(u.getId(), signupDate.plusDays(1))) {
                        day2Returned++;
                    }
                }
                
                // Day 7 (signup + 6)
                if (signupDate.isBefore(today.minusDays(5))) {
                    day7Eligible++;
                    if (userActivityLogRepository.existsByUserIdAndActiveDate(u.getId(), signupDate.plusDays(6))) {
                        day7Returned++;
                    }
                }
            }
        }

        double day2ReturnRate = day2Eligible > 0 ? ((double) day2Returned / day2Eligible) * 100 : 0.0;
        double day7ReturnRate = day7Eligible > 0 ? ((double) day7Returned / day7Eligible) * 100 : 0.0;

        // Voice Usage Rate: voiceLogsCount / totalLogsCount
        long wVoice = workoutRepository.findAll().stream().filter(w -> w.getNotes() != null && w.getNotes().contains("Voice Log")).count();
        long mVoice = mealRepository.findAll().stream().filter(m -> m.getNotes() != null && m.getNotes().contains("Voice Log")).count();
        long waVoice = waterIntakeRepository.findAll().stream().filter(wa -> wa.getNotes() != null && wa.getNotes().contains("Voice Log")).count();
        long sVoice = sleepLogRepository.findAll().stream().filter(s -> s.getNotes() != null && s.getNotes().contains("Voice Log")).count();
        long voiceLogsCount = wVoice + mVoice + waVoice + sVoice;

        long totalWorkouts = workoutRepository.count();
        long totalMeals = mealRepository.count();
        long totalWater = waterIntakeRepository.count();
        long totalSleep = sleepLogRepository.count();
        long totalLogsCount = totalWorkouts + totalMeals + totalWater + totalSleep;

        double voiceUsageRate = totalLogsCount > 0 ? ((double) voiceLogsCount / totalLogsCount) * 100 : 0.0;

        java.util.Map<String, Object> retentionData = new java.util.HashMap<>();
        retentionData.put("totalSignups", totalSignups);
        retentionData.put("firstVoiceLogCount", firstVoiceLogCount);
        retentionData.put("firstVoiceLogRate", Math.round(firstVoiceLogRate * 10.0) / 10.0);
        retentionData.put("day2ReturnRate", Math.round(day2ReturnRate * 10.0) / 10.0);
        retentionData.put("day7ReturnRate", Math.round(day7ReturnRate * 10.0) / 10.0);
        retentionData.put("voiceLogsCount", voiceLogsCount);
        retentionData.put("totalLogsCount", totalLogsCount);
        retentionData.put("voiceUsageRate", Math.round(voiceUsageRate * 10.0) / 10.0);

        return ResponseEntity.ok(retentionData);
    }

    // ===== BETA PREMIUM MANAGEMENT =====

    /**
     * GET /api/admin/beta-requests — list all beta access requests
     */
    @GetMapping("/beta-requests")
    public ResponseEntity<?> getBetaRequests(@RequestParam(defaultValue = "ALL") String status) {
        List<BetaRequest> requests;
        if ("ALL".equalsIgnoreCase(status)) {
            requests = betaRequestRepository.findAllByOrderByCreatedAtDesc();
        } else {
            requests = betaRequestRepository.findByStatusOrderByCreatedAtDesc(status.toUpperCase());
        }
        // Map to safe response (avoid lazy load issues)
        var response = requests.stream().map(r -> {
            java.util.Map<String, Object> item = new java.util.HashMap<>();
            item.put("id", r.getId());
            item.put("userId", r.getUser().getId());
            item.put("userName", r.getUser().getName());
            item.put("userEmail", r.getUser().getEmail());
            item.put("message", r.getMessage());
            item.put("status", r.getStatus());
            item.put("adminNotes", r.getAdminNotes());
            item.put("createdAt", r.getCreatedAt() != null ? r.getCreatedAt().toString() : null);
            item.put("reviewedAt", r.getReviewedAt() != null ? r.getReviewedAt().toString() : null);
            item.put("userPremiumAccessType", r.getUser().getPremiumAccessType());
            return item;
        }).toList();
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/admin/beta-requests/{id}/approve — approve a beta request
     */
    @PostMapping("/beta-requests/{id}/approve")
    public ResponseEntity<?> approveBetaRequest(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, String> payload) {
        return betaRequestRepository.findById(id).map(req -> {
            req.setStatus("APPROVED");
            req.setReviewedAt(java.time.LocalDateTime.now());
            if (payload != null && payload.get("adminNotes") != null) {
                req.setAdminNotes(payload.get("adminNotes"));
            }
            betaRequestRepository.save(req);

            // Grant BETA_PREMIUM to user
            User user = req.getUser();
            user.setPremium(true);
            user.setPremiumAccessType("BETA_PREMIUM");
            user.setSubscriptionStatus("ACTIVE");
            user.setSubscriptionPlan("BETA");
            user.setPremiumActivatedAt(java.time.LocalDateTime.now());
            user.setSubscriptionDate(java.time.LocalDate.now());
            userRepository.save(user);

            notificationService.createNotification(user.getId(),
                "🎉 Beta Access Approved!",
                "Congratulations! Your Wellnest Beta Premium access has been approved. Enjoy all premium features!",
                "SUCCESS");

            try {
                emailService.sendPremiumAccessGrantedEmail(user.getEmail(), user.getName(), "BETA_PREMIUM");
            } catch (Exception e) {
                System.err.println("Error sending beta approval email: " + e.getMessage());
            }

            return ResponseEntity.ok(java.util.Map.of(
                "message", "Beta request approved and BETA_PREMIUM access granted to " + user.getEmail(),
                "premiumAccessType", "BETA_PREMIUM"
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/admin/beta-requests/{id}/reject — reject a beta request
     */
    @PostMapping("/beta-requests/{id}/reject")
    public ResponseEntity<?> rejectBetaRequest(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, String> payload) {
        return betaRequestRepository.findById(id).map(req -> {
            req.setStatus("REJECTED");
            req.setReviewedAt(java.time.LocalDateTime.now());
            if (payload != null && payload.get("adminNotes") != null) {
                req.setAdminNotes(payload.get("adminNotes"));
            }
            betaRequestRepository.save(req);

            notificationService.createNotification(req.getUser().getId(),
                "Beta Access Update",
                "Thank you for your interest in Wellnest Beta. Your request wasn't approved at this time. Feel free to apply again later.",
                "INFO");

            return ResponseEntity.ok(java.util.Map.of("message", "Beta request rejected"));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/admin/grant-beta-premium/{userId} — directly grant BETA_PREMIUM
     */
    @PostMapping("/grant-beta-premium/{userId}")
    public ResponseEntity<?> grantBetaPremium(@PathVariable Long userId) {
        return userRepository.findById(userId).map(user -> {
            user.setPremium(true);
            user.setPremiumAccessType("BETA_PREMIUM");
            user.setSubscriptionStatus("ACTIVE");
            user.setSubscriptionPlan("BETA");
            user.setPremiumActivatedAt(java.time.LocalDateTime.now());
            user.setSubscriptionDate(java.time.LocalDate.now());
            userRepository.save(user);
            notificationService.createNotification(user.getId(),
                "🎉 Beta Premium Access Granted!",
                "You've been granted Wellnest Beta Premium access by the founder. Welcome to the inner circle!",
                "SUCCESS");
            try {
                emailService.sendPremiumAccessGrantedEmail(user.getEmail(), user.getName(), "BETA_PREMIUM");
            } catch (Exception e) {
                System.err.println("Error sending beta grant email: " + e.getMessage());
            }
            return ResponseEntity.ok(java.util.Map.of("message", "BETA_PREMIUM granted to user " + user.getEmail(), "premiumAccessType", "BETA_PREMIUM"));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/admin/grant-lifetime/{userId} — grant LIFETIME access
     */
    @PostMapping("/grant-lifetime/{userId}")
    public ResponseEntity<?> grantLifetime(@PathVariable Long userId) {
        return userRepository.findById(userId).map(user -> {
            user.setPremium(true);
            user.setPremiumAccessType("LIFETIME");
            user.setSubscriptionStatus("ACTIVE");
            user.setSubscriptionPlan("LIFETIME");
            user.setPremiumActivatedAt(java.time.LocalDateTime.now());
            user.setSubscriptionDate(java.time.LocalDate.now());
            userRepository.save(user);
            notificationService.createNotification(user.getId(),
                "♾️ Lifetime Access Granted!",
                "You've been granted Wellnest Lifetime Premium access. Enjoy all features forever — with our deepest gratitude.",
                "SUCCESS");
            try {
                emailService.sendPremiumAccessGrantedEmail(user.getEmail(), user.getName(), "LIFETIME");
            } catch (Exception e) {
                System.err.println("Error sending lifetime grant email: " + e.getMessage());
            }
            return ResponseEntity.ok(java.util.Map.of("message", "LIFETIME access granted to " + user.getEmail(), "premiumAccessType", "LIFETIME"));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/admin/revoke-premium/{userId} — revoke premium and revert to FREE
     */
    @PostMapping("/revoke-premium/{userId}")
    public ResponseEntity<?> revokePremium(@PathVariable Long userId) {
        return userRepository.findById(userId).map(user -> {
            user.setPremium(false);
            user.setPremiumAccessType("FREE");
            user.setSubscriptionStatus("INACTIVE");
            user.setSubscriptionPlan(null);
            userRepository.save(user);
            notificationService.createNotification(user.getId(),
                "Premium Access Revoked",
                "Your Wellnest Premium access has been revoked. Contact support for any questions.",
                "ALERT");
            return ResponseEntity.ok(java.util.Map.of("message", "Premium revoked for " + user.getEmail(), "premiumAccessType", "FREE"));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/admin/convert-to-paid/{userId} — convert beta to PAID_PREMIUM
     */
    @PostMapping("/convert-to-paid/{userId}")
    public ResponseEntity<?> convertToPaid(@PathVariable Long userId) {
        return userRepository.findById(userId).map(user -> {
            user.setPremium(true);
            user.setPremiumAccessType("PAID_PREMIUM");
            user.setSubscriptionStatus("ACTIVE");
            user.setSubscriptionPlan("YEARLY");
            userRepository.save(user);
            return ResponseEntity.ok(java.util.Map.of("message", "User converted to PAID_PREMIUM: " + user.getEmail(), "premiumAccessType", "PAID_PREMIUM"));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/admin/beta-stats — summary of beta request and access counts
     */
    @GetMapping("/beta-stats")
    public ResponseEntity<?> getBetaStats() {
        long pendingCount = betaRequestRepository.countByStatus("PENDING");
        long approvedCount = betaRequestRepository.countByStatus("APPROVED");
        long rejectedCount = betaRequestRepository.countByStatus("REJECTED");

        List<User> allUsers = userRepository.findAll();
        long freeUsers = allUsers.stream().filter(u -> u.getPremiumAccessType() == null || u.getPremiumAccessType().equals("FREE")).count();
        long betaPremiumUsers = allUsers.stream().filter(u -> "BETA_PREMIUM".equals(u.getPremiumAccessType())).count();
        long paidPremiumUsers = allUsers.stream().filter(u -> "PAID_PREMIUM".equals(u.getPremiumAccessType())).count();
        long adminGrantedUsers = allUsers.stream().filter(u -> "ADMIN_GRANTED".equals(u.getPremiumAccessType())).count();
        long lifetimeUsers = allUsers.stream().filter(u -> "LIFETIME".equals(u.getPremiumAccessType())).count();

        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("pendingRequests", pendingCount);
        stats.put("approvedRequests", approvedCount);
        stats.put("rejectedRequests", rejectedCount);
        stats.put("freeUsers", freeUsers);
        stats.put("betaPremiumUsers", betaPremiumUsers);
        stats.put("paidPremiumUsers", paidPremiumUsers);
        stats.put("adminGrantedUsers", adminGrantedUsers);
        stats.put("lifetimeUsers", lifetimeUsers);
        return ResponseEntity.ok(stats);
    }

    /**
     * GET /api/admin/feedbacks — list all beta feedbacks
     */
    @GetMapping("/feedbacks")
    public ResponseEntity<?> getFeedbacks() {
        List<com.wellnest.app.model.Feedback> feedbacks = feedbackRepository.findAllByOrderByCreatedAtDesc();
        var response = feedbacks.stream().map(f -> {
            java.util.Map<String, Object> item = new java.util.HashMap<>();
            item.put("id", f.getId());
            item.put("userId", f.getUser().getId());
            item.put("userName", f.getUser().getName());
            item.put("userEmail", f.getUser().getEmail());
            item.put("category", f.getCategory());
            item.put("rating", f.getRating());
            item.put("feedbackText", f.getFeedbackText());
            item.put("createdAt", f.getCreatedAt() != null ? f.getCreatedAt().toString() : null);
            return item;
        }).toList();
        return ResponseEntity.ok(response);
    }
}
