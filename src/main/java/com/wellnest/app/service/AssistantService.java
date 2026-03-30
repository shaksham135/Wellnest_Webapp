package com.wellnest.app.service;

import com.wellnest.app.model.*;
import com.wellnest.app.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Optional;

@Service
@Slf4j
public class AssistantService {

    private final DailyBriefingRepository briefingRepository;
    private final GroqService groqService;
    private final UserRepository userRepository;
    private final DailyActivityRepository dailyActivityRepository;
    private final SleepLogRepository sleepLogRepository;
    private final WaterIntakeRepository waterIntakeRepository;

    public AssistantService(DailyBriefingRepository briefingRepository,
                            GroqService groqService,
                            UserRepository userRepository,
                            DailyActivityRepository dailyActivityRepository,
                            SleepLogRepository sleepLogRepository,
                            WaterIntakeRepository waterIntakeRepository) {
        this.briefingRepository = briefingRepository;
        this.groqService = groqService;
        this.userRepository = userRepository;
        this.dailyActivityRepository = dailyActivityRepository;
        this.sleepLogRepository = sleepLogRepository;
        this.waterIntakeRepository = waterIntakeRepository;
    }

    @Transactional
    public DailyBriefing getTodayBriefing(Long userId, String dateStr) {
        log.info("Fetching today's briefing for userId: {} on date: {}", userId, dateStr);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDate today;
        try {
            today = (dateStr != null) ? LocalDate.parse(dateStr) : LocalDate.now();
        } catch (Exception e) {
            today = LocalDate.now();
        }

        // 1. Check if briefing already exists for today
        Optional<DailyBriefing> existing = briefingRepository.findByUserAndDate(user, today);
        if (existing.isPresent()) {
            log.info("Found existing briefing for today.");
            return existing.get();
        }

        // 2. Gather context for the AI
        log.info("Generating new AI briefing. Gathering user context...");
        String context = gatherUserContext(user, today);
        log.info("User context gathered: {}", context);

        // 3. Generate content using Groq
        String prompt = "You are an elite, high-energy Pro-Athlete Coach for the Wellnest app. " +
                "Based on the following data for " + user.getName() + ", generate a 2-sentence daily briefing. " +
                "Be hyper-motivating, reference their specific numbers, and give one actionable tip for today. " +
                "Data: " + context + ". " +
                "Keep it under 250 characters.";

        log.info("Calling Groq API...");
        String aiMessage = groqService.getResponse(prompt);
        log.info("Groq API response received: {}", aiMessage);

        // 4. Save permanently
        DailyBriefing briefing = new DailyBriefing(user, aiMessage, today);
        return briefingRepository.save(briefing);
    }

    private String gatherUserContext(User user, LocalDate today) {
        StringBuilder sb = new StringBuilder();

        // Steps
        Optional<DailyActivity> activity = dailyActivityRepository.findByUserIdAndDate(user.getId(), today);
        int steps = activity.map(DailyActivity::getSteps).orElse(0);
        sb.append("Steps today: ").append(steps).append(". ");

        // Sleep (Last 24h)
        Instant last24h = Instant.now().minusSeconds(86400);
        Optional<SleepLog> sleep = sleepLogRepository.findByUserIdOrderBySleepDateDesc(user.getId())
                .stream().filter(s -> s.getSleepDate().isAfter(last24h)).findFirst();
        double sleepHours = sleep.map(SleepLog::getHours).orElse(0.0);
        sb.append("Sleep last night: ").append(sleepHours).append(" hours. ");

        // Water
        Instant startOfDay = today.atStartOfDay(ZoneOffset.UTC).toInstant();
        double water = waterIntakeRepository.findByUserIdOrderByLoggedAtDesc(user.getId())
                .stream().filter(w -> w.getLoggedAt().isAfter(startOfDay))
                .mapToDouble(WaterIntake::getLiters).sum();
        sb.append("Water today: ").append(water).append("L. ");

        // Fitness Goal
        if (user.getFitnessGoal() != null) {
            sb.append("Overall Goal: ").append(user.getFitnessGoal()).append(". ");
        }

        return sb.toString();
    }
}
