package com.wellnest.app.service.impl;

import com.wellnest.app.dto.EnergyForecast;
import com.wellnest.app.model.*;
import com.wellnest.app.repository.*;
import com.wellnest.app.service.EnergyService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class EnergyServiceImpl implements EnergyService {

    private final UserRepository userRepository;
    private final WorkoutRepository workoutRepository;
    private final MealRepository mealRepository;
    private final SleepLogRepository sleepLogRepository;
    private final com.wellnest.app.service.GroqService groqService;

    public EnergyServiceImpl(UserRepository userRepository,
                             WorkoutRepository workoutRepository,
                             MealRepository mealRepository,
                             SleepLogRepository sleepLogRepository,
                             com.wellnest.app.service.GroqService groqService) {
        this.userRepository = userRepository;
        this.workoutRepository = workoutRepository;
        this.mealRepository = mealRepository;
        this.sleepLogRepository = sleepLogRepository;
        this.groqService = groqService;
    }

    @Override
    public EnergyForecast getEnergyForecast(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDateTime now = LocalDateTime.now();
        
        // 1. Calculate and generate hourly predictions
        List<EnergyForecast.HourForecast> forecast = new ArrayList<>();
        for (int i = 1; i <= 6; i++) {
            LocalDateTime futureTime = now.plusHours(i);
            int energyValue = calculateEnergyAt(user, futureTime);
            String timeStr = String.format("%02d:00", futureTime.getHour());
            forecast.add(new EnergyForecast.HourForecast(timeStr, energyValue));
        }

        // 2. Finalize Current Metrics
        int currentEnergy = calculateEnergyAt(user, now);
        String status = determineStatus(currentEnergy, now.getHour());
        String message = generateInsight(currentEnergy, forecast, now.getHour());

        return new EnergyForecast(currentEnergy, status, message, forecast);
    }

    private int calculateEnergyAt(User user, LocalDateTime time) {
        // --- A. CIRCADIAN BASE (Sine Wave) ---
        // Peak at 10 AM (10) and 5 PM (17), Dip at 3 AM (3) and 3 PM (15)
        double hour = time.getHour() + (time.getMinute() / 60.0);
        double circadianBase = 60.0 + 20.0 * Math.sin(Math.PI * (hour - 7) / 12.0);

        // --- B. SLEEP MODIFIER ---
        Instant dayStart = LocalDate.now().atStartOfDay(ZoneOffset.UTC).toInstant();
        Optional<SleepLog> lastSleep = sleepLogRepository.findByUserIdOrderBySleepDateDesc(user.getId())
                .stream().filter(s -> s.getSleepDate().isAfter(dayStart.minus(Duration.ofHours(24)))).findFirst();
        
        double sleepMult = 1.0;
        if (lastSleep.isPresent()) {
            double hours = lastSleep.get().getHours();
            sleepMult = 0.7 + (Math.min(hours, 9.0) / 8.0) * 0.4; // 0.7 to 1.15
        } else {
            sleepMult = 0.85; // Penalty for no sleep log
        }

        double energy = circadianBase * sleepMult;

        // --- C. ACTIVITY MODIFIER (Fatigue vs Afterburn) ---
        Instant recentWorkoutsStart = time.toInstant(ZoneOffset.UTC).minus(Duration.ofHours(24));
        List<Workout> recentWorkouts = workoutRepository.findByUserIdAndPerformedAtBetween(user.getId(), recentWorkoutsStart, time.toInstant(ZoneOffset.UTC));
        
        for (Workout w : recentWorkouts) {
            long hoursAgo = Duration.between(w.getPerformedAt(), time.toInstant(ZoneOffset.UTC)).toHours();
            if (hoursAgo < 2) {
                energy -= 20; // Instant fatigue
            } else if (hoursAgo < 6) {
                energy += 10; // Afterburn endorphins
            }
        }

        // --- D. FUEL MODIFIER (Meals) ---
        List<Meal> recentMeals = mealRepository.findByUserIdAndLoggedAtBetween(user.getId(), recentWorkoutsStart, time.toInstant(ZoneOffset.UTC));
        for (Meal m : recentMeals) {
            long hoursAgo = Duration.between(m.getLoggedAt(), time.toInstant(ZoneOffset.UTC)).toHours();
            if (hoursAgo < 3) {
                energy += 15; // Glucose spike
            }
        }

        return Math.max(5, Math.min(100, (int) energy));
    }

    private String determineStatus(int energy, int hour) {
        if (hour >= 23 || hour < 5) return "RECOVERY";
        if (energy >= 85) return "PEAK";
        if (energy >= 65) return "FLOW";
        if (energy >= 45) return "STABLE";
        return "DIP";
    }

    private String generateInsight(int energy, List<EnergyForecast.HourForecast> forecast, int hour) {
        // --- 1. DETECT TREND ---
        int futureEnergy = forecast.get(forecast.size() - 1).getEnergyValue();
        String trend = (futureEnergy > energy + 10) ? "SURGING" : (futureEnergy < energy - 10) ? "DIPPING" : "STABLE";

        // --- 2. BUILD AI PROMPT ---
        String prompt = String.format(
            "You are an elite, 5-word pro-athlete coach for Wellnest. " +
            "Context: Time %02d:00. Current Energy: %d%%. 6-hour Trend: %s (%d%%). " +
            "Task: Give one short, high-performance tactical advice. No fluff. Max 10 words.",
            hour, energy, trend, futureEnergy
        );

        try {
            String aiMessage = groqService.getResponse(prompt);
            // Clean up typical AI boilerplate if any
            return aiMessage.replace("\"", "").trim();
        } catch (Exception e) {
            log.error("Groq Energy Insight failed, using fallback", e);
            // --- FALLBACK LOGIC ---
            if (hour >= 23 || hour < 5) return "Prioritize deep recovery for tomorrow. 💤";
            if (energy >= 85) return "Peak performance window. Use it! 🚀";
            if (trend.equals("SURGING")) return "Energy surge incoming. Prepare to push. 📈";
            return "Maintain consistent fuel and focus. ⚡";
        }
    }
}
