package com.wellnest.app.controller;

import com.wellnest.app.dto.UserProfileResponse;
import com.wellnest.app.dto.GoalTargetsDto;
import com.wellnest.app.model.BetaRequest;
import com.wellnest.app.model.User;
import com.wellnest.app.repository.BetaRequestRepository;
import com.wellnest.app.service.NotificationService;
import com.wellnest.app.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/subscription")
@CrossOrigin
public class SubscriptionController {

    private final UserService userService;
    private final BetaRequestRepository betaRequestRepository;
    private final NotificationService notificationService;
    private final com.wellnest.app.service.EmailService emailService;

    public SubscriptionController(UserService userService,
                                  BetaRequestRepository betaRequestRepository,
                                  NotificationService notificationService,
                                  com.wellnest.app.service.EmailService emailService) {
        this.userService = userService;
        this.betaRequestRepository = betaRequestRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    /**
     * User submits a beta access request.
     * POST /api/subscription/request-beta
     */
    @PostMapping("/request-beta")
    public ResponseEntity<?> requestBetaAccess(@RequestBody Map<String, String> payload, Authentication auth) {
        String email = auth.getName();
        User user = userService.findByEmail(email).orElseThrow();

        // Check if already has premium access (excluding FREE)
        String currentType = user.getPremiumAccessType();
        if (currentType != null && (currentType.equals("BETA_PREMIUM") || currentType.equals("PAID_PREMIUM") || currentType.equals("ADMIN_GRANTED") || currentType.equals("LIFETIME"))) {
            return ResponseEntity.badRequest().body(Map.of("error", "You already have premium access: " + currentType));
        }

        // Check if a PENDING request already exists
        if (betaRequestRepository.existsByUserIdAndStatus(user.getId(), "PENDING")) {
            return ResponseEntity.badRequest().body(Map.of("error", "You already have a pending beta access request. Our team will review it shortly."));
        }

        // Message is optional - use default if not provided
        String message = payload.getOrDefault("message", "User requested beta access");

        BetaRequest request = new BetaRequest(user, message.trim());
        betaRequestRepository.save(request);

        notificationService.createNotification(user.getId(),
            "Beta Access Request Submitted",
            "Your request for Wellnest Beta Premium has been received. We'll review it within 24-48 hours.",
            "INFO");

        try {
            emailService.sendBetaRequestNotification(user.getEmail(), user.getName(), message.trim());
        } catch (Exception e) {
            System.err.println("Error sending beta request admin notification: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of(
            "message", "Beta access request submitted successfully! We'll review it soon.",
            "status", "PENDING"
        ));
    }

    /**
     * Get current user's beta request status.
     * GET /api/subscription/beta-status
     */
    @GetMapping("/beta-status")
    public ResponseEntity<?> getBetaStatus(Authentication auth) {
        String email = auth.getName();
        User user = userService.findByEmail(email).orElseThrow();

        var requestOpt = betaRequestRepository.findByUserIdAndStatus(user.getId(), "PENDING");
        if (requestOpt.isEmpty()) {
            // Check if previously reviewed
            var all = betaRequestRepository.findAllByOrderByCreatedAtDesc();
            var userReq = all.stream()
                .filter(r -> r.getUser().getId().equals(user.getId()))
                .findFirst();
            if (userReq.isPresent()) {
                BetaRequest req = userReq.get();
                return ResponseEntity.ok(Map.of(
                    "hasRequest", true,
                    "status", req.getStatus(),
                    "createdAt", req.getCreatedAt().toString(),
                    "premiumAccessType", user.getPremiumAccessType() != null ? user.getPremiumAccessType() : "FREE"
                ));
            }
            return ResponseEntity.ok(Map.of(
                "hasRequest", false,
                "premiumAccessType", user.getPremiumAccessType() != null ? user.getPremiumAccessType() : "FREE"
            ));
        }

        BetaRequest req = requestOpt.get();
        return ResponseEntity.ok(Map.of(
            "hasRequest", true,
            "status", req.getStatus(),
            "createdAt", req.getCreatedAt().toString(),
            "premiumAccessType", user.getPremiumAccessType() != null ? user.getPremiumAccessType() : "FREE"
        ));
    }

    /**
     * Legacy activate endpoint — kept for backward compat but maps to PAID_PREMIUM type.
     * POST /api/subscription/activate
     */
    @PostMapping("/activate")
    public ResponseEntity<?> activateSubscription(@RequestBody Map<String, String> payload, Authentication auth) {
        String email = auth.getName();
        User user = userService.findByEmail(email).orElseThrow();

        String plan = payload.get("plan");
        if (plan == null || plan.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Plan must be specified (e.g., MONTHLY, YEARLY, LIFETIME)"));
        }

        user.setPremium(true);
        user.setPremiumAccessType("PAID_PREMIUM");
        user.setSubscriptionPlan(plan.toUpperCase().trim());
        user.setSubscriptionStatus("ACTIVE");
        user.setSubscriptionDate(LocalDate.now());
        user.setPremiumActivatedAt(LocalDateTime.now());
        userService.save(user);

        GoalTargetsDto targets = new GoalTargetsDto();
        targets.setTargetSteps(user.getTargetSteps());
        targets.setTargetWaterLiters(user.getTargetWaterLiters());
        targets.setTargetSleepHours(user.getTargetSleepHours());
        targets.setTargetWorkoutsPerWeek(user.getTargetWorkoutsPerWeek());
        targets.setTargetActiveCalories(user.getTargetActiveCalories());
        targets.setTargetDistanceKm(user.getTargetDistanceKm());

        UserProfileResponse dto = new UserProfileResponse(
                user.getName(), user.getEmail(), user.getRole(),
                user.getAge(), user.getHeightCm(), user.getWeightKg(),
                user.getGender(), user.getFitnessGoal(), user.getPhone(),
                user.isVerified(), user.isVerificationRequested(), user.isPremium(),
                targets, user.getDailyVoiceCount(), user.getLastVoiceDate(),
                user.getDailyScanCount(), user.getLastScanDate(),
                user.getXp(), user.getLevel(), user.getCoins(), user.getLeague());
        dto.setStreakShieldCount(user.getStreakShieldCount());
        dto.setActiveTheme(user.getActiveTheme() != null ? user.getActiveTheme() : "default");
        dto.setXpBoosterActive(user.getXpBoosterExpiry() != null && user.getXpBoosterExpiry().isAfter(LocalDateTime.now()));
        dto.setHasPremiumBadge(user.isHasPremiumBadge());
        dto.setSubscriptionPlan(user.getSubscriptionPlan());
        dto.setSubscriptionStatus(user.getSubscriptionStatus());
        dto.setSubscriptionDate(user.getSubscriptionDate());
        dto.setPremiumActivatedAt(user.getPremiumActivatedAt());
        dto.setFirstVoiceLogAt(user.getFirstVoiceLogAt());
        dto.setMaxVoiceCommandsLimit(user.calculateMaxVoiceCommandsLimit());
        dto.setPremiumAccessType("PAID_PREMIUM");
        return ResponseEntity.ok(dto);
    }
}
