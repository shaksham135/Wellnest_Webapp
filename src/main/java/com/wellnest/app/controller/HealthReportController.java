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

import java.time.*;
import java.util.*;
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
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }

            User user = userOpt.get();
            Long userId = user.getId();

            // Last 7 days
            Instant now = Instant.now();
            Instant weekStart = now.minus(7, java.time.temporal.ChronoUnit.DAYS);
            LocalDate today = LocalDate.now();
            LocalDate weekStartDate = today.minusDays(7);

            // --- Fetch data using userId (same pattern as TrackerService) ---
            List<Workout> workouts = safeGet(() ->
                    workoutRepository.findByUserIdAndPerformedAtBetween(userId, weekStart, now));

            List<Meal> meals = safeGet(() ->
                    mealRepository.findByUserIdAndLoggedAtBetween(userId, weekStart, now));

            List<WaterIntake> water = safeGet(() ->
                    waterIntakeRepository.findByUserIdAndLoggedAtBetween(userId, weekStart, now));

            // SleepLog uses @ManyToOne User — Spring Data JPA resolves userId as user.id
            List<SleepLog> sleep = safeGet(() ->
                    sleepLogRepository.findByUserIdAndSleepDateBetween(userId, weekStart, now));

            // DailyActivity uses @ManyToOne User — Spring Data JPA resolves userId as user.id
            List<DailyActivity> activity = safeGet(() ->
                    dailyActivityRepository.findByUserIdAndDateBetweenOrderByDateAsc(userId, weekStartDate, today));

            // --- Compute stats ---
            int totalWorkouts = workouts.size();

            int totalCaloriesBurned = workouts.stream()
                    .mapToInt(w -> w.getCaloriesBurned() != null ? w.getCaloriesBurned() : 0).sum();

            double avgWaterLiters = water.isEmpty() ? 0.0
                    : water.stream().mapToDouble(w -> w.getLiters() != null ? w.getLiters() : 0.0)
                           .average().orElse(0.0);

            double avgSleepHours = sleep.isEmpty() ? 0.0
                    : sleep.stream().mapToDouble(s -> s.getHours() != null ? s.getHours() : 0.0)
                           .average().orElse(0.0);

            int totalSteps = activity.stream()
                    .mapToInt(a -> a.getSteps() != null ? a.getSteps() : 0).sum();

            int avgDailyCaloriesConsumed = meals.isEmpty() ? 0
                    : (int) meals.stream()
                                 .mapToInt(m -> m.getCalories() != null ? m.getCalories() : 0)
                                 .average().orElse(0);

            double avgProtein = meals.isEmpty() ? 0
                    : meals.stream().mapToDouble(m -> m.getProtein() != null ? m.getProtein() : 0)
                           .average().orElse(0);

            // --- Health Score (0–100) across 5 dimensions ---
            int fitnessScore   = Math.min(100, totalWorkouts * 20);
            int hydrationScore = (int) Math.min(100.0, (avgWaterLiters / 2.5) * 100);
            int sleepScore     = (int) Math.min(100.0, (avgSleepHours / 8.0) * 100);
            int nutritionScore = avgDailyCaloriesConsumed > 0
                    ? Math.min(100, (int)(100.0 - Math.abs(2000.0 - avgDailyCaloriesConsumed) / 20.0)) : 0;
            int activityScore  = Math.min(100, (int)((double) totalSteps / 70000.0 * 100));
            int healthScore    = (int)((fitnessScore * 0.25) + (hydrationScore * 0.20)
                    + (sleepScore * 0.25) + (nutritionScore * 0.15) + (activityScore * 0.15));

            // --- Score breakdown ---
            Map<String, Integer> breakdown = new LinkedHashMap<>();
            breakdown.put("fitness",   fitnessScore);
            breakdown.put("hydration", hydrationScore);
            breakdown.put("sleep",     sleepScore);
            breakdown.put("nutrition", nutritionScore);
            breakdown.put("activity",  activityScore);

            // --- Daily calories sparkline ---
            List<Map<String, Object>> dailyCalories = new ArrayList<>();
            try {
                dailyCalories = workouts.stream()
                        .collect(Collectors.groupingBy(w ->
                                w.getPerformedAt().atZone(ZoneOffset.UTC).toLocalDate().toString()))
                        .entrySet().stream()
                        .map(e -> {
                            Map<String, Object> m2 = new LinkedHashMap<>();
                            m2.put("date", e.getKey());
                            m2.put("calories", e.getValue().stream()
                                    .mapToInt(w -> w.getCaloriesBurned() != null ? w.getCaloriesBurned() : 0).sum());
                            return m2;
                        })
                        .sorted(Comparator.comparing(m2 -> m2.get("date").toString()))
                        .collect(Collectors.toList());
            } catch (Exception ignored) {}

            // --- Stats payload ---
            Map<String, Object> stats = new LinkedHashMap<>();
            stats.put("totalWorkouts",           totalWorkouts);
            stats.put("totalCaloriesBurned",      totalCaloriesBurned);
            stats.put("avgWaterLiters",           Math.round(avgWaterLiters * 10.0) / 10.0);
            stats.put("avgSleepHours",            Math.round(avgSleepHours * 10.0) / 10.0);
            stats.put("totalSteps",               totalSteps);
            stats.put("avgDailyCaloriesConsumed", avgDailyCaloriesConsumed);
            stats.put("avgProtein",               (int) avgProtein);
            stats.put("healthScore",              healthScore);
            stats.put("scoreBreakdown",           breakdown);
            stats.put("dailyCaloriesBurned",      dailyCalories);

            // --- Free user: return stats only, no AI ---
            if (!user.isPremium()) {
                Map<String, Object> response = new LinkedHashMap<>();
                response.put("stats",     stats);
                response.put("isPremium", false);
                response.put("weekStart", weekStart.toString());
                response.put("weekEnd",   now.toString());
                return ResponseEntity.ok(response);
            }

            // --- Premium: call Groq AI for insights ---
            String firstName = user.getName() != null ? user.getName().split(" ")[0] : "User";
            String goal      = user.getFitnessGoal() != null ? user.getFitnessGoal() : "general health";
            String wTypes    = workouts.stream().map(Workout::getType)
                    .filter(Objects::nonNull).distinct().collect(Collectors.joining(", "));

            String prompt =
                "You are Wellnest AI generating a weekly health report for " + firstName + ".\n" +
                "Goal: " + goal + " | Age: " + (user.getAge() != null ? user.getAge() : "N/A") + "\n\n" +
                "WEEKLY DATA:\n" +
                "- Workouts: " + totalWorkouts + " (" + (wTypes.isEmpty() ? "none" : wTypes) + ")\n" +
                "- Calories Burned: " + totalCaloriesBurned + " kcal\n" +
                "- Avg Water: " + String.format("%.1f", avgWaterLiters) + "L/day (goal 2.5L)\n" +
                "- Avg Sleep: " + String.format("%.1f", avgSleepHours) + "h (goal 8h)\n" +
                "- Steps: " + totalSteps + " (goal 70,000)\n" +
                "- Avg Calories Consumed: " + avgDailyCaloriesConsumed + " kcal/day\n" +
                "- Health Score: " + healthScore + "/100\n\n" +
                "Return ONLY valid JSON (no markdown, no extra text):\n" +
                "{\"insights\":[" +
                "{\"emoji\":\"💪\",\"title\":\"headline\",\"body\":\"1-2 sentence insight\"}," +
                "{\"emoji\":\"💧\",\"title\":\"headline\",\"body\":\"...\"}," +
                "{\"emoji\":\"😴\",\"title\":\"headline\",\"body\":\"...\"}," +
                "{\"emoji\":\"🍽️\",\"title\":\"headline\",\"body\":\"...\"}," +
                "{\"emoji\":\"🎯\",\"title\":\"headline\",\"body\":\"...\"}" +
                "],\"actionPlan\":[\"goal 1\",\"goal 2\",\"goal 3\"]," +
                "\"doctorSummary\":\"2-3 sentence plain-English summary for a doctor.\"}";

            try {
                String raw = groqService.getResponse(prompt);
                // Strip markdown fences if present
                String cleaned = raw.replaceAll("(?s)```(?:json)?\\s*(\\{.*\\})\\s*```", "$1").trim();
                if (!cleaned.startsWith("{")) {
                    int s = cleaned.indexOf('{');
                    int e = cleaned.lastIndexOf('}');
                    if (s != -1 && e != -1) cleaned = cleaned.substring(s, e + 1);
                }
                JsonNode ai = objectMapper.readTree(cleaned);

                Map<String, Object> response = new LinkedHashMap<>();
                response.put("stats",        stats);
                response.put("isPremium",     true);
                response.put("insights",      objectMapper.convertValue(ai.get("insights"),   List.class));
                response.put("actionPlan",    objectMapper.convertValue(ai.get("actionPlan"), List.class));
                response.put("doctorSummary", ai.get("doctorSummary") != null ? ai.get("doctorSummary").asText() : "");
                response.put("weekStart",     weekStart.toString());
                response.put("weekEnd",       now.toString());
                return ResponseEntity.ok(response);

            } catch (Exception aiEx) {
                // AI failed — still return valid premium response with empty AI sections
                Map<String, Object> response = new LinkedHashMap<>();
                response.put("stats",        stats);
                response.put("isPremium",     true);
                response.put("insights",      Collections.emptyList());
                response.put("actionPlan",    Collections.emptyList());
                response.put("doctorSummary", "AI summary temporarily unavailable. Please try again later.");
                response.put("weekStart",     weekStart.toString());
                response.put("weekEnd",       now.toString());
                return ResponseEntity.ok(response);
            }

        } catch (Exception ex) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Report generation failed: " + ex.getMessage()));
        }
    }

    /** Safely execute a repository call, returning empty list on any exception. */
    @SuppressWarnings("unchecked")
    private <T> List<T> safeGet(java.util.concurrent.Callable<List<T>> supplier) {
        try {
            return supplier.call();
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
