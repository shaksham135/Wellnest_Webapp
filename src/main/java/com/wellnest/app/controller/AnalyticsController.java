package com.wellnest.app.controller;

import com.wellnest.app.dto.AnalyticsSummary;
import com.wellnest.app.service.AnalyticsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final com.wellnest.app.service.TrainerInteractionService trainerInteractionService;
    private final com.wellnest.app.service.EnergyService energyService;
    private final com.wellnest.app.repository.UserRepository userRepository;

    public AnalyticsController(AnalyticsService analyticsService,
            com.wellnest.app.service.TrainerInteractionService trainerInteractionService,
            com.wellnest.app.service.EnergyService energyService,
            com.wellnest.app.repository.UserRepository userRepository) {
        this.analyticsService = analyticsService;
        this.trainerInteractionService = trainerInteractionService;
        this.energyService = energyService;
        this.userRepository = userRepository;
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<AnalyticsSummary> getAnalyticsForClient(
            @PathVariable Long clientId,
            Authentication authentication) {

        trainerInteractionService.verifyTrainerAccess(authentication.getName(), clientId);
        AnalyticsSummary summary = analyticsService.getClientAnalytics(clientId, authentication);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/summary")
    public ResponseEntity<AnalyticsSummary> getAnalyticsSummary(
            Authentication authentication,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        AnalyticsSummary summary;
        if (startDate != null && endDate != null) {
            summary = analyticsService.getUserAnalytics(authentication, startDate, endDate);
        } else {
            summary = analyticsService.getUserAnalytics(authentication);
        }

        return ResponseEntity.ok(summary);
    }

    @GetMapping("/energy-forecast")
    public ResponseEntity<?> getEnergyForecast(Authentication authentication) {
        // --- PREMIUM CHECK ---
        String email = authentication.getName();
        com.wellnest.app.model.User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || !user.isPremium()) {
            return ResponseEntity.status(403).body(java.util.Map.of("error", "Energy Forecast is a premium feature."));
        }
        
        return ResponseEntity.ok(energyService.getEnergyForecast(authentication));
    }
}
