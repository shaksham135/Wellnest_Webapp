package com.wellnest.app.service.impl;

import com.wellnest.app.dto.*;
import com.wellnest.app.model.*;
import com.wellnest.app.repository.*;
import com.wellnest.app.service.AnalyticsService;
import com.wellnest.app.service.AppUserService;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

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
        LocalDate endDate = LocalDate.now();
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
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(6);
        return generateSummary(clientId, startDate, endDate);
    }

    private AnalyticsSummary generateSummary(Long userId, LocalDate startDate, LocalDate endDate) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        Instant startInstant = startDate.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant endInstant = endDate.atTime(LocalTime.MAX).atZone(ZoneOffset.UTC).toInstant();

        AnalyticsSummary summary = new AnalyticsSummary();
        summary.setStartDate(startDate);
        summary.setEndDate(endDate);

        summary.setWorkoutAnalytics(calculateWorkoutAnalytics(userId, startInstant, endInstant));
        long days = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        summary.setNutritionAnalytics(calculateNutritionAnalytics(userId, startInstant, endInstant, days));
        summary.setSleepAnalytics(calculateSleepAnalytics(user, startInstant, endInstant));
        summary.setWaterIntakeAnalytics(calculateWaterIntakeAnalytics(user, startInstant, endInstant));
        
        // Safety: Ensure GoalProgress doesn't return null
        GoalProgress goalProgress = calculateGoalProgress(user, startInstant, endInstant);
        summary.setGoalProgress(goalProgress != null ? goalProgress : new GoalProgress());
        
        summary.setHealthMetrics(calculateHealthMetrics(user));
        summary.setWorkoutConsistency(calculateWorkoutConsistency(userId));
        summary.setDailyActivityAnalytics(calculateDailyActivityAnalytics(user, startDate, endDate, days));

        return summary;
    }

    private WorkoutAnalytics calculateWorkoutAnalytics(Long userId, Instant startInstant,
            Instant endInstant) {
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
                .collect(Collectors.groupingBy(w -> w.getPerformedAt().atZone(ZoneOffset.UTC).toLocalDate().toString(),
                        Collectors.summingDouble(w -> w.getDurationMinutes() != null ? (double) w.getDurationMinutes() : 0.0)));
        analytics.setWeeklyTrend(weeklyTrend);

        Map<String, Double> dailyCaloriesBurned = workouts.stream()
                .filter(w -> w.getPerformedAt() != null)
                .collect(Collectors.groupingBy(w -> w.getPerformedAt().atZone(ZoneOffset.UTC).toLocalDate().toString(),
                        Collectors.summingDouble(w -> w.getCaloriesBurned() != null ? (double) w.getCaloriesBurned() : 0.0)));
        analytics.setDailyCaloriesBurned(dailyCaloriesBurned);

        return analytics;
    }

    private NutritionAnalytics calculateNutritionAnalytics(Long userId, Instant startInstant,
            Instant endInstant, long days) {
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
                .collect(Collectors.groupingBy(m -> m.getLoggedAt().atZone(ZoneOffset.UTC).toLocalDate().toString(),
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
                .collect(Collectors.toMap(s -> s.getSleepDate().atZone(ZoneOffset.UTC).toLocalDate().toString(), 
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
                        w -> w.getLoggedAt().atZone(ZoneOffset.UTC).toLocalDate().toString(),
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

            // Get the initial weight from the weight logs or use current weight as fallback
            List<WeightLog> allWeightLogs = weightLogRepository.findByUserIdOrderByLogDateAsc(user.getId());
            double initialWeight = allWeightLogs.isEmpty() ? currentWeight : allWeightLogs.get(0).getWeightKg();

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
                    startInstant.atZone(ZoneOffset.UTC).toLocalDate(),
                    endInstant.atZone(ZoneOffset.UTC).toLocalDate());

            // Create a map of log date to weight
            Map<String, Double> weeklyTrend = weightLogs.stream()
                    .filter(w -> w.getLogDate() != null)
                    .collect(Collectors.toMap(
                            w -> w.getLogDate().toString(),
                            w -> w.getWeightKg() != null ? w.getWeightKg() : 0.0,
                            (oldValue, newValue) -> newValue));
            progress.setWeeklyProgressTrend(weeklyTrend);
        } else if ("WORKOUT_FREQUENCY".equalsIgnoreCase(normalizedGoal) || "FITNESS".equalsIgnoreCase(normalizedGoal)) {
            // Existing workout frequency logic remains the same
            List<Workout> workouts = workoutRepository.findByUserIdAndPerformedAtBetween(user.getId(), startInstant,
                    endInstant);
            // Assume goal is custom configured or 4 workouts per week
            long days = ChronoUnit.DAYS.between(startInstant.atZone(ZoneOffset.UTC).toLocalDate(), endInstant.atZone(ZoneOffset.UTC).toLocalDate()) + 1;
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
                    .collect(Collectors.groupingBy(w -> w.getPerformedAt().atZone(ZoneOffset.UTC).toLocalDate().toString(),
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

        List<Workout> workouts = workoutRepository.findByUserIdAndPerformedAtBetween(userId, 
                startDate.atStartOfDay(ZoneOffset.UTC).toInstant(),
                endDate.atTime(LocalTime.MAX).atZone(ZoneOffset.UTC).toInstant());

        Map<LocalDate, Integer> workoutCounts = workouts.stream()
                .collect(Collectors.groupingBy(w -> w.getPerformedAt().atZone(ZoneOffset.UTC).toLocalDate(), Collectors.summingInt(w -> 1)));

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
