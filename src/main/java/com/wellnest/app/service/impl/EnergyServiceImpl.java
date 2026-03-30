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

    public EnergyServiceImpl(UserRepository userRepository,
                             WorkoutRepository workoutRepository,
                             MealRepository mealRepository,
                             SleepLogRepository sleepLogRepository) {
        this.userRepository = userRepository;
        this.workoutRepository = workoutRepository;
        this.mealRepository = mealRepository;
        this.sleepLogRepository = sleepLogRepository;
    }

    @Override
    public EnergyForecast getEnergyForecast(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDateTime now = LocalDateTime.now();
        
        // 1. Calculate Current Energy
        int currentEnergy = calculateEnergyAt(user, now);
        String status = determineStatus(currentEnergy, now.getHour());
        String message = generateInsight(status, now.getHour());

        // 2. Calculate 6-hour Forecast
        List<EnergyForecast.HourForecast> forecast = new ArrayList<>();
        for (int i = 1; i <= 6; i++) {
            LocalDateTime futureTime = now.plusHours(i);
            int energyValue = calculateEnergyAt(user, futureTime);
            String timeStr = String.format("%02d:00", futureTime.getHour());
            forecast.add(new EnergyForecast.HourForecast(timeStr, energyValue));
        }

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

    private String generateInsight(String status, int hour) {
        switch (status) {
            case "PEAK": return "You are at maximum vitality. Lock into your hardest task now! 🚀";
            case "FLOW": return "Optimal energy for sustained focus. You're in the zone. 🌊";
            case "RECOVERY": return "Your body is in repair mode. Prioritize deep rest for tomorrow's performance. 💤";
            case "DIP": return hour < 17 ? "Natural afternoon dip detected. Hydrate or take a 10m walk. 🚶" : "Energy is tapering. Time to wind down. 🌅";
            default: return "Energy is baseline. Stay consistent with your fuel and movement. ⚡";
        }
    }
}
