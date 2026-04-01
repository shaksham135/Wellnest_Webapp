package com.wellnest.app.service;

import com.wellnest.app.model.*;
import com.wellnest.app.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
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
    private final WorkoutRepository workoutRepository;
    private final EnergyService energyService;

    public AssistantService(DailyBriefingRepository briefingRepository,
                            GroqService groqService,
                            UserRepository userRepository,
                            DailyActivityRepository dailyActivityRepository,
                            SleepLogRepository sleepLogRepository,
                            WaterIntakeRepository waterIntakeRepository,
                            WorkoutRepository workoutRepository,
                            EnergyService energyService) {
        this.briefingRepository = briefingRepository;
        this.groqService = groqService;
        this.userRepository = userRepository;
        this.dailyActivityRepository = dailyActivityRepository;
        this.sleepLogRepository = sleepLogRepository;
        this.waterIntakeRepository = waterIntakeRepository;
        this.workoutRepository = workoutRepository;
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

        // 1. Determine Time Window (Morning, Noon, Evening, Night)
        int hour = java.time.LocalDateTime.now().getHour();
        String timeWindow = "NOON";
        if (hour >= 22 || hour < 5) timeWindow = "NIGHT";
        else if (hour < 12) timeWindow = "MORNING";
        else if (hour < 17) timeWindow = "NOON";
        else timeWindow = "EVENING";

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
            "💡 Hydration is your superpower! One glass of water now can prevent fatigue later. 💧",
            "💡 Consistency beats intensity. Every step you take today counts toward your 30-day goal! 🚶‍♂️",
            "💡 Fuel your peak: A protein-rich snack can help muscle recovery and curb afternoon sugar cravings. 🥦",
            "💡 Sleep is non-negotiable. Aim for 7-8 hours tonight to recharge your 'Vitality Battery'. 🔋",
            "💡 Active recovery! Try a light 10-minute stretch to improve flexibility and mental focus. 🧘‍♀️",
            "💡 Metabolism kickstart: Drink 500ml of water right after waking up to wake up your body. 🌊",
            "💡 Small wins! Did you know active people are 20% more productive? Keep moving! ⚡"
        };
        // True random pick for variety on refresh
        int tipIndex = (int) (Math.random() * tips.length);
        return new DailyBriefing(user, tips[tipIndex], date);
    }

    private String gatherUserContext(User user, LocalDate today) {
        StringBuilder sb = new StringBuilder();

        // 1. Steps & Distance
        Optional<DailyActivity> activity = dailyActivityRepository.findByUserIdAndDate(user.getId(), today);
        int steps = activity.map(DailyActivity::getSteps).orElse(0);
        double dist = activity.map(DailyActivity::getDistanceKm).orElse(0.0);
        sb.append(String.format("Activity: %d steps, %.2f km traveled. ", steps, dist));

        // 2. Sleep Data
        Instant last24h = Instant.now().minusSeconds(86400);
        Optional<SleepLog> sleep = sleepLogRepository.findByUserIdOrderBySleepDateDesc(user.getId())
                .stream().filter(s -> s.getSleepDate().isAfter(last24h)).findFirst();
        double sleepHours = sleep.map(SleepLog::getHours).orElse(0.0);
        sb.append(String.format("Latest Sleep: %.1f hours. ", sleepHours));

        // 3. Hydration
        Instant startOfDay = today.atStartOfDay(ZoneOffset.UTC).toInstant();
        double water = waterIntakeRepository.findByUserIdOrderByLoggedAtDesc(user.getId())
                .stream().filter(w -> w.getLoggedAt().isAfter(startOfDay))
                .mapToDouble(WaterIntake::getLiters).sum();
        sb.append(String.format("Hydration: %.2fL water consumed today. ", water));

        // 4. Workouts (Added for AI context)
        List<Workout> workouts = workoutRepository.findByUserIdAndPerformedAtBetween(user.getId(), startOfDay, Instant.now());
        int workoutCount = workouts.size();
        int workoutCals = workouts.stream().mapToInt(w -> w.getCaloriesBurned() != null ? w.getCaloriesBurned() : 0).sum();
        if (workoutCount > 0) {
            sb.append(String.format("Workouts: %d session(s) completed today (burned approx %d kcal). ", workoutCount, workoutCals));
        }

        // 5. Goal Context
        if (user.getFitnessGoal() != null) {
            sb.append("Fitness Objective: ").append(user.getFitnessGoal().replace("_", " ")).append(". ");
        }

        return sb.toString();
    }
}
