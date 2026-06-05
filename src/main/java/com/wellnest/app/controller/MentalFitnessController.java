package com.wellnest.app.controller;

import com.wellnest.app.model.MentalState;
import com.wellnest.app.model.User;
import com.wellnest.app.repository.UserRepository;
import com.wellnest.app.service.MentalFitnessService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/mental")
public class MentalFitnessController {

    private final MentalFitnessService mentalFitnessService;
    private final UserRepository userRepository;
    private final com.wellnest.app.service.UserService userService;
    private final com.wellnest.app.repository.UserActivityLogRepository userActivityLogRepository;
    private final com.wellnest.app.repository.MentalStateRepository mentalStateRepository;

    public MentalFitnessController(MentalFitnessService mentalFitnessService, 
                                   UserRepository userRepository,
                                   com.wellnest.app.service.UserService userService,
                                   com.wellnest.app.repository.UserActivityLogRepository userActivityLogRepository,
                                   com.wellnest.app.repository.MentalStateRepository mentalStateRepository) {
        this.mentalFitnessService = mentalFitnessService;
        this.userRepository = userRepository;
        this.userService = userService;
        this.userActivityLogRepository = userActivityLogRepository;
        this.mentalStateRepository = mentalStateRepository;
    }

    @PostMapping("/voice-scan")
    public ResponseEntity<?> submitVoiceScan(@RequestParam("audio") MultipartFile audio, Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        
        if (user == null || !user.isPremium()) {
            return ResponseEntity.status(403).body(Map.of("error", "Mental Diagnostics is a premium-only feature."));
        }

        if (audio == null || audio.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Audio file is required."));
        }

        // Daily Limit Check & Reset
        java.time.LocalDate today = java.time.LocalDate.now();
        if (user.getLastScanDate() == null || !user.getLastScanDate().equals(today)) {
            user.setDailyScanCount(0);
            user.setLastScanDate(today);
            userRepository.save(user);
        }

        if (user.getDailyScanCount() >= 5) {
            return ResponseEntity.status(403).body(Map.of("error", "Daily limit of 5 diagnostics reached. Please try again tomorrow."));
        }

        // Increment count and save user
        user.setDailyScanCount(user.getDailyScanCount() + 1);
        if (user.getFirstVoiceLogAt() == null) {
            user.setFirstVoiceLogAt(java.time.LocalDateTime.now());
        }
        userRepository.save(user);

        MentalState state = mentalFitnessService.processVoiceScan(user, audio);
        return ResponseEntity.ok(state);
    }

    @GetMapping({"", "/"})
    public ResponseEntity<?> getMentalStates(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }
        return ResponseEntity.ok(mentalStateRepository.findByUserIdOrderByPerformedAtDesc(user.getId()));
    }

    @GetMapping("/latest")
    public ResponseEntity<?> getLatestMentalState(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        
        if (user == null || !user.isPremium()) {
            return ResponseEntity.noContent().build();
        }

        java.util.Optional<MentalState> latestOpt = mentalFitnessService.getLatestMentalState(user);
        int readiness = mentalFitnessService.getDailyReadiness(user);
        String quality = mentalFitnessService.getDataQuality(user);
        Map<String, Boolean> factors = mentalFitnessService.getReadinessFactors(user);

        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("state", latestOpt.orElse(null));
        response.put("readiness", readiness);
        response.put("reserve", readiness); // legacy backward compatibility
        response.put("dataQuality", quality);
        response.put("factors", factors);

        return ResponseEntity.ok(response);
    }

    @GetMapping({"/reserve", "/readiness"})
    public ResponseEntity<?> getDailyReadiness(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        
        if (user == null || !user.isPremium()) {
            return ResponseEntity.noContent().build();
        }

        int readiness = mentalFitnessService.getDailyReadiness(user);
        String quality = mentalFitnessService.getDataQuality(user);
        Map<String, Boolean> factors = mentalFitnessService.getReadinessFactors(user);

        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("reserve", readiness);
        response.put("readiness", readiness);
        response.put("dataQuality", quality);
        response.put("factors", factors);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/mood-check")
    public ResponseEntity<?> logMoodCheck(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }
        
        MentalState state = new MentalState();
        state.setUserId(user.getId());
        state.setMoodScore(8);
        state.setFocusScore(null);
        state.setStressScore(null);
        state.setSentiment("GOOD");
        state.setTranscription("Quick check-in");
        
        MentalState saved = mentalStateRepository.save(state);
        
        // Award 5 XP
        userService.addXp(user, 5);
        
        // Record active return day
        recordActiveEngagement(user.getId());
        
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMentalState(@PathVariable Long id, Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }

        MentalState state = mentalStateRepository.findById(id).orElse(null);
        if (state == null) {
            return ResponseEntity.notFound().build();
        }

        if (!state.getUserId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "You do not have permission to delete this log."));
        }

        mentalStateRepository.delete(state);
        return ResponseEntity.noContent().build();
    }

    private void recordActiveEngagement(Long userId) {
        if (userId == null) return;
        java.time.LocalDate today = java.time.LocalDate.now(com.wellnest.app.util.TimezoneUtil.getClientZoneId());
        if (!userActivityLogRepository.existsByUserIdAndActiveDate(userId, today)) {
            userActivityLogRepository.save(new com.wellnest.app.model.UserActivityLog(userId, today));
        }
    }
}
