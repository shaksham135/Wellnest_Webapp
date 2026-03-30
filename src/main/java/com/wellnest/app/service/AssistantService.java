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
        log.info("Fetching tiered briefing for userId: {} on date: {}", userId, dateStr);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDate today;
        try {
            today = (dateStr != null) ? LocalDate.parse(dateStr) : LocalDate.now();
        } catch (Exception e) {
            today = LocalDate.now();
        }

        // 1. Determine Time of Day (Morning/Afternoon/Evening)
        int hour = java.time.LocalDateTime.now().getHour();
        String timeOfDay = (hour < 12) ? "MORNING" : (hour < 17) ? "AFTERNOON" : "EVENING";

        // 2. MONETIZATION LOGIC: Free Users get a static daily tip
        if (!user.isPremium()) {
             log.info("Free user. Providing stable Daily Pro-Tip.");
             return getFreeDailyTip(user, today);
        }

        // 3. PREMIUM LOGIC: Time-Aware AI Briefing
        Optional<DailyBriefing> existing = briefingRepository.findByUserAndDate(user, today);
        
        // Fetch current steps to check freshness
        Optional<DailyActivity> currentActivity = dailyActivityRepository.findByUserIdAndDate(user.getId(), today);
        int currentSteps = currentActivity.map(DailyActivity::getSteps).orElse(0);

        if (existing.isPresent()) {
            String oldContent = existing.get().getContent();
            boolean isStale = (oldContent.contains("steps") && !oldContent.contains(String.valueOf(currentSteps))) ||
                             (existing.get().getNotes() != null && !existing.get().getNotes().equals(timeOfDay));

            if (!isStale) {
                return existing.get();
            } else {
                briefingRepository.delete(existing.get());
            }
        }

        // 4. Generate Premium AI Content
        String context = gatherUserContext(user, today);
        String prompt = "You are an elite, high-energy Pro-Athlete Coach for the Wellnest app. " +
                "It is currently " + timeOfDay.toLowerCase() + ". " +
                "Based on the following data for " + user.getName() + ", generate a 2-sentence " + timeOfDay.toLowerCase() + " briefing. " +
                "Tone: Hyper-motivating, athlete-focused. Reference their specific steps. " +
                "Current Data: " + context + ". " +
                "Limit to 250 characters.";

        String aiMessage = groqService.getResponse(prompt);
        
        DailyBriefing briefing = new DailyBriefing(user, aiMessage, today);
        briefing.setNotes(timeOfDay); // Store timeOfDay in notes to detect period changes
        return briefingRepository.save(briefing);
    }

    private DailyBriefing getFreeDailyTip(User user, LocalDate date) {
        String[] tips = {
            "Hydration is key! Aim to drink 3L of water today to keep your energy high.",
            "Consistency beats intensity. Even a 10-minute walk counts toward your fitness journey.",
            "Prioritize protein! Your muscles need fuel to recover and grow stronger.",
            "Sleep is your superpower. Aim for 7-8 hours of quality rest tonight.",
            "Stretching for 5 minutes after a workout reduces soreness and improves flexibility.",
            "Start your day with a glass of water to kickstart your metabolism.",
            "Active recovery is real! Use today for a light walk or yoga session."
        };
        // Use user ID and date to pick a stable tip for the same user on the same day
        int tipIndex = (int) ((user.getId() + date.getDayOfYear()) % tips.length);
        String tip = "💡 Daily Pro-Tip: " + tips[tipIndex];
        return new DailyBriefing(user, tip, date);
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
