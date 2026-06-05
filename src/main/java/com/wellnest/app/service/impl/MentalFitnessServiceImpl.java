package com.wellnest.app.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wellnest.app.model.MentalState;
import com.wellnest.app.model.User;
import com.wellnest.app.repository.MentalStateRepository;
import com.wellnest.app.service.GroqService;
import com.wellnest.app.service.MentalFitnessService;
import com.wellnest.app.service.TrackerService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

@Service
@Slf4j
public class MentalFitnessServiceImpl implements MentalFitnessService {

    private final MentalStateRepository mentalStateRepository;
    private final GroqService groqService;
    private final TrackerService trackerService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public MentalFitnessServiceImpl(MentalStateRepository mentalStateRepository, 
                                    GroqService groqService, 
                                    TrackerService trackerService) {
        this.mentalStateRepository = mentalStateRepository;
        this.groqService = groqService;
        this.trackerService = trackerService;
    }

    @Override
    public MentalState saveMentalState(User user, int focus, int stress, int mood, String transcription) {
        MentalState state = new MentalState();
        state.setUserId(user.getId());
        state.setFocusScore(focus);
        state.setStressScore(stress);
        state.setMoodScore(mood);
        state.setTranscription(transcription);
        state.setSentiment(analyzeSentiment(transcription));
        return mentalStateRepository.save(state);
    }

    @Override
    public int getDailyReadiness(User user) {
        Optional<MentalState> latest = getLatestMentalState(user);
        
        // Base score: 70
        double readiness = 70.0;
        
        // If there is voice scan / mood check data, adjust baseline based on focus, mood, stress
        if (latest.isPresent()) {
            MentalState s = latest.get();
            // Default focus, mood, stress to 5 if null
            int focus = s.getFocusScore() != null ? s.getFocusScore() : 5;
            int mood = s.getMoodScore() != null ? s.getMoodScore() : 5;
            int stress = s.getStressScore() != null ? s.getStressScore() : 5;
            
            // Stable delta calculations: Focus (+2 max), Mood (+1.5 max), Stress (-2 max)
            readiness += (focus - 5) * 2.0;
            readiness += (mood - 5) * 1.5;
            readiness += (stress - 5) * -2.0;
        }
        
        // Add behavioral modifiers
        // 1. Sleep Log Modifier
        List<com.wellnest.app.model.SleepLog> sleepLogs = trackerService.getSleepForToday(user.getId());
        if (!sleepLogs.isEmpty()) {
            Double hoursObj = sleepLogs.get(0).getHours();
            double sleepHours = hoursObj != null ? hoursObj : 0.0;
            if (sleepHours >= 7.0) {
                readiness += 5.0;
            } else if (sleepHours < 6.0 && sleepHours > 0.0) {
                readiness -= 5.0;
            }
        }
        
        // 2. Hydration (Water) Modifier (Proportional Scaling: 0.5L=+1, 1L=+2, 2L+=+3)
        List<com.wellnest.app.model.WaterIntake> waterIntakes = trackerService.getWaterForToday(user.getId());
        double totalWaterLiters = waterIntakes.stream()
                .mapToDouble(w -> w.getLiters() != null ? w.getLiters() : 0.0)
                .sum();
        if (totalWaterLiters >= 2.0) {
            readiness += 3.0;
        } else if (totalWaterLiters >= 1.0) {
            readiness += 2.0;
        } else if (totalWaterLiters >= 0.5) {
            readiness += 1.0;
        }
        
        // 3. Workout Modifier
        List<com.wellnest.app.model.Workout> workouts = trackerService.getWorkoutsForToday(user.getId());
        if (!workouts.isEmpty()) {
            readiness += 5.0;
        }
        
        // Clamp final score to 10 - 100
        return (int) Math.max(10, Math.min(100, readiness));
    }

    @Override
    public Map<String, Boolean> getReadinessFactors(User user) {
        Map<String, Boolean> factors = new HashMap<>();
        
        // 1. Sleep
        List<com.wellnest.app.model.SleepLog> sleepLogs = trackerService.getSleepForToday(user.getId());
        factors.put("sleep", !sleepLogs.isEmpty());
        
        // 2. Hydration
        List<com.wellnest.app.model.WaterIntake> waterIntakes = trackerService.getWaterForToday(user.getId());
        double totalWaterLiters = waterIntakes.stream().mapToDouble(com.wellnest.app.model.WaterIntake::getLiters).sum();
        factors.put("hydration", totalWaterLiters > 0.0);
        
        // 3. Workout
        List<com.wellnest.app.model.Workout> workouts = trackerService.getWorkoutsForToday(user.getId());
        factors.put("workout", !workouts.isEmpty());
        
        // 4. Mental Scan / Mood Check (logged today)
        Optional<MentalState> latest = getLatestMentalState(user);
        boolean mentalLoggedToday = latest.isPresent() && isLoggedToday(latest.get().getPerformedAt());
        factors.put("mental", mentalLoggedToday);
        
        return factors;
    }

    @Override
    public String getDataQuality(User user) {
        Map<String, Boolean> factors = getReadinessFactors(user);
        long loggedCount = factors.values().stream().filter(v -> v).count();
        if (loggedCount >= 3) {
            return "HIGH";
        } else if (loggedCount == 2) {
            return "MEDIUM";
        } else {
            return "LOW";
        }
    }

    @Override
    public MentalState processVoiceScan(User user, MultipartFile audio) {
        log.info("Processing Real Voice Clarity Scan for user: {}", user.getEmail());
        
        // 1. Transcription (Acoustic Capture -> AI Text)
        String text = groqService.transcribeAudio(audio);
        log.info("Voice Scan Transcription Result: {}", text);

        // 2. AI Diagnostic Analysis (Llama 3 Sentiment Engine)
        String prompt = String.format(
            "Analyze this mental health journal entry for Wellnest: \"%s\". " +
            "Provide scores for focus, stress, and mood on a 1-10 scale and a one-word sentiment analysis. " +
            "You MUST return ONLY a valid JSON object. No markdown block wrapper, no preamble. " +
            "Format: {\"focus\": X, \"stress\": X, \"mood\": X, \"sentiment\": \"WORD\"}", text);

        try {
            String response = groqService.getResponse(prompt, "llama-3.1-8b-instant", 40);
            
            // --- ROBUST JSON EXTRACTION ---
            String cleaned = response.trim();
            if (cleaned.contains("```")) {
                cleaned = cleaned.replaceAll("(?s).*?```(?:json)?\\s*(\\{.*\\})\\s*```.*", "$1").trim();
            }
            if (!cleaned.startsWith("{")) {
                int braceStart = cleaned.indexOf('{');
                int braceEnd = cleaned.lastIndexOf('}');
                if (braceStart != -1 && braceEnd != -1 && braceEnd > braceStart) {
                    cleaned = cleaned.substring(braceStart, braceEnd + 1);
                }
            }

            JsonNode node = objectMapper.readTree(cleaned);
            int focus = node.path("focus").asInt(5);
            int stress = node.path("stress").asInt(5);
            int mood = node.path("mood").asInt(5);
            String sentiment = node.path("sentiment").asText("NEUTRAL").toUpperCase();

            MentalState state = new MentalState();
            state.setUserId(user.getId());
            state.setFocusScore(focus);
            state.setStressScore(stress);
            state.setMoodScore(mood);
            state.setSentiment(sentiment);
            state.setTranscription(text);
            return mentalStateRepository.save(state);
        } catch (Exception e) {
            log.error("AI Voice Scan failed, using defaults", e);
            return saveMentalState(user, 5, 5, 5, text);
        }
    }

    @Override
    public Optional<MentalState> getLatestMentalState(User user) {
        return mentalStateRepository.findByUserIdOrderByPerformedAtDesc(user.getId()).stream().findFirst();
    }

    private String analyzeSentiment(String text) {
        if (text == null || text.isEmpty()) return "NEUTRAL";
        return "STABLE"; // Placeholder for more complex NLP if needed
    }

    private boolean isLoggedToday(Instant instant) {
        if (instant == null) return false;
        java.time.ZoneOffset zoneOffset = com.wellnest.app.util.TimezoneUtil.getClientZoneOffset();
        java.time.LocalDate localDate = instant.atOffset(zoneOffset).toLocalDate();
        java.time.LocalDate today = java.time.LocalDate.now(zoneOffset);
        return localDate.equals(today);
    }
}
