package com.wellnest.app.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wellnest.app.model.*;
import com.wellnest.app.repository.*;
import com.wellnest.app.service.GroqService;
import com.wellnest.app.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Objects;
import java.time.*;
import java.util.*;
import java.util.concurrent.Callable;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/report")
@CrossOrigin
public class HealthReportController {

    @Autowired private GroqService groqService;
    @Autowired private UserService userService;
    @Autowired private WorkoutRepository workoutRepository;
    @Autowired private MealRepository mealRepository;
    @Autowired private WaterIntakeRepository waterIntakeRepository;
    @Autowired private SleepLogRepository sleepLogRepository;
    @Autowired private DailyActivityRepository dailyActivityRepository;
    @Autowired private WeightLogRepository weightLogRepository;
    @Autowired private WeeklyReportRepository weeklyReportRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping("/weekly")
    public ResponseEntity<?> getWeeklyReport() {
        try {
            // --- Auth ---
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            String email = auth.getName();
            Optional<User> userOpt = userService.findByEmail(email);
            if (userOpt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "User not found"));

            User user = userOpt.get();
            Long userId = user.getId();

            // Calculate current calendar week Monday as cache key
            LocalDate today = LocalDate.now();
            LocalDate currentMonday = today.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));

            Optional<WeeklyReport> cached = weeklyReportRepository.findByUserIdAndWeekStart(userId, currentMonday);
            if (cached.isPresent()) {
                Map<String, Object> data = objectMapper.readValue(cached.get().getJsonContent(), Map.class);
                data.put("lastRefreshedAt", cached.get().getLastRefreshedAt().equals(Instant.EPOCH) ? "NEVER" : cached.get().getLastRefreshedAt().toString());
                return ResponseEntity.ok(data);
            }

            // Generate first load (Sets lastRefreshedAt to EPOCH so they have 1 refresh credit this week)
            Map<String, Object> reportData = generateReportData(user);
            String jsonStr = objectMapper.writeValueAsString(reportData);
            WeeklyReport cacheEntry = new WeeklyReport(userId, jsonStr, currentMonday, Instant.EPOCH);
            weeklyReportRepository.save(cacheEntry);
            
            reportData.put("lastRefreshedAt", "NEVER");
            return ResponseEntity.ok(reportData);

        } catch (Exception ex) {
            return ResponseEntity.status(500).body(Map.of("error", "Report generation failed: " + ex.getMessage()));
        }
    }

    @PostMapping("/weekly/refresh")
    public ResponseEntity<?> refreshWeeklyReport() {
        try {
            // --- Auth ---
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            String email = auth.getName();
            Optional<User> userOpt = userService.findByEmail(email);
            if (userOpt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "User not found"));

            User user = userOpt.get();
            if (!user.isPremium()) {
                return ResponseEntity.status(403).body(Map.of("error", "Manual refresh is a premium-only feature."));
            }

            Long userId = user.getId();
            LocalDate today = LocalDate.now();
            LocalDate currentMonday = today.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));

            Optional<WeeklyReport> cached = weeklyReportRepository.findByUserIdAndWeekStart(userId, currentMonday);
            if (cached.isPresent()) {
                WeeklyReport entry = cached.get();
                Instant mondayInstant = currentMonday.atStartOfDay(ZoneId.systemDefault()).toInstant();

                // Cooldown check: Has user already refreshed this week?
                if (entry.getLastRefreshedAt().isAfter(mondayInstant)) {
                    return ResponseEntity.status(429).body(Map.of(
                        "error", "Cooldown Active",
                        "message", "You've already refreshed your report this week! You can refresh again next Monday. 🛡️"
                    ));
                }

                // If not, proceed to refresh report from scratch
                Map<String, Object> reportData = generateReportData(user);
                String jsonStr = objectMapper.writeValueAsString(reportData);
                entry.setJsonContent(jsonStr);
                entry.setLastRefreshedAt(Instant.now());
                weeklyReportRepository.save(entry);

                reportData.put("lastRefreshedAt", entry.getLastRefreshedAt().toString());
                return ResponseEntity.ok(reportData);
            } else {
                // Generate and save with active refresh count (Instant.now())
                Map<String, Object> reportData = generateReportData(user);
                String jsonStr = objectMapper.writeValueAsString(reportData);
                WeeklyReport entry = new WeeklyReport(userId, jsonStr, currentMonday, Instant.now());
                weeklyReportRepository.save(entry);

                reportData.put("lastRefreshedAt", entry.getLastRefreshedAt().toString());
                return ResponseEntity.ok(reportData);
            }

        } catch (Exception ex) {
            return ResponseEntity.status(500).body(Map.of("error", "Report refresh failed: " + ex.getMessage()));
        }
    }

    private Map<String, Object> generateReportData(User user) throws Exception {
        Long userId = user.getId();

        // Time windows
        Instant now = Instant.now();
        Instant weekStart = now.minus(7, java.time.temporal.ChronoUnit.DAYS);
        Instant prevWeekStart = now.minus(14, java.time.temporal.ChronoUnit.DAYS);
        LocalDate today = LocalDate.now();
        LocalDate weekStartDate = today.minusDays(7);
        LocalDate prevWeekStartDate = today.minusDays(14);

        // ── THIS WEEK DATA ─────────────────────────────────────────────
        List<Workout>       workouts = safeGet(() -> workoutRepository.findByUserIdAndPerformedAtBetween(userId, weekStart, now));
        List<Meal>          meals    = safeGet(() -> mealRepository.findByUserIdAndLoggedAtBetween(userId, weekStart, now));
        List<WaterIntake>   water    = safeGet(() -> waterIntakeRepository.findByUserIdAndLoggedAtBetween(userId, weekStart, now));
        List<SleepLog>      sleep    = safeGet(() -> sleepLogRepository.findByUserIdAndSleepDateBetween(userId, weekStart, now));
        List<DailyActivity> activity = safeGet(() -> dailyActivityRepository.findByUserIdAndDateBetweenOrderByDateAsc(userId, weekStartDate, today));
        List<WeightLog>     weights  = safeGet(() -> weightLogRepository.findByUserIdAndLogDateBetween(userId, weekStartDate, today));

        // ── PREVIOUS WEEK DATA (for comparison) ────────────────────────
        List<Workout>       prevWorkouts = safeGet(() -> workoutRepository.findByUserIdAndPerformedAtBetween(userId, prevWeekStart, weekStart));
        List<Meal>          prevMeals    = safeGet(() -> mealRepository.findByUserIdAndLoggedAtBetween(userId, prevWeekStart, weekStart));
        List<WaterIntake>   prevWater    = safeGet(() -> waterIntakeRepository.findByUserIdAndLoggedAtBetween(userId, prevWeekStart, weekStart));
        List<DailyActivity> prevActivity = safeGet(() -> dailyActivityRepository.findByUserIdAndDateBetweenOrderByDateAsc(userId, prevWeekStartDate, weekStartDate));

        // ── COMPUTE THIS WEEK STATS ────────────────────────────────────
        int totalWorkouts       = workouts.size();
        int totalDurationMins   = workouts.stream().mapToInt(w -> w.getDurationMinutes() != null ? w.getDurationMinutes() : 0).sum();
        int totalCaloriesBurned = workouts.stream().mapToInt(w -> w.getCaloriesBurned() != null ? w.getCaloriesBurned() : 0).sum();

        double avgWaterLiters = water.isEmpty() ? 0.0 : water.stream().mapToDouble(w -> w.getLiters() != null ? w.getLiters() : 0.0).average().orElse(0.0);
        double totalWaterLiters = water.stream().mapToDouble(w -> w.getLiters() != null ? w.getLiters() : 0.0).sum();

        double avgSleepHours = sleep.isEmpty() ? 0.0 : sleep.stream().mapToDouble(s -> s.getHours() != null ? s.getHours() : 0.0).average().orElse(0.0);
        double bestSleepHours = sleep.stream().mapToDouble(s -> s.getHours() != null ? s.getHours() : 0.0).max().orElse(0.0);
        double worstSleepHours = sleep.isEmpty() ? 0.0 : sleep.stream().mapToDouble(s -> s.getHours() != null ? s.getHours() : 0.0).min().orElse(0.0);

        int totalSteps       = activity.stream().mapToInt(a -> a.getSteps() != null ? a.getSteps() : 0).sum();
        int totalActiveCalories = activity.stream().mapToInt(a -> a.getActiveCalories() != null ? a.getActiveCalories() : 0).sum();
        double totalDistanceKm = activity.stream().mapToDouble(a -> a.getDistanceKm() != null ? a.getDistanceKm() : 0.0).sum();
        int bestDaySteps = activity.stream().mapToInt(a -> a.getSteps() != null ? a.getSteps() : 0).max().orElse(0);

        int avgDailyCalories = meals.isEmpty() ? 0 : (int) meals.stream().mapToInt(m -> m.getCalories() != null ? m.getCalories() : 0).average().orElse(0);
        int totalCaloriesConsumed = meals.stream().mapToInt(m -> m.getCalories() != null ? m.getCalories() : 0).sum();
        int avgProtein = meals.isEmpty() ? 0 : (int) meals.stream().mapToDouble(m -> m.getProtein() != null ? m.getProtein() : 0).average().orElse(0);
        int avgCarbs   = meals.isEmpty() ? 0 : (int) meals.stream().mapToDouble(m -> m.getCarbs() != null ? m.getCarbs() : 0).average().orElse(0);
        int avgFats    = meals.isEmpty() ? 0 : (int) meals.stream().mapToDouble(m -> m.getFats() != null ? m.getFats() : 0).average().orElse(0);

        // ── PREV WEEK STATS ─────────────────────────────────────────────
        int prevWorkoutCount    = prevWorkouts.size();
        int prevCalsBurned      = prevWorkouts.stream().mapToInt(w -> w.getDurationMinutes() != null ? w.getCaloriesBurned() : 0).sum();
        double prevAvgWater     = prevWater.isEmpty() ? 0.0 : prevWater.stream().mapToDouble(w -> w.getLiters() != null ? w.getLiters() : 0.0).average().orElse(0.0);
        int prevTotalSteps      = prevActivity.stream().mapToInt(a -> a.getSteps() != null ? a.getSteps() : 0).sum();
        int prevAvgCalories     = prevMeals.isEmpty() ? 0 : (int) prevMeals.stream().mapToInt(m -> m.getCalories() != null ? m.getCalories() : 0).average().orElse(0);

        // ── WORKOUT BREAKDOWN ───────────────────────────────────────────
        Map<String, Long>   workoutTypeCounts = workouts.stream()
                .filter(w -> w.getType() != null)
                .collect(Collectors.groupingBy(Workout::getType, Collectors.counting()));
        List<Map<String, Object>> workoutTypes = workoutTypeCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("type", e.getKey());
                    m.put("count", e.getValue());
                    m.put("calories", workouts.stream()
                            .filter(w -> e.getKey().equals(w.getType()))
                            .mapToInt(w -> w.getCaloriesBurned() != null ? w.getCaloriesBurned() : 0).sum());
                    return m;
                })
                .collect(Collectors.toList());

        // ── DAILY BREAKDOWN ─────────────────────────────────────────────
        List<Map<String, Object>> dailyData = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            Instant dayStart = day.atStartOfDay(ZoneOffset.UTC).toInstant();
            Instant dayEnd   = day.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

            int dayCals = workouts.stream()
                    .filter(w -> !w.getPerformedAt().isBefore(dayStart) && w.getPerformedAt().isBefore(dayEnd))
                    .mapToInt(w -> w.getCaloriesBurned() != null ? w.getCaloriesBurned() : 0).sum();
            int dayWorkouts = (int) workouts.stream()
                    .filter(w -> !w.getPerformedAt().isBefore(dayStart) && w.getPerformedAt().isBefore(dayEnd)).count();
            int daySteps = activity.stream()
                    .filter(a -> day.equals(a.getDate()))
                    .mapToInt(a -> a.getSteps() != null ? a.getSteps() : 0).sum();
            double dayWater = water.stream()
                    .filter(w -> !w.getLoggedAt().isBefore(dayStart) && w.getLoggedAt().isBefore(dayEnd))
                    .mapToDouble(w -> w.getLiters() != null ? w.getLiters() : 0.0).sum();
            double daySleep = sleep.stream()
                    .filter(s -> !s.getSleepDate().isBefore(dayStart) && s.getSleepDate().isBefore(dayEnd))
                    .mapToDouble(s -> s.getHours() != null ? s.getHours() : 0.0).sum();

            Map<String, Object> dayMap = new LinkedHashMap<>();
            dayMap.put("date",     day.toString());
            dayMap.put("dayName",  day.getDayOfWeek().getDisplayName(java.time.format.TextStyle.SHORT, java.util.Locale.ENGLISH));
            dayMap.put("workouts", dayWorkouts);
            dayMap.put("caloriesBurned", dayCals);
            dayMap.put("steps",    daySteps);
            dayMap.put("waterL",   Math.round(dayWater * 10.0) / 10.0);
            dayMap.put("sleepH",   Math.round(daySleep * 10.0) / 10.0);
            dailyData.add(dayMap);
        }

        // ── WEIGHT TREND ────────────────────────────────────────────────
        List<Map<String, Object>> weightTrend = weights.stream()
                .sorted(Comparator.comparing(WeightLog::getLogDate))
                .map(w -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("date", w.getLogDate().toString());
                    m.put("weight", w.getWeightKg());
                    return m;
                })
                .collect(Collectors.toList());

        // ── STREAK CALCULATION ──────────────────────────────────────────
        int workoutStreak = 0;
        for (int i = 0; i < 7; i++) {
            LocalDate day = today.minusDays(i);
            Instant s = day.atStartOfDay(ZoneOffset.UTC).toInstant();
            Instant e = day.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
            boolean hadWorkout = workouts.stream().anyMatch(w -> !w.getPerformedAt().isBefore(s) && w.getPerformedAt().isBefore(e));
            if (hadWorkout) workoutStreak++;
            else break;
        }

        // ── HEALTH SCORE ────────────────────────────────────────────────
        int fitnessScore   = totalWorkouts == 0 ? 50 : Math.min(100, totalWorkouts * 25);
        int hydrationScore = water.isEmpty() ? 50 : (int) Math.min(100.0, (avgWaterLiters / 2.5) * 100);
        int sleepScore     = sleep.isEmpty() ? 50 : (int) Math.min(100.0, (avgSleepHours / 8.0) * 100);
        int nutritionScore = meals.isEmpty() ? 50 : Math.max(0, Math.min(100, (int)(100.0 - Math.abs(2000.0 - avgDailyCalories) / 15.0)));
        int activityScore  = totalSteps == 0 ? 50 : Math.min(100, (int)((double) totalSteps / 50000.0 * 100));
        int healthScore    = (int)((fitnessScore * 0.30) + (sleepScore * 0.25) + (hydrationScore * 0.20) + (nutritionScore * 0.15) + (activityScore * 0.10));

        // ── COMPARISON DELTA ────────────────────────────────────────────
        Map<String, Object> vsLastWeek = new LinkedHashMap<>();
        vsLastWeek.put("workoutsDelta",  totalWorkouts - prevWorkoutCount);
        vsLastWeek.put("caloriesBurnedDelta", totalCaloriesBurned - prevCalsBurned);
        vsLastWeek.put("waterDelta",     Math.round((avgWaterLiters - prevAvgWater) * 10.0) / 10.0);
        vsLastWeek.put("stepsDelta",     totalSteps - prevTotalSteps);
        vsLastWeek.put("caloriesEatenDelta", avgDailyCalories - prevAvgCalories);

        // ── SCORE BREAKDOWN ─────────────────────────────────────────────
        Map<String, Integer> breakdown = new LinkedHashMap<>();
        breakdown.put("fitness",   fitnessScore);
        breakdown.put("hydration", hydrationScore);
        breakdown.put("sleep",     sleepScore);
        breakdown.put("nutrition", nutritionScore);
        breakdown.put("activity",  activityScore);

        // ── DAILY CALORIES SPARKLINE ─────────────────────────────────────
        List<Map<String, Object>> dailyCaloriesBurned = dailyData.stream().map(d -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("date",    d.get("date"));
            m.put("calories", d.get("caloriesBurned"));
            return m;
        }).collect(Collectors.toList());

        // ── ASSEMBLE STATS ───────────────────────────────────────────────
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalWorkouts",            totalWorkouts);
        stats.put("totalDurationMins",         totalDurationMins);
        stats.put("totalCaloriesBurned",       totalCaloriesBurned);
        stats.put("avgWaterLiters",            Math.round(avgWaterLiters * 10.0) / 10.0);
        stats.put("totalWaterLiters",          Math.round(totalWaterLiters * 10.0) / 10.0);
        stats.put("avgSleepHours",             Math.round(avgSleepHours * 10.0) / 10.0);
        stats.put("bestSleepHours",            Math.round(bestSleepHours * 10.0) / 10.0);
        stats.put("worstSleepHours",           Math.round(worstSleepHours * 10.0) / 10.0);
        stats.put("totalSteps",                totalSteps);
        stats.put("bestDaySteps",              bestDaySteps);
        stats.put("totalActiveCalories",       totalActiveCalories);
        stats.put("totalDistanceKm",           Math.round(totalDistanceKm * 10.0) / 10.0);
        stats.put("avgDailyCaloriesConsumed",  avgDailyCalories);
        stats.put("totalCaloriesConsumed",     totalCaloriesConsumed);
        stats.put("avgProtein",                avgProtein);
        stats.put("avgCarbs",                  avgCarbs);
        stats.put("avgFats",                   avgFats);
        stats.put("workoutStreak",             workoutStreak);
        stats.put("healthScore",              healthScore);
        stats.put("scoreBreakdown",           breakdown);
        stats.put("dailyCaloriesBurned",      dailyCaloriesBurned);
        stats.put("dailyBreakdown",           dailyData);
        stats.put("workoutTypes",             workoutTypes);
        stats.put("weightTrend",              weightTrend);
        stats.put("vsLastWeek",               vsLastWeek);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("stats",     stats);
        response.put("weekStart", weekStart.toString());
        response.put("weekEnd",   now.toString());

        // ── FREE USER: stats only ─────────────────────────────────────
        if (!user.isPremium()) {
            response.put("isPremium", false);
            return response;
        }

        // ── PREMIUM: Groq AI insights ──────────────────────────────────
        String firstName = user.getName() != null ? user.getName().split(" ")[0] : "User";
        String goal      = user.getFitnessGoal() != null ? user.getFitnessGoal() : "general health";
        String wTypes    = workouts.stream().map(Workout::getType).filter(Objects::nonNull).distinct().collect(Collectors.joining(", "));
        String topType   = workoutTypeCounts.entrySet().stream().max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse("none");

        String prompt =
            "### SYSTEM: You are Wellnest AI Clinical Analyst. Return ONLY a valid JSON object. No preamble, no markdown formatting (unless specifically in 'body').\n\n" +
            "### USER: Generate a detailed weekly health report for " + firstName + ".\n" +
            "Goal: " + goal + " | Age: " + (user.getAge() != null ? user.getAge() : "N/A") +
            " | Gender: " + (user.getGender() != null ? user.getGender() : "N/A") + "\n\n" +
            "WEEKLY DATA (LAST 7 DAYS):\n" +
            "- Workouts: " + totalWorkouts + " sessions, " + totalDurationMins + " mins total (" + (wTypes.isEmpty() ? "none" : wTypes) + ")\n" +
            "- Most frequent workout: " + topType + "\n" +
            "- Calories Burned (Total): " + totalCaloriesBurned + " kcal\n" +
            "- Active Calories (Daily Avg): " + totalActiveCalories + "\n" +
            "- Distance: " + String.format("%.1f", totalDistanceKm) + " km\n" +
            "- Avg Water: " + String.format("%.1f", avgWaterLiters) + "L/day (goal 2.5L) | Total: " + String.format("%.1f", totalWaterLiters) + "L\n" +
            "- Avg Sleep: " + String.format("%.1f", avgSleepHours) + "h (goal 8h) | Best: " + String.format("%.1f", bestSleepHours) + "h | Worst: " + String.format("%.1f", worstSleepHours) + "h\n" +
            "- Total Steps: " + totalSteps + " (goal 50,000) | Best Day: " + bestDaySteps + " steps\n" +
            "- Avg Calories Consumed: " + avgDailyCalories + " kcal/day | Protein: " + avgProtein + "g | Carbs: " + avgCarbs + "g | Fats: " + avgFats + "g\n" +
            "- Workout Streak: " + workoutStreak + " consecutive days\n" +
            "- Health Score: " + healthScore + "/100 (Fitness:" + fitnessScore + " Sleep:" + sleepScore + " Hydration:" + hydrationScore + " Nutrition:" + nutritionScore + " Activity:" + activityScore + ")\n" +
            "- Trend vs Prev Week: Workouts " + (totalWorkouts - prevWorkoutCount >= 0 ? "+" : "") + (totalWorkouts - prevWorkoutCount) +
            ", Steps " + (totalSteps - prevTotalSteps >= 0 ? "+" : "") + (totalSteps - prevTotalSteps) + "\n\n" +
            "### REQUIRED JSON FORMAT:\n" +
            "{\n" +
            "  \"insights\": [\n" +
            "    {\"emoji\":\"💪\",\"category\":\"Fitness\",\"title\":\"headline\",\"body\":\"2 sentence clinical insight\"},\n" +
            "    {\"emoji\":\"💧\",\"category\":\"Hydration\",\"title\":\"headline\",\"body\":\"2 sentence clinical insight\"},\n" +
            "    {\"emoji\":\"😴\",\"category\":\"Sleep\",\"title\":\"headline\",\"body\":\"2 sentence clinical insight\"},\n" +
            "    {\"emoji\":\"🍽️\",\"category\":\"Nutrition\",\"title\":\"headline\",\"body\":\"2 sentence clinical insight\"},\n" +
            "    {\"emoji\":\"👟\",\"category\":\"Activity\",\"title\":\"headline\",\"body\":\"2 sentence clinical insight\"},\n" +
            "    {\"emoji\":\"🔥\",\"category\":\"Progress\",\"title\":\"headline\",\"body\":\"2 sentence clinical insight\"}\n" +
            "  ],\n" +
            "  \"actionPlan\": [\n" +
            "    {\"priority\":\"High\",\"goal\":\"specific goal 1\",\"why\":\"brief reason\"},\n" +
            "    {\"priority\":\"High\",\"goal\":\"specific goal 2\",\"why\":\"brief reason\"},\n" +
            "    {\"priority\":\"Medium\",\"goal\":\"specific goal 3\",\"why\":\"brief reason\"},\n" +
            "    {\"priority\":\"Medium\",\"goal\":\"specific goal 4\",\"why\":\"brief reason\"},\n" +
            "    {\"priority\":\"Low\",\"goal\":\"specific goal 5\",\"why\":\"brief reason\"}\n" +
            "  ],\n" +
            "  \"doctorSummary\": \"3-4 sentence clinical summary for a medical professional, mentioning specific numbers and trends.\",\n" +
            "  \"weekHighlight\": \"One key achievement of the week.\",\n" +
            "  \"riskFlags\": []\n" +
            "}";

        String raw = groqService.getResponse(prompt, "llama-3.1-8b-instant", 800);
        
        String cleaned = raw.trim();
        if (cleaned.contains("```")) {
            cleaned = cleaned.replaceAll("(?s).*?```(?:json)?\\s*(\\{.*\\})\\s*```.*", "$1").trim();
        }
        if (!cleaned.startsWith("{")) {
            int start = cleaned.indexOf('{');
            int end = cleaned.lastIndexOf('}');
            if (start != -1 && end != -1 && end > start) {
                cleaned = cleaned.substring(start, end + 1);
            }
        }

        JsonNode ai = objectMapper.readTree(cleaned);
        response.put("isPremium",       true);
        response.put("insights",        objectMapper.convertValue(ai.get("insights"),    List.class));
        response.put("actionPlan",      objectMapper.convertValue(ai.get("actionPlan"),  List.class));
        response.put("doctorSummary",   ai.get("doctorSummary")   != null ? ai.get("doctorSummary").asText()   : "");
        response.put("weekHighlight",   ai.get("weekHighlight")   != null ? ai.get("weekHighlight").asText()   : "");
        response.put("riskFlags",       ai.get("riskFlags")       != null ? objectMapper.convertValue(ai.get("riskFlags"), List.class) : Collections.emptyList());

        return response;
    }

    private <T> List<T> safeGet(Callable<List<T>> supplier) {
        try { return supplier.call(); } catch (Exception e) { return Collections.emptyList(); }
    }
}
