package com.wellnest.app.controller;

import com.wellnest.app.model.User;
import com.wellnest.app.repository.UserRepository;
import com.wellnest.app.service.AIVoiceCommandService;
import com.wellnest.app.service.AppUserService;
import com.wellnest.app.service.GroqService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/ai/voice-command")
@Slf4j
public class VoiceCommandController {

    private final GroqService groqService;
    private final AIVoiceCommandService voiceCommandService;
    private final AppUserService appUserService;
    private final UserRepository userRepository;

    public VoiceCommandController(GroqService groqService, 
                                  AIVoiceCommandService voiceCommandService, 
                                  AppUserService appUserService, 
                                  UserRepository userRepository) {
        this.groqService = groqService;
        this.voiceCommandService = voiceCommandService;
        this.appUserService = appUserService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> handleVoiceCommand(
            Authentication authentication,
            @RequestParam(value = "audio", required = false) MultipartFile audio,
            @RequestParam(value = "text", required = false) String text) {
        
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        log.info("Voice Command Received for userId: {}", userId);

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of(
                "status", "UNAUTHORIZED", 
                "displayMessage", "User session not found. Please log in again.",
                "voiceMessage", "User session not found. Please log in again."
            ));
        }

        // Daily Limit Check & Reset
        LocalDate today = LocalDate.now();
        if (user.getLastVoiceDate() == null || !user.getLastVoiceDate().equals(today)) {
            user.setDailyVoiceCount(0);
            user.setLastVoiceDate(today);
            userRepository.save(user);
        }

        if (!user.isPremium() && user.getDailyVoiceCount() >= 3) {
            return ResponseEntity.status(403).body(Map.of(
                "status", "FORBIDDEN", 
                "displayMessage", "You've reached your free daily limit of 3 AI commands. Upgrade to Premium for unlimited voice logs! 🚀",
                "voiceMessage", "You've reached your free daily limit of 3 AI commands. Upgrade to Premium for unlimited voice logs."
            ));
        }

        // 1. Get transcript
        String transcript = text;
        if (transcript == null || transcript.trim().isEmpty()) {
            if (audio == null || audio.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "status", "ERROR", 
                    "displayMessage", "No input provided. Speak or type something! 🎙️",
                    "voiceMessage", "No input provided."
                ));
            }
            transcript = groqService.transcribeAudio(audio);
        }
        
        if (transcript == null || transcript.contains("Unable to transcribe") || transcript.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "ERROR", 
                "displayMessage", "I couldn't hear you clearly. Please try again! 🎙️",
                "voiceMessage", "I couldn't hear you clearly. Please try again."
            ));
        }

        // Successful execution start - increment limit count
        user.setDailyVoiceCount(user.getDailyVoiceCount() + 1);
        if (user.getFirstVoiceLogAt() == null) {
            user.setFirstVoiceLogAt(java.time.LocalDateTime.now());
        }
        userRepository.save(user);

        // 2. Process
        Map<String, Object> result = voiceCommandService.processVoiceCommand(userId, transcript);
        
        return ResponseEntity.ok(result);
    }
}
