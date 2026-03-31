package com.wellnest.app.service.impl;

import com.wellnest.app.model.MentalState;
import com.wellnest.app.model.User;
import com.wellnest.app.repository.MentalStateRepository;
import com.wellnest.app.service.GroqService;
import com.wellnest.app.service.MentalFitnessService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class MentalFitnessServiceImpl implements MentalFitnessService {

    private final MentalStateRepository mentalStateRepository;
    private final GroqService groqService;

    public MentalFitnessServiceImpl(MentalStateRepository mentalStateRepository, GroqService groqService) {
        this.mentalStateRepository = mentalStateRepository;
        this.groqService = groqService;
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
    public int getCognitiveReserve(User user) {
        Optional<MentalState> latest = getLatestMentalState(user);
        if (latest.isEmpty()) return 85; // Default healthy baseline

        MentalState s = latest.get();
        // Algorithm: (Focus * 5) + (Mood * 3) - (Stress * 7) + 50
        double reserve = (s.getFocusScore() * 5.0) + (s.getMoodScore() * 3.0) - (s.getStressScore() * 7.0) + 50.0;
        return (int) Math.max(10, Math.min(100, reserve));
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
            "Provide scores for [FOCUS, STRESS, MOOD] on 1-10 scale and one word SENTIMENT. " +
            "Format: FOCUS:X, STRESS:X, MOOD:X, SENTIMENT:WORD", text);

        try {
            String response = groqService.getResponse(prompt);
            int focus = Integer.parseInt(extractValue(response, "FOCUS"));
            int stress = Integer.parseInt(extractValue(response, "STRESS"));
            int mood = Integer.parseInt(extractValue(response, "MOOD"));
            String sentiment = extractValue(response, "SENTIMENT");

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

    private String extractValue(String response, String key) {
        try {
            String pattern = key + ":";
            int start = response.indexOf(pattern) + pattern.length();
            int end = response.indexOf(",", start);
            if (end == -1) end = response.length();
            return response.substring(start, end).trim();
        } catch (Exception e) {
            return "5";
        }
    }
}
