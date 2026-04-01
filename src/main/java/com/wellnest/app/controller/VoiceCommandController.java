package com.wellnest.app.controller;

import com.wellnest.app.service.AIVoiceCommandService;
import com.wellnest.app.service.AppUserService;
import com.wellnest.app.service.GroqService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/ai/voice-command")
@Slf4j
public class VoiceCommandController {

    private final GroqService groqService;
    private final AIVoiceCommandService voiceCommandService;
    private final AppUserService appUserService;

    public VoiceCommandController(GroqService groqService, AIVoiceCommandService voiceCommandService, AppUserService appUserService) {
        this.groqService = groqService;
        this.voiceCommandService = voiceCommandService;
        this.appUserService = appUserService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> handleVoiceCommand(
            Authentication authentication,
            @RequestParam("audio") MultipartFile audio) {
        
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        log.info("Voice Command Received for userId: {}", userId);

        // 1. Transcribe
        String transcript = groqService.transcribeAudio(audio);
        
        if (transcript == null || transcript.contains("Unable to transcribe") || transcript.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "ERROR", 
                "displayMessage", "I couldn't hear you clearly. Please try again! 🎙️",
                "voiceMessage", "I couldn't hear you clearly. Please try again."
            ));
        }

        // 2. Process
        Map<String, Object> result = voiceCommandService.processVoiceCommand(userId, transcript);
        
        return ResponseEntity.ok(result);
    }
}
