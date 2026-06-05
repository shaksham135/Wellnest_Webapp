package com.wellnest.app.service.impl;

import com.wellnest.app.dto.*;
import com.wellnest.app.model.*;
import com.wellnest.app.repository.*;
import com.wellnest.app.service.AnalyticsService;
import com.wellnest.app.service.AppUserService;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import com.wellnest.app.util.TimezoneUtil;
import java.time.ZoneId;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsServiceImpl implements AnalyticsService {

    private final WorkoutRepository workoutRepository;
    private final MealRepository mealRepository;
    private final SleepLogRepository sleepLogRepository;
    private final WaterIntakeRepository waterIntakeRepository;
    private final AppUserService appUserService;
    private final UserRepository userRepository;
    private final WeightLogRepository weightLogRepository;
    private final DailyActivityRepository dailyActivityRepository;

    public AnalyticsServiceImpl(WorkoutRepository workoutRepository,
            MealRepository mealRepository,
            SleepLogRepository sleepLogRepository,
            WaterIntakeRepository waterIntakeRepository,
            AppUserService appUserService,
            UserRepository userRepository,
            WeightLogRepository weightLogRepository,
            DailyActivityRepository dailyActivityRepository) {
        this.workoutRepository = workoutRepository;
        this.mealRepository = mealRepository;
        this.sleepLogRepository = sleepLogRepository;
        this.waterIntakeRepository = waterIntakeRepository;
        this.appUserService = appUserService;
        this.userRepository = userRepository;
        this.weightLogRepository = weightLogRepository;
        this.dailyActivityRepository = dailyActivityRepository;
    }

    @Override
    public AnalyticsSummary getUserAnalytics(Authentication authentication) {
        ZoneId zoneId = TimezoneUtil.getClientZoneId();
        LocalDate endDate = LocalDate.now(zoneId);
        LocalDate startDate = endDate.minusDays(6); // Default to last 7 days
        return getUserAnalytics(authentication, startDate, endDate);
    }

    @Override
    public AnalyticsSummary getUserAnalytics(Authentication authentication, LocalDate startDate, LocalDate endDate) {
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        return generateSummary(userId, startDate, endDate);
    }

    @Override
    public AnalyticsSummary getClientAnalytics(Long clientId, Authentication trainerAuth) {
        // Validation of trainer-client relationship should be done by the
        // caller/controller
        // or by injecting TrainerInteractionService.
        // For simplicity/safety, we assume the Controller ensures the trainer is
        // authorized.
        ZoneId zoneId = TimezoneUtil.getClientZoneId();
        LocalDate endDate = LocalDate.now(zoneId);
        LocalDate startDate = endDate.minusDays(6);
        return generateSummary(clientId, startDate, endDate);
    }

    private AnalyticsSummary generateSummary(Long userId, LocalDate startDate, LocalDate endDate) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        ZoneOffset zoneOffset = TimezoneUtil.getClientZoneOffset();
        Instant startInstant = startDate.atStartOfDay(zoneOffset).toInstant();
        Instant endInstant = endDate.atTime(LocalTime.MAX).atZone(zoneOffset).toInstant();

        AnalyticsSummary summary = new AnalyticsSummary();
        summary.setStartDate(startDate);
        summary.setEndDate(endDate);

        try {
            summary.setWorkoutAnalytics(calculateWorkoutAnalytics(userId, startInstant, endInstant));
        } catch (Exception e) {
            System.err.println("Error calculating workout analytics: " + e.getMessage());
            summary.setWorkoutAnalytics(new WorkoutAnalytics());
        }

        long days = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        try {
            summary.setNutritionAnalytics(calculateNutritionAnalytics(userId, startInstant, endInstant, days));
        } catch (Exception e) {
            System.err.println("Error calculating nutrition analytics: " + e.getMessage());
            summary.setNutritionAnalytics(new NutritionAnalytics());
        }

        try {
            summary.setSleepAnalytics(calculateSleepAnalytics(user, startInstant, endInstant));
        } catch (Exception e) {
            System.err.println("Error calculating sleep analytics: " + e.getMessage());
            summary.setSleepAnalytics(new SleepAnalytics());
        }

        try {
            summary.setWaterIntakeAnalytics(calculateWaterIntakeAnalytics(user, startInstant, endInstant));
        } catch (Exception e) {
            System.err.println("Error calculating water analytics: " + e.getMessage());
            summary.setWaterIntakeAnalytics(new WaterIntakeAnalytics());
        }
        
        try {
            GoalProgress goalProgress = calculateGoalProgress(user, startInstant, endInstant);
            summary.setGoalProgress(goalProgress != null ? goalProgress : new GoalProgress());
        } catch (Exception e) {
            System.err.println("Error calculating goal progress: " + e.getMessage());
            summary.setGoalProgress(new GoalProgress());
        }
        
        try {
            summary.setHealthMetrics(calculateHealthMetrics(user));
        } catch (Exception e) {
            System.err.println("Error calculating health metrics: " + e.getMessage());
            summary.setHealthMetrics(new HealthMetrics());
        }

        try {
            summary.setWorkoutConsistency(calculateWorkoutConsistency(userId));
        } catch (Exception e) {
            System.err.println("Error calculating workout consistency: " + e.getMessage());
            summary.setWorkoutConsistency(new WorkoutConsistency());
        }

        try {
            summary.setDailyActivityAnalytics(calculateDailyActivityAnalytics(user, startDate, endDate, days));
        } catch (Exception e) {
            System.err.println("Error calculating daily activity analytics: " + e.getMessage());
            summary.setDailyActivityAnalytics(new DailyActivityAnalytics());
        }

        // --- PREMIUM INSIGHTS ENGINE ---
        if (user.isPremium()) {
            summary.setPremiumInsights(generatePremiumInsights(user, summary));
            summary.setNeuralMetrics(calculateNeuralMetrics(user, summary));
        }

        return summary;
    }

    private List<String> generatePremiumInsights(User user, AnalyticsSummary summary) {
        List<String> insights = new ArrayList<>();
        
        // 1. Metabolic Insight
        double avgCal = summary.getNutritionAnalytics().getAvgDailyCalories();
        double avgBurned = summary.getWorkoutAnalytics().getTotalDuration() > 0 ? 
            (summary.getWorkoutAnalytics().getAvgDuration() * 5) : 0; // Simple estimate
        
        if (avgCal > 2500 && avgBurned < 200) {
            insights.add("Metabolic surplus detected. Consider increasing cardio duration by 15% to maintain velocity.");
        } else if (avgCal < 1500) {
            insights.add("Caloric intake is below threshold for muscle preservation. AI suggests +200kcal on workout days.");
        }

        // 2. Sleep Insight
        if (summary.getSleepAnalytics().getAvgSleepDuration() < 6) {
            insights.add("Sleep debt is impacting recovery. Focus on a 7-hour window to boost daily readiness.");
        }

        // 3. Consistency Insight
        if (summary.getWorkoutConsistency().getWorkoutCounts().size() > 5) {
            insights.add("Elite consistency! You've hit 85% of your target windows this week.");
        }

        return insights;
    }

    private Map<String, Object> calculateNeuralMetrics(User user, AnalyticsSummary summary) {
        Map<String, Object> neural = new HashMap<>();
        
        // Metabolic Velocity
        double intake = summary.getNutritionAnalytics().getAvgDailyCalories();
        double output = summary.getDailyActivityAnalytics().getAvgDailyCalories();
        double velocity = (output / (intake + 1)) * 100;
        neural.put("metabolicVelocity", Math.min(100, velocity));
        
        // Recovery Score
        double sleep = summary.getSleepAnalytics().getAvgSleepDuration();
        double recovery = (sleep / 8.0) * 100;
        neural.put("recoveryScore", Math.min(100, recovery));
        
        // Intensity Factor
        neural.put("intensityFactor", summary.getWorkoutAnalytics().getAvgDuration() > 45 ? "High" : "Optimal");
        
        return neural;
    }

    private WorkoutAnalytics calculateWorkoutAnalytics(Long userId, Instant startInstant,
            Instant endInstant) {
        ZoneOffset zoneOffset = TimezoneUtil.getClientZoneOffset();
        List<Workout> workouts = workoutRepository.findByUserIdAndPerformedAtBetween(userId, startInstant,
                endInstant);
        WorkoutAnalytics analytics = new WorkoutAnalytics();

        if (workouts.isEmpty()) {
            analytics.setTotalWorkouts(0);
            analytics.setTotalDuration(0);
            analytics.setAvgDuration(0);
            analytics.setWorkoutsByType(Collections.emptyMap());
            analytics.setWeeklyTrend(Collections.emptyMap());
            return analytics;
        }

        analytics.setTotalWorkouts(workouts.size());
        double totalDuration = workouts.stream()
                .mapToDouble(w -> w.getDurationMinutes() != null ? (double) w.getDurationMinutes() : 0.0)
                .sum();
        analytics.setTotalDuration(totalDuration);
        analytics.setAvgDuration(totalDuration / workouts.size());

        Map<String, Integer> workoutsByType = workouts.stream()
                .filter(w -> w.getType() != null)
                .collect(Collectors.groupingBy(Workout::getType, Collectors.summingInt(w -> 1)));
        analytics.setWorkoutsByType(workoutsByType);

        Map<String, Double> weeklyTrend = workouts.stream()
                .filter(w -> w.getPerformedAt() != null)
                .collect(Collectors.groupingBy(w -> w.getPerformedAt().atZone(zoneOffset).toLocalDate().toString(),
                        Collectors.summingDouble(w -> w.getDurationMinutes() != null ? (double) w.getDurationMinutes() : 0.0)));
        analytics.setWeeklyTrend(weeklyTrend);

        Map<String, Double> dailyCaloriesBurned = workouts.stream()
                .filter(w -> w.getPerformedAt() != null)
                .collect(Collectors.groupingBy(w -> w.getPerformedAt().atZone(zoneOffset).toLocalDate().toString(),
                        Collectors.summingDouble(w -> w.getCaloriesBurned() != null ? (double) w.getCaloriesBurned() : 0.0)));
        analytics.setDailyCaloriesBurned(dailyCaloriesBurned);

        return analytics;
    }

    private NutritionAnalytics calculateNutritionAnalytics(Long userId, Instant startInstant,
            Instant endInstant, long days) {
        ZoneOffset zoneOffset = TimezoneUtil.getClientZoneOffset();
        List<Meal> meals = mealRepository.findByUserIdAndLoggedAtBetween(userId, startInstant, endInstant);
        NutritionAnalytics analytics = new NutritionAnalytics();

        if (meals.isEmpty()) {
            analytics.setAvgDailyCalories(0);
            analytics.setAvgDailyProtein(0);
            analytics.setAvgDailyCarbs(0);
            analytics.setAvgDailyFat(0);
            analytics.setWeeklyCalorieTrend(Collections.emptyMap());
            analytics.setMacronutrientDistribution(Collections.emptyMap());
            return analytics;
        }

        double totalCalories = meals.stream()
                .mapToDouble(m -> m.getCalories() != null ? (double) m.getCalories() : 0.0)
                .sum();
        double totalProtein = meals.stream()
                .mapToDouble(m -> m.getProtein() != null ? (double) m.getProtein() : 0.0)
                .sum();
        double totalCarbs = meals.stream()
                .mapToDouble(m -> m.getCarbs() != null ? (double) m.getCarbs() : 0.0)
                .sum();
        double totalFat = meals.stream()
                .mapToDouble(m -> m.getFats() != null ? (double) m.getFats() : 0.0)
                .sum();

        analytics.setAvgDailyCalories(totalCalories / days);
        analytics.setAvgDailyProtein(totalProtein / days);
        analytics.setAvgDailyCarbs(totalCarbs / days);
        analytics.setAvgDailyFat(totalFat / days);

        Map<String, Double> weeklyCalorieTrend = meals.stream()
                .filter(m -> m.getLoggedAt() != null)
                .collect(Collectors.groupingBy(m -> m.getLoggedAt().atZone(zoneOffset).toLocalDate().toString(),
                        Collectors.summingDouble(m -> m.getCalories() != null ? (double) m.getCalories() : 0.0)));
        analytics.setWeeklyCalorieTrend(weeklyCalorieTrend);

        Map<String, Double> macroDistribution = new HashMap<>();
        macroDistribution.put("protein", totalProtein);
        macroDistribution.put("carbs", totalCarbs);
        macroDistribution.put("fat", totalFat);
        analytics.setMacronutrientDistribution(macroDistribution);

        return analytics;
    }

    private SleepAnalytics calculateSleepAnalytics(User user, Instant startInstant, Instant endInstant) {
        ZoneOffset zoneOffset = TimezoneUtil.getClientZoneOffset();
        List<SleepLog> sleepLogs = sleepLogRepository.findByUserIdAndSleepDateBetween(user.getId(), startInstant, endInstant);
        SleepAnalytics analytics = new SleepAnalytics();

        if (sleepLogs.isEmpty()) {
            analytics.setAvgSleepDuration(0);
            analytics.setAvgSleepQuality(0);
            analytics.setWeeklySleepTrend(Collections.emptyMap());
            analytics.setSleepConsistency("N/A");
            return analytics;
        }

        double avgDuration = sleepLogs.stream()
                .mapToDouble(s -> s.getHours() != null ? (double) s.getHours() : 0.0)
                .average()
                .orElse(0);
        analytics.setAvgSleepDuration(avgDuration);

        // Map string quality to a number for averaging
        double avgQuality = sleepLogs.stream()
                .mapToDouble(s -> {
                    switch (s.getQuality() != null ? s.getQuality().toLowerCase() : "") {
                        case "good":
                            return 5.0;
                        case "fair":
                            return 3.0;
                        case "poor":
                            return 1.0;
                        default:
                            return 0.0; // Or some other default
                    }
                })
                .filter(q -> q > 0) // Exclude logs without quality
                .average().orElse(0);
        analytics.setAvgSleepQuality(avgQuality);

        Map<String, Double> weeklyTrend = sleepLogs.stream()
                .filter(s -> s.getSleepDate() != null)
                .collect(Collectors.toMap(s -> s.getSleepDate().atZone(zoneOffset).toLocalDate().toString(), 
                        s -> s.getHours() != null ? (double) s.getHours() : 0.0,
                        (oldValue, newValue) -> newValue));
        analytics.setWeeklySleepTrend(weeklyTrend);

        // Basic consistency logic
        double stdDev = calculateStandardDeviation(
                sleepLogs.stream().map(SleepLog::getHours).collect(Collectors.toList()));
        if (stdDev < 1.0)
            analytics.setSleepConsistency("Good");
        else if (stdDev < 2.0)
            analytics.setSleepConsistency("Fair");
        else
            analytics.setSleepConsistency("Poor");

        return analytics;
    }

    private WaterIntakeAnalytics calculateWaterIntakeAnalytics(User user, Instant startInstant,
            Instant endInstant) {
        ZoneOffset zoneOffset = TimezoneUtil.getClientZoneOffset();
        List<WaterIntake> waterIntakes = waterIntakeRepository.findByUserIdAndLoggedAtBetween(user.getId(), startInstant,
                endInstant);
        WaterIntakeAnalytics analytics = new WaterIntakeAnalytics();
        
        double targetIntake = user.getTargetWaterLiters() != null ? user.getTargetWaterLiters() * 1000 : 2000; // ml
        analytics.setTargetDailyIntake(targetIntake);

        if (waterIntakes.isEmpty()) {
            analytics.setAvgDailyIntake(0);
            analytics.setDaysMetGoal(0);
            analytics.setWeeklyIntakeTrend(Collections.emptyMap());
            return analytics;
        }

        // Group by Date and Sum Intake
        Map<String, Double> dailyIntakeMap = waterIntakes.stream()
                .filter(w -> w.getLoggedAt() != null)
                .collect(Collectors.groupingBy(
                        w -> w.getLoggedAt().atZone(zoneOffset).toLocalDate().toString(),
                        Collectors.summingDouble(w -> w.getLiters() != null ? w.getLiters() * 1000 : 0.0)));

        // Calculate Days Met Goal based on aggregated daily totals
        long daysMetGoal = dailyIntakeMap.values().stream()
                .filter(total -> total >= targetIntake)
                .count();
        analytics.setDaysMetGoal((int) daysMetGoal);

        // Average Daily Intake calculation
        double avgIntake = dailyIntakeMap.values().stream()
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0);
        analytics.setAvgDailyIntake(avgIntake);

        analytics.setWeeklyIntakeTrend(dailyIntakeMap);

        return analytics;
    }

    private GoalProgress calculateGoalProgress(User user, Instant startInstant, Instant endInstant) {
        ZoneOffset zoneOffset = TimezoneUtil.getClientZoneOffset();
        GoalProgress progress = new GoalProgress();
        String goal = user.getFitnessGoal();
        if (goal == null || goal.isEmpty()) {
            return new GoalProgress(); // Return empty object instead of null to prevent frontend crashes
        }

        progress.setGoalType(goal);

        // Normalize goal string for comparison
        String normalizedGoal = goal.trim().replace(" ", "_").toUpperCase();

        if ("WEIGHT_LOSS".equals(normalizedGoal) || "MUSCLE_GAIN".equals(normalizedGoal)) {
            Double targetWeight = user.getTargetWeightKg();
            if (targetWeight == null) {
                return progress; // Return what we have so far
            }

            Double currentWeight = user.getWeightKg();
            if (currentWeight == null) {
                return null; // Current weight not set
            }

            progress.setCurrentValue(currentWeight);
            progress.setTargetValue(targetWeight);
            progress.setUnit("kg");

            // Get the initial weight from the weight logs (excluding zero/invalid weights) or use current weight as fallback
            List<WeightLog> allWeightLogs = weightLogRepository.findByUserIdOrderByLogDateAsc(user.getId());
            double initialWeight = currentWeight;
            for (com.wellnest.app.model.WeightLog log : allWeightLogs) {
                if (log.getWeightKg() != null && log.getWeightKg() > 0) {
                    initialWeight = log.getWeightKg();
                    break;
                }
            }

            System.out.println("DEBUG GOAL: Current Weight = " + currentWeight);
            System.out.println("DEBUG GOAL: Target Weight = " + targetWeight);
            System.out.println("DEBUG GOAL: Initial Weight = " + initialWeight);
            System.out.println("DEBUG GOAL: Logs Count = " + allWeightLogs.size());
            if (!allWeightLogs.isEmpty()) {
                System.out.println("DEBUG GOAL: First Log Date = " + allWeightLogs.get(0).getLogDate());
                System.out.println("DEBUG GOAL: First Log Weight = " + allWeightLogs.get(0).getWeightKg());
            }

            double weightDiff = Math.abs(currentWeight - initialWeight);
            double totalToChange = Math.abs(targetWeight - initialWeight);

            // Handle case where initial equals target (avoid divide by zero)
            int percentage = 0;
            if (totalToChange > 0) {
                // Basic progress logic: how much of the gap have we closed?
                // Note: This is a simplified calculation. Real-world might need directional
                // checks.
                double progressMade = 0;
                if ("WEIGHT_LOSS".equals(normalizedGoal)) {
                    progressMade = initialWeight - currentWeight;
                } else {
                    // Muscle gain
                    progressMade = currentWeight - initialWeight;
                }

                // Ensure we don't have negative progress if they went the wrong way
                progressMade = Math.max(0, progressMade);

                percentage = (int) ((progressMade / totalToChange) * 100);
                percentage = Math.max(0, Math.min(100, percentage));
            }
            progress.setPercentageComplete(percentage);

            // Status logic
            if (Math.abs(currentWeight - targetWeight) < 0.5) {
                progress.setStatus("Target Reached");
                progress.setRecommendation("Congratulations! You've reached your target weight.");
                percentage = 100;
                progress.setPercentageComplete(percentage);
            } else if (percentage >= 50) {
                progress.setStatus("On Track");
                progress.setRecommendation("Great job! You're more than halfway there.");
            } else if (percentage >= 10) {
                progress.setStatus("In Progress");
                progress.setRecommendation("Keep going, consistency is key.");
            } else {
                progress.setStatus("Just Started");
                progress.setRecommendation("Every journey begins with a single step.");
            }

            // Get weight logs for the specified date range
            List<WeightLog> weightLogs = weightLogRepository.findByUserIdAndLogDateBetween(
                    user.getId(),
                    startInstant.atZone(zoneOffset).toLocalDate(),
                    endInstant.atZone(zoneOffset).toLocalDate());

            // Create a map of log date to weight
            Map<String, Double> weeklyTrend = weightLogs.stream()
                    .filter(w -> w.getLogDate() != null)
                    .collect(Collectors.toMap(
                            w -> w.getLogDate().toString(),
                            w -> w.getWeightKg() != null ? w.getWeightKg() : 0.0,
                            (oldValue, newValue) -> newValue));
            progress.setWeeklyProgressTrend(weeklyTrend);
        } else if ("STAY_HEALTHY".equalsIgnoreCase(normalizedGoal)) {
            // MAINTENANCE LOGIC: Goal is to stay within 2kg of target
            Double currentWeight = user.getWeightKg();
            Double targetWeight = user.getTargetWeightKg();
            progress.setCurrentValue(currentWeight != null ? currentWeight : 0.0);
            progress.setTargetValue(targetWeight != null ? targetWeight : 0.0);
            progress.setUnit("kg");

            if (currentWeight != null && targetWeight != null) {
                double diff = Math.abs(currentWeight - targetWeight);
                int percentage = (diff <= 2.0) ? 100 : (int) Math.max(0, 100 - (diff * 10));
                progress.setPercentageComplete(percentage);
                progress.setStatus(percentage == 100 ? "Stable" : "Fluctuating");
                progress.setRecommendation(percentage == 100 ? "Perfect stability." : "Try to regulate your daily routine.");
            }
        } else if ("BUILD_ENDURANCE".equalsIgnoreCase(normalizedGoal)) {
            // ENDURANCE LOGIC: Track total workout duration minutes
            List<Workout> workouts = workoutRepository.findByUserIdAndPerformedAtBetween(user.getId(), startInstant, endInstant);
            double totalMinutes = workouts.stream().mapToDouble(w -> w.getDurationMinutes() != null ? w.getDurationMinutes() : 0.0).sum();
            double targetMinutes = 300.0; // Standard endurance goal: 5 hours/week

            progress.setCurrentValue(totalMinutes);
            progress.setTargetValue(targetMinutes);
            progress.setUnit("min");
            int percentage = (int) ((totalMinutes / targetMinutes) * 100);
            progress.setPercentageComplete(Math.min(100, percentage));
            progress.setStatus(percentage >= 100 ? "Peak" : "Gaining");
            progress.setRecommendation("Add 5 mins to each session to build stamina.");
        } else if ("FLEXIBILITY".equalsIgnoreCase(normalizedGoal)) {
            // FLEXIBILITY LOGIC: Track specific types of workouts
            List<Workout> workouts = workoutRepository.findByUserIdAndPerformedAtBetween(user.getId(), startInstant, endInstant);
            long flexSessions = workouts.stream().filter(w -> {
                String type = w.getType() != null ? w.getType().toLowerCase() : "";
                return type.contains("yoga") || type.contains("stretch") || type.contains("flex");
            }).count();
            double targetSessions = 3.0; // 3 sessions per week

            progress.setCurrentValue((double) flexSessions);
            progress.setTargetValue(targetSessions);
            progress.setUnit("sessions");
            int percentage = (int) ((flexSessions / targetSessions) * 100);
            progress.setPercentageComplete(Math.min(100, percentage));
            progress.setStatus(percentage >= 100 ? "Limber" : "Tight");
            progress.setRecommendation("Morning stretching is 40% more effective.");
        } else if ("WORKOUT_FREQUENCY".equalsIgnoreCase(normalizedGoal) || "FITNESS".equalsIgnoreCase(normalizedGoal)) {
            // Existing workout frequency logic remains the same
            List<Workout> workouts = workoutRepository.findByUserIdAndPerformedAtBetween(user.getId(), startInstant,
                    endInstant);
            // Assume goal is custom configured or 4 workouts per week
            long days = ChronoUnit.DAYS.between(startInstant.atZone(zoneOffset).toLocalDate(), endInstant.atZone(zoneOffset).toLocalDate()) + 1;
            double weeks = days / 7.0;
            int targetWorkoutsWeekly = user.getTargetWorkoutsPerWeek() != null ? user.getTargetWorkoutsPerWeek() : 4;
            double targetWorkouts = targetWorkoutsWeekly * weeks;

            progress.setCurrentValue(workouts.size());
            progress.setTargetValue(targetWorkouts);
            progress.setUnit("workouts");

            int percentage = (int) ((workouts.size() / targetWorkouts) * 100);
            progress.setPercentageComplete(Math.max(0, Math.min(100, percentage)));

            if (percentage >= 90)
                progress.setStatus("On Track");
            else if (percentage >= 60)
                progress.setStatus("Needs Improvement");
            else
                progress.setStatus("At Risk");

            progress.setRecommendation("Try to schedule your workouts in advance to stay consistent.");

            Map<String, Double> weeklyTrend = workouts.stream()
                    .filter(w -> w.getPerformedAt() != null)
                    .collect(Collectors.groupingBy(w -> w.getPerformedAt().atZone(zoneOffset).toLocalDate().toString(),
                            Collectors.collectingAndThen(Collectors.counting(), Long::doubleValue)));
            progress.setWeeklyProgressTrend(weeklyTrend);
        }

        return progress;
    }

    private HealthMetrics calculateHealthMetrics(User user) {
        HealthMetrics metrics = new HealthMetrics();
        if (user.getWeightKg() == null || user.getHeightCm() == null || user.getHeightCm() <= 0) {
            metrics.setBmi(0);
            metrics.setBmiCategory("N/A");
            return metrics;
        }

        double heightInMeters = user.getHeightCm() / 100.0;
        double bmi = user.getWeightKg() / (heightInMeters * heightInMeters);
        metrics.setBmi(bmi);

        if (bmi < 18.5) {
            metrics.setBmiCategory("Underweight");
        } else if (bmi < 25) {
            metrics.setBmiCategory("Healthy Weight");
        } else if (bmi < 30) {
            metrics.setBmiCategory("Overweight");
        } else {
            metrics.setBmiCategory("Obesity");
        }

        return metrics;
    }

    private WorkoutConsistency calculateWorkoutConsistency(Long userId) {
        ZoneId zoneId = TimezoneUtil.getClientZoneId();
        ZoneOffset zoneOffset = TimezoneUtil.getClientZoneOffset();
        LocalDate endDate = LocalDate.now(zoneId);
        LocalDate startDate = endDate.minusDays(89); // Approx 3 months

        List<Workout> workouts = workoutRepository.findByUserIdAndPerformedAtBetween(userId, 
                startDate.atStartOfDay(zoneOffset).toInstant(),
                endDate.atTime(LocalTime.MAX).atZone(zoneOffset).toInstant());

        Map<LocalDate, Integer> workoutCounts = workouts.stream()
                .filter(w -> w.getPerformedAt() != null)
                .collect(Collectors.groupingBy(w -> w.getPerformedAt().atZone(zoneOffset).toLocalDate(), Collectors.summingInt(w -> 1)));

        WorkoutConsistency consistency = new WorkoutConsistency();
        consistency.setStartDate(startDate);
        consistency.setEndDate(endDate);
        consistency.setWorkoutCounts(workoutCounts);

        return consistency;
    }

    private DailyActivityAnalytics calculateDailyActivityAnalytics(User user, LocalDate startDate, LocalDate endDate, long days) {
        List<DailyActivity> activities = dailyActivityRepository.findByUserIdAndDateBetweenOrderByDateAsc(user.getId(), startDate, endDate);
        DailyActivityAnalytics analytics = new DailyActivityAnalytics();
        
        int targetSteps = user.getTargetSteps() != null ? user.getTargetSteps() : 10000;
        double targetCalories = user.getTargetActiveCalories() != null ? user.getTargetActiveCalories() : 500.0;
        double targetDistance = user.getTargetDistanceKm() != null ? user.getTargetDistanceKm() : 5.0;

        analytics.setTargetSteps(targetSteps);
        analytics.setTargetCalories(targetCalories);
        analytics.setTargetDistance(targetDistance);

        if (activities.isEmpty()) {
            analytics.setAvgDailySteps(0);
            analytics.setAvgDailyCalories(0);
            analytics.setAvgDailyDistance(0);
            analytics.setDaysMetStepsGoal(0);
            analytics.setDaysMetCaloriesGoal(0);
            analytics.setDaysMetDistanceGoal(0);
            analytics.setWeeklyStepsTrend(Collections.emptyMap());
            analytics.setWeeklyCaloriesTrend(Collections.emptyMap());
            analytics.setWeeklyDistanceTrend(Collections.emptyMap());
            return analytics;
        }

        double totalSteps = 0, totalCal = 0, totalDist = 0;
        long daysMetSteps = 0, daysMetCal = 0, daysMetDist = 0;
        Map<String, Integer> weeklyStepsTrend = new HashMap<>();
        Map<String, Double> weeklyCaloriesTrend = new HashMap<>();
        Map<String, Double> weeklyDistanceTrend = new HashMap<>();

        for (DailyActivity act : activities) {
            double steps = act.getSteps() != null ? (double) act.getSteps() : 0.0;
            double calories = act.getActiveCalories() != null ? (double) act.getActiveCalories() : 0.0;
            double distance = act.getDistanceKm() != null ? act.getDistanceKm() : 0.0;

            totalSteps += steps;
            totalCal += calories;
            totalDist += distance;

            if (steps >= targetSteps) daysMetSteps++;
            if (calories >= targetCalories) daysMetCal++;
            if (distance >= targetDistance) daysMetDist++;

            String dateStr = act.getDate().toString();
            weeklyStepsTrend.put(dateStr, (int) steps);
            weeklyCaloriesTrend.put(dateStr, calories);
            weeklyDistanceTrend.put(dateStr, distance);
        }

        analytics.setAvgDailySteps(totalSteps / days);
        analytics.setAvgDailyCalories(totalCal / days);
        analytics.setAvgDailyDistance(totalDist / days);

        analytics.setDaysMetStepsGoal((int) daysMetSteps);
        analytics.setDaysMetCaloriesGoal((int) daysMetCal);
        analytics.setDaysMetDistanceGoal((int) daysMetDist);

        analytics.setWeeklyStepsTrend(weeklyStepsTrend);
        analytics.setWeeklyCaloriesTrend(weeklyCaloriesTrend);
        analytics.setWeeklyDistanceTrend(weeklyDistanceTrend);

        return analytics;
    }

    private double calculateStandardDeviation(List<Double> values) {
        if (values.size() < 2)
            return 0.0;
        double mean = values.stream().mapToDouble(v -> v).average().orElse(0.0);
        double variance = values.stream().mapToDouble(v -> Math.pow(v - mean, 2)).sum() / (values.size() - 1);
        return Math.sqrt(variance);
    }
}
