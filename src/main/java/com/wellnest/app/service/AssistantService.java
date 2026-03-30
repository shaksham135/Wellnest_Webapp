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
    private final EnergyService energyService;

    public AssistantService(DailyBriefingRepository briefingRepository,
                            GroqService groqService,
                            UserRepository userRepository,
                            DailyActivityRepository dailyActivityRepository,
                            SleepLogRepository sleepLogRepository,
                            WaterIntakeRepository waterIntakeRepository,
                            EnergyService energyService) {
        this.briefingRepository = briefingRepository;
        this.groqService = groqService;
        this.userRepository = userRepository;
        this.dailyActivityRepository = dailyActivityRepository;
        this.sleepLogRepository = sleepLogRepository;
        this.waterIntakeRepository = waterIntakeRepository;
        this.energyService = energyService;
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

        // 1. Determine Time Window (Early Morning, Peak, Midday, Evening, Late Night)
        int hour = java.time.LocalDateTime.now().getHour();
        String timeWindow = "MIDDAY";
        if (hour >= 23 || hour < 5) timeWindow = "LATE_NIGHT";
        else if (hour < 9) timeWindow = "EARLY_MORNING";
        else if (hour < 12) timeWindow = "PEAK_PERFORMANCE";
        else if (hour >= 17) timeWindow = "EVENING";

        // 2. MONETIZATION LOGIC: Free Users get a static daily tip
        if (!user.isPremium()) {
             log.info("Free user. Providing stable Daily Pro-Tip.");
             return getFreeDailyTip(user, today);
        }

        // 3. PREMIUM LOGIC: Time-Aware AI Briefing + Energy Forecast
        Optional<DailyBriefing> existing = briefingRepository.findByUserAndDate(user, today);
        
        // Fetch current steps and energy to check freshness
        Optional<DailyActivity> currentActivity = dailyActivityRepository.findByUserIdAndDate(user.getId(), today);
        int currentSteps = currentActivity.map(DailyActivity::getSteps).orElse(0);
        
        // Get Energy Status for context
        com.wellnest.app.dto.EnergyForecast energy = null;
        try {
            energy = energyService.getEnergyForecast(new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(user.getEmail(), null));
        } catch (Exception e) {
            log.error("Failed to get energy forecast for AI context", e);
        }

        if (existing.isPresent()) {
            String oldContent = existing.get().getContent();
            boolean isStale = (oldContent.contains("steps") && !oldContent.contains(String.valueOf(currentSteps))) ||
                             (existing.get().getNotes() != null && !existing.get().getNotes().equals(timeWindow));

            if (!isStale) {
                return existing.get();
            } else {
                briefingRepository.delete(existing.get());
            }
        }

        // 4. Generate Premium AI Content with Predicted Energy context
        String context = gatherUserContext(user, today);
        String energyContext = (energy != null) ? 
            String.format("Current Energy: %d%% Status: %s. Insight: %s.", energy.getCurrentEnergy(), energy.getStatus(), energy.getMessage()) : "";

        String prompt = "You are an elite, high-energy Pro-Athlete Coach for the Wellnest app. " +
                "It is currently " + timeWindow.replace("_", " ").toLowerCase() + ". " +
                "Based on the following data for " + user.getName() + " and their predicted energy, generate a 2-sentence " + timeWindow.toLowerCase() + " coaching briefing. " +
                "Tone: Hyper-motivating. Reference specific stats. " +
                "Current State: " + context + ". " +
                "Energy Insight: " + energyContext + ". " +
                "Limit to 220 characters.";

        String aiMessage = groqService.getResponse(prompt);
        
        DailyBriefing briefing = new DailyBriefing(user, aiMessage, today);
        briefing.setNotes(timeWindow); // Store timeWindow in notes to detect period changes
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
