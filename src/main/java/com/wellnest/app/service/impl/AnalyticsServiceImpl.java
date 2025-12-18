package com.wellnest.app.service.impl;

import com.wellnest.app.dto.*;
import com.wellnest.app.model.*;
import com.wellnest.app.repository.*;
import com.wellnest.app.service.AnalyticsService;
import com.wellnest.app.service.AppUserService;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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

    public AnalyticsServiceImpl(WorkoutRepository workoutRepository,
                              MealRepository mealRepository,
                              SleepLogRepository sleepLogRepository,
                              WaterIntakeRepository waterIntakeRepository,
                              AppUserService appUserService,
                              UserRepository userRepository,
                              WeightLogRepository weightLogRepository) {
        this.workoutRepository = workoutRepository;
        this.mealRepository = mealRepository;
        this.sleepLogRepository = sleepLogRepository;
        this.waterIntakeRepository = waterIntakeRepository;
        this.appUserService = appUserService;
        this.userRepository = userRepository;
        this.weightLogRepository = weightLogRepository;
    }

    @Override
    public AnalyticsSummary getUserAnalytics(Authentication authentication) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(6); // Default to last 7 days
        return getUserAnalytics(authentication, startDate, endDate);
    }

    @Override
    public AnalyticsSummary getUserAnalytics(Authentication authentication, LocalDate startDate, LocalDate endDate) {
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);

        AnalyticsSummary summary = new AnalyticsSummary();
        summary.setStartDate(startDate);
        summary.setEndDate(endDate);

        summary.setWorkoutAnalytics(calculateWorkoutAnalytics(userId, startDateTime, endDateTime));
        long days = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        summary.setNutritionAnalytics(calculateNutritionAnalytics(userId, startDateTime, endDateTime, days));
        summary.setSleepAnalytics(calculateSleepAnalytics(userId, startDate, endDate)); // Uses LocalDate
        summary.setWaterIntakeAnalytics(calculateWaterIntakeAnalytics(userId, startDateTime, endDateTime));
        summary.setGoalProgress(calculateGoalProgress(user, startDateTime, endDateTime));
        summary.setHealthMetrics(calculateHealthMetrics(user));
        summary.setWorkoutConsistency(calculateWorkoutConsistency(userId));

        return summary;
    }

    private WorkoutAnalytics calculateWorkoutAnalytics(Long userId, LocalDateTime startDateTime, LocalDateTime endDateTime) {
        List<Workout> workouts = workoutRepository.findByUserIdAndPerformedAtBetween(userId, startDateTime, endDateTime);
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
        double totalDuration = workouts.stream().mapToDouble(Workout::getDurationMinutes).sum();
        analytics.setTotalDuration(totalDuration);
        analytics.setAvgDuration(totalDuration / workouts.size());

        Map<String, Integer> workoutsByType = workouts.stream()
                .collect(Collectors.groupingBy(Workout::getType, Collectors.summingInt(w -> 1)));
        analytics.setWorkoutsByType(workoutsByType);

        Map<String, Double> weeklyTrend = workouts.stream()
                .collect(Collectors.groupingBy(w -> w.getPerformedAt().toLocalDate().toString(),
                        Collectors.summingDouble(Workout::getDurationMinutes)));
        analytics.setWeeklyTrend(weeklyTrend);

        return analytics;
    }

    private NutritionAnalytics calculateNutritionAnalytics(Long userId, LocalDateTime startDateTime, LocalDateTime endDateTime, long days) {
        List<Meal> meals = mealRepository.findByUserIdAndLoggedAtBetween(userId, startDateTime, endDateTime);
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

        double totalCalories = meals.stream().mapToDouble(Meal::getCalories).sum();
        double totalProtein = meals.stream().mapToDouble(Meal::getProtein).sum();
        double totalCarbs = meals.stream().mapToDouble(Meal::getCarbs).sum();
        double totalFat = meals.stream().mapToDouble(Meal::getFats).sum();

        analytics.setAvgDailyCalories(totalCalories / days);
        analytics.setAvgDailyProtein(totalProtein / days);
        analytics.setAvgDailyCarbs(totalCarbs / days);
        analytics.setAvgDailyFat(totalFat / days);

        Map<String, Double> weeklyCalorieTrend = meals.stream()
                .collect(Collectors.groupingBy(m -> m.getLoggedAt().toLocalDate().toString(),
                        Collectors.summingDouble(Meal::getCalories)));
        analytics.setWeeklyCalorieTrend(weeklyCalorieTrend);

        Map<String, Double> macroDistribution = new HashMap<>();
        macroDistribution.put("protein", totalProtein);
        macroDistribution.put("carbs", totalCarbs);
        macroDistribution.put("fat", totalFat);
        analytics.setMacronutrientDistribution(macroDistribution);

        return analytics;
    }

    private SleepAnalytics calculateSleepAnalytics(Long userId, LocalDate startDate, LocalDate endDate) {
        List<SleepLog> sleepLogs = sleepLogRepository.findByUserIdAndSleepDateBetween(userId, startDate, endDate);
        SleepAnalytics analytics = new SleepAnalytics();

        if (sleepLogs.isEmpty()) {
            analytics.setAvgSleepDuration(0);
            analytics.setAvgSleepQuality(0);
            analytics.setWeeklySleepTrend(Collections.emptyMap());
            analytics.setSleepConsistency("N/A");
            return analytics;
        }

        double avgDuration = sleepLogs.stream().mapToDouble(SleepLog::getHours).average().orElse(0);
        analytics.setAvgSleepDuration(avgDuration);

        // Map string quality to a number for averaging
        double avgQuality = sleepLogs.stream()
                .mapToDouble(s -> {
                    switch (s.getQuality() != null ? s.getQuality().toLowerCase() : "") {
                        case "good": return 5.0;
                        case "fair": return 3.0;
                        case "poor": return 1.0;
                        default: return 0.0; // Or some other default
                    }
                })
                .filter(q -> q > 0) // Exclude logs without quality
                .average().orElse(0);
        analytics.setAvgSleepQuality(avgQuality);

        Map<String, Double> weeklyTrend = sleepLogs.stream()
                .collect(Collectors.toMap(s -> s.getSleepDate().toString(), SleepLog::getHours, (oldValue, newValue) -> newValue));
        analytics.setWeeklySleepTrend(weeklyTrend);

        // Basic consistency logic
        double stdDev = calculateStandardDeviation(sleepLogs.stream().map(SleepLog::getHours).collect(Collectors.toList()));
        if (stdDev < 1.0) analytics.setSleepConsistency("Good");
        else if (stdDev < 2.0) analytics.setSleepConsistency("Fair");
        else analytics.setSleepConsistency("Poor");

        return analytics;
    }

    private WaterIntakeAnalytics calculateWaterIntakeAnalytics(Long userId, LocalDateTime startDateTime, LocalDateTime endDateTime) {
        List<WaterIntake> waterIntakes = waterIntakeRepository.findByUserIdAndLoggedAtBetween(userId, startDateTime, endDateTime);
        WaterIntakeAnalytics analytics = new WaterIntakeAnalytics();
        // Assuming a default target, this could be user-specific in the future
        double targetIntake = 2000; // ml
        analytics.setTargetDailyIntake(targetIntake);

        if (waterIntakes.isEmpty()) {
            analytics.setAvgDailyIntake(0);
            analytics.setDaysMetGoal(0);
            analytics.setWeeklyIntakeTrend(Collections.emptyMap());
            return analytics;
        }

        // WaterIntake model uses 'liters', converting to ml for consistency with DTO
        double avgIntake = waterIntakes.stream().mapToDouble(w -> w.getLiters() * 1000).average().orElse(0);
        analytics.setAvgDailyIntake(avgIntake);

        long daysMetGoal = waterIntakes.stream().filter(w -> (w.getLiters() * 1000) >= targetIntake).count();
        analytics.setDaysMetGoal((int) daysMetGoal);

        Map<String, Double> weeklyTrend = waterIntakes.stream()
                .collect(Collectors.groupingBy(w -> w.getLoggedAt().toLocalDate().toString(),
                        Collectors.summingDouble(w -> w.getLiters() * 1000)));
        analytics.setWeeklyIntakeTrend(weeklyTrend);

        return analytics;
    }

    private GoalProgress calculateGoalProgress(User user, LocalDateTime startDateTime, LocalDateTime endDateTime) {
    GoalProgress progress = new GoalProgress();
    String goal = user.getFitnessGoal();
    if (goal == null || goal.isEmpty()) {
        return null; // No goal set
    }

    progress.setGoalType(goal);

    if ("WEIGHT_LOSS".equalsIgnoreCase(goal)) {
        Double targetWeight = user.getTargetWeightKg();
        if (targetWeight == null) {
            return null; // No target weight set
        }
        
        Double currentWeight = user.getWeightKg();
        if (currentWeight == null) {
            return null; // Current weight not set
        }

        progress.setCurrentValue(currentWeight);
        progress.setTargetValue(targetWeight);
        progress.setUnit("kg");

        // Get the initial weight from the weight logs or use current weight as fallback
        List<WeightLog> allWeightLogs = weightLogRepository.findByUserIdOrderByLogDateAsc(user.getId());
        double initialWeight = allWeightLogs.isEmpty() ? currentWeight : allWeightLogs.get(0).getWeightKg();
        
        double weightLost = initialWeight - currentWeight;
        double totalToLose = initialWeight - targetWeight;

        int percentage = 0;
        if (totalToLose > 0) {
            percentage = (int) ((weightLost / totalToLose) * 100);
            percentage = Math.max(0, Math.min(100, percentage));
        }
        progress.setPercentageComplete(percentage);

        if (totalToLose > 0) {
            if (percentage >= 75) {
                progress.setStatus("On Track");
                progress.setRecommendation("Great progress! Keep up the good work with your diet and exercise routine.");
            } else if (percentage >= 40) {
                progress.setStatus("Needs Improvement");
                progress.setRecommendation("You're making progress, but let's try to be more consistent with your goals.");
            } else {
                progress.setStatus("At Risk");
                progress.setRecommendation("Let's adjust your plan. Consider reviewing your diet and exercise routine.");
            }
        } else {
            progress.setStatus("Target Reached");
            progress.setRecommendation("Congratulations! You've reached your target weight. Consider setting a new goal.");
        }

        // Get weight logs for the specified date range
        List<WeightLog> weightLogs = weightLogRepository.findByUserIdAndLogDateBetween(
            user.getId(), 
            startDateTime.toLocalDate(), 
            endDateTime.toLocalDate()
        );
        
        // Create a map of log date to weight
        Map<String, Double> weeklyTrend = weightLogs.stream()
                .collect(Collectors.toMap(
                    w -> w.getLogDate().toString(), 
                    WeightLog::getWeightKg, 
                    (oldValue, newValue) -> newValue
                ));
        progress.setWeeklyProgressTrend(weeklyTrend);
    } else if ("WORKOUT_FREQUENCY".equalsIgnoreCase(goal)) {
        // Existing workout frequency logic remains the same
        List<Workout> workouts = workoutRepository.findByUserIdAndPerformedAtBetween(user.getId(), startDateTime, endDateTime);
        // Assume goal is 4 workouts per week
        long days = ChronoUnit.DAYS.between(startDateTime.toLocalDate(), endDateTime.toLocalDate()) + 1;
        double weeks = days / 7.0;
        double targetWorkouts = 4 * weeks;

        progress.setCurrentValue(workouts.size());
        progress.setTargetValue(targetWorkouts);
        progress.setUnit("workouts");

        int percentage = (int) ((workouts.size() / targetWorkouts) * 100);
        progress.setPercentageComplete(Math.max(0, Math.min(100, percentage)));

        if (percentage >= 90) progress.setStatus("On Track");
        else if (percentage >= 60) progress.setStatus("Needs Improvement");
        else progress.setStatus("At Risk");
        
        progress.setRecommendation("Try to schedule your workouts in advance to stay consistent.");

        Map<String, Double> weeklyTrend = workouts.stream()
            .collect(Collectors.groupingBy(w -> w.getPerformedAt().toLocalDate().toString(),
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
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(89); // Approx 3 months

        List<Workout> workouts = workoutRepository.findByUserIdAndPerformedAtBetween(userId, startDate.atStartOfDay(), endDate.atTime(LocalTime.MAX));

        Map<LocalDate, Integer> workoutCounts = workouts.stream()
                .collect(Collectors.groupingBy(w -> w.getPerformedAt().toLocalDate(), Collectors.summingInt(w -> 1)));

        WorkoutConsistency consistency = new WorkoutConsistency();
        consistency.setStartDate(startDate);
        consistency.setEndDate(endDate);
        consistency.setWorkoutCounts(workoutCounts);

        return consistency;
    }

    private double calculateStandardDeviation(List<Double> values) {
        if (values.size() < 2) return 0.0;
        double mean = values.stream().mapToDouble(v -> v).average().orElse(0.0);
        double variance = values.stream().mapToDouble(v -> Math.pow(v - mean, 2)).sum() / (values.size() - 1);
        return Math.sqrt(variance);
    }
}
