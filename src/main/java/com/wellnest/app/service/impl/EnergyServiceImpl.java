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
    private final com.wellnest.app.service.MentalFitnessService mentalFitnessService;

    public EnergyServiceImpl(UserRepository userRepository,
                             WorkoutRepository workoutRepository,
                             MealRepository mealRepository,
                             SleepLogRepository sleepLogRepository,
                             com.wellnest.app.service.GroqService groqService,
                             com.wellnest.app.service.MentalFitnessService mentalFitnessService) {
        this.userRepository = userRepository;
        this.workoutRepository = workoutRepository;
        this.mealRepository = mealRepository;
        this.sleepLogRepository = sleepLogRepository;
        this.groqService = groqService;
        this.mentalFitnessService = mentalFitnessService;
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
        int dailyReadiness = mentalFitnessService.getDailyReadiness(user);
        String status = determineStatus(currentEnergy, now.getHour());
        String message = generateInsight(currentEnergy, forecast, now.getHour());
        String dataQuality = mentalFitnessService.getDataQuality(user);
        java.util.Map<String, Boolean> factors = mentalFitnessService.getReadinessFactors(user);

        return new EnergyForecast(
            currentEnergy, 
            status, 
            message, 
            forecast, 
            dailyReadiness, // legacy compatibility mapped to dailyReadiness
            dailyReadiness, // new dailyReadiness field
            dataQuality, 
            factors
        );
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

        // --- C. ACTIVITY MODIFIER (Duration-Aware Fatigue vs Afterburn) ---
        Instant recentWorkoutsStart = time.toInstant(ZoneOffset.UTC).minus(Duration.ofHours(24));
        List<Workout> recentWorkouts = workoutRepository.findByUserIdAndPerformedAtBetween(user.getId(), recentWorkoutsStart, time.toInstant(ZoneOffset.UTC));
        
        double totalFatigue = 0;
        double totalAfterburn = 0;

        // Apply "Stress Tax": Mental fatigue makes physical expenditure more draining
        int dailyReadiness = mentalFitnessService.getDailyReadiness(user);
        double mentalTaxMultiplier = 1.0 + Math.max(0, (50.0 - dailyReadiness) / 100.0); // up to 1.4x tax

        for (Workout w : recentWorkouts) {
            long minutesAgo = Duration.between(w.getPerformedAt(), time.toInstant(ZoneOffset.UTC)).toMinutes();
            int duration = (w.getDurationMinutes() != null) ? w.getDurationMinutes() : 30;
            String type = w.getType().toUpperCase();

            // Intensity Weights (High/Med/Low Buckets)
            double weight = 
                type.contains("RUN") || type.contains("HIIT") || type.contains("CARDIO") || 
                type.contains("SWIM") || type.contains("BIKE") || type.contains("CYCLE") ? 0.35 :
                
                type.contains("YOGA") || type.contains("STRETCH") || type.contains("WALK") || 
                type.contains("MEDITATION") || type.contains("PILATES") ? 0.10 : 
                
                0.25; // Default for GYM, WEIGHTS, STRENGTH, etc.

            if (minutesAgo < 120) {
                // Linear Decay: 100% at minute 0 -> 0% at minute 120
                double decayFactor = 1.0 - (minutesAgo / 120.0);
                totalFatigue += (duration * weight * decayFactor * mentalTaxMultiplier);
            } else if (minutesAgo < 360) {
                // Afterburn: kicks in after 2 hours, lasts for 4 more
                totalAfterburn += (duration * 0.15);
            }
        }

        // Cap fatigue but reward afterburn
        energy -= Math.min(45, totalFatigue);
        energy += Math.min(25, totalAfterburn);

        // --- D. FUEL MODIFIER (Meals) ---
        List<Meal> recentMeals = mealRepository.findByUserIdAndLoggedAtBetween(user.getId(), recentWorkoutsStart, time.toInstant(ZoneOffset.UTC));
        for (Meal m : recentMeals) {
            long minutesAgo = Duration.between(m.getLoggedAt(), time.toInstant(ZoneOffset.UTC)).toMinutes();
            if (minutesAgo < 180) { // 3 hours window
                double fuelFactor = 1.0 - (minutesAgo / 180.0);
                energy += (8.0 * fuelFactor); // Subtle glucose spike decay (+8 max boost, internal only)
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

        // --- 2. LOCAL RULE-BASED ADVICE (0 API COST) ---
        if (hour >= 23 || hour < 5) {
            return "Prioritize deep recovery for tomorrow. 💤";
        }
        
        if (energy >= 85) {
            if (trend.equals("DIPPING")) {
                return "Peak window closing. Execute key tasks now! ⚡";
            }
            return "Peak performance zone. Push hard! 🚀";
        }
        
        if (energy >= 65) { // FLOW
            if (trend.equals("SURGING")) {
                return "Energy rising. Gear up for action! 📈";
            } else if (trend.equals("DIPPING")) {
                return "Flow state active. Stay locked in. 🎯";
            } else {
                return "Keep the momentum high. Stay focused. 🔥";
            }
        }
        
        if (energy >= 45) { // STABLE
            if (trend.equals("SURGING")) {
                return "Recovering nicely. Prep for next effort. ⚡";
            } else if (trend.equals("DIPPING")) {
                return "Hydration check! Grab a quick snack. 🍎";
            } else {
                return "Maintain posture and steady breathing. 🧘‍♂️";
            }
        }
        
        // DIP (<45)
        if (trend.equals("SURGING")) {
            return "Energy rebound starting. Stand up, stretch! 🏃‍♂️";
        } else if (trend.equals("DIPPING")) {
            return "Critical energy dip. Prioritize light rest. 🔌";
        } else {
            return "Recharge time. Drink water, take a walk. 💧";
        }
    }
}
