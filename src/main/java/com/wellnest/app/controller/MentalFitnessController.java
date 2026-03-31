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
@CrossOrigin
public class MentalFitnessController {

    private final MentalFitnessService mentalFitnessService;
    private final UserRepository userRepository;

    public MentalFitnessController(MentalFitnessService mentalFitnessService, UserRepository userRepository) {
        this.mentalFitnessService = mentalFitnessService;
        this.userRepository = userRepository;
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

        MentalState state = mentalFitnessService.processVoiceScan(user, audio);
        return ResponseEntity.ok(state);
    }

    @GetMapping("/latest")
    public ResponseEntity<?> getLatestMentalState(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        
        if (user == null || !user.isPremium()) {
            return ResponseEntity.status(403).body(Map.of("error", "Mental Diagnostics is a premium feature."));
        }

        return mentalFitnessService.getLatestMentalState(user)
            .map(state -> {
                int reserve = mentalFitnessService.getCognitiveReserve(user);
                return ResponseEntity.ok(Map.of(
                    "state", state,
                    "reserve", reserve
                ));
            })
            .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/reserve")
    public ResponseEntity<?> getCognitiveReserve(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        
        if (user == null || !user.isPremium()) {
            return ResponseEntity.status(403).body(Map.of("error", "Cognitive Reserve is a premium feature."));
        }

        int reserve = mentalFitnessService.getCognitiveReserve(user);
        return ResponseEntity.ok(Map.of("reserve", reserve));
    }
}
