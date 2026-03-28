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
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        String email = auth.getName();
        Optional<User> userOpt = userService.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("User not found");
        }

        User user = userOpt.get();
        Long userId = user.getId();

        // Define this week's date range (last 7 days)
        Instant now = Instant.now();
        Instant weekStart = now.minus(7, java.time.temporal.ChronoUnit.DAYS);

        // Fetch raw data
        List<Workout> workouts = workoutRepository.findByUserIdAndPerformedAtBetween(userId, weekStart, now);
        List<Meal> meals = mealRepository.findByUserIdAndLoggedAtBetween(userId, weekStart, now);
        List<WaterIntake> water = waterIntakeRepository.findByUserIdAndLoggedAtBetween(userId, weekStart, now);
        List<SleepLog> sleep = sleepLogRepository.findByUserIdAndSleepDateBetween(userId, weekStart, now);

        LocalDate today = LocalDate.now();
        List<DailyActivity> activity = dailyActivityRepository
                .findByUserIdAndDateBetweenOrderByDateAsc(userId, today.minusDays(7), today);

        // Compute raw stats
        int totalWorkouts = workouts.size();
        int totalCaloriesBurned = workouts.stream().mapToInt(w -> w.getCaloriesBurned() != null ? w.getCaloriesBurned() : 0).sum();
        double avgWaterLiters = water.isEmpty() ? 0.0 :
                water.stream().mapToDouble(w -> w.getLiters() != null ? w.getLiters() : 0.0).average().orElse(0.0);
        double avgSleepHours = sleep.isEmpty() ? 0.0 :
                sleep.stream().mapToDouble(SleepLog::getHours).average().orElse(0.0);
        int totalSteps = activity.stream().mapToInt(a -> a.getSteps() != null ? a.getSteps() : 0).sum();
        int avgDailyCaloriesConsumed = meals.isEmpty() ? 0 :
                (int) meals.stream().mapToInt(m -> m.getCalories() != null ? m.getCalories() : 0).average().orElse(0);
        double avgProtein = meals.isEmpty() ? 0 :
                meals.stream().mapToDouble(m -> m.getProtein() != null ? m.getProtein() : 0).average().orElse(0);

        // Calculate simple Health Score (0-100) based on 5 dimensions
        int fitnessScore   = Math.min(100, totalWorkouts * 20);
        int hydrationScore = (int) Math.min(100, (avgWaterLiters / 2.5) * 100);
        int sleepScore     = (int) Math.min(100, (avgSleepHours / 8.0) * 100);
        int nutritionScore = avgDailyCaloriesConsumed > 0 ? Math.min(100, (int)(100 - Math.abs(2000 - avgDailyCaloriesConsumed) / 20.0)) : 0;
        int activityScore  = Math.min(100, (int)((double) totalSteps / 70000 * 100)); // 70k steps/week goal
        int healthScore    = (int)((fitnessScore * 0.25) + (hydrationScore * 0.2) + (sleepScore * 0.25) + (nutritionScore * 0.15) + (activityScore * 0.15));

        // Build structured stats object
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalWorkouts", totalWorkouts);
        stats.put("totalCaloriesBurned", totalCaloriesBurned);
        stats.put("avgWaterLiters", Math.round(avgWaterLiters * 10.0) / 10.0);
        stats.put("avgSleepHours", Math.round(avgSleepHours * 10.0) / 10.0);
        stats.put("totalSteps", totalSteps);
        stats.put("avgDailyCaloriesConsumed", avgDailyCaloriesConsumed);
        stats.put("avgProtein", (int) avgProtein);
        stats.put("healthScore", healthScore);
        stats.put("scoreBreakdown", Map.of(
                "fitness", fitnessScore,
                "hydration", hydrationScore,
                "sleep", sleepScore,
                "nutrition", nutritionScore,
                "activity", activityScore
        ));

        // Build daily time-series for sparkline charts (per-day calories burned)
        List<Map<String, Object>> dailyWorkouts = workouts.stream()
                .collect(Collectors.groupingBy(w ->
                        w.getPerformedAt().atZone(ZoneOffset.UTC).toLocalDate().toString()))
                .entrySet().stream()
                .map(e -> Map.of("date", (Object) e.getKey(),
                        "calories", e.getValue().stream().mapToInt(w -> w.getCaloriesBurned() != null ? w.getCaloriesBurned() : 0).sum()))
                .sorted(Comparator.comparing(m -> m.get("date").toString()))
                .collect(Collectors.toList());
        stats.put("dailyCaloriesBurned", dailyWorkouts);

        // Free users get stats only — skip AI generation
        if (!user.isPremium()) {
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("stats", stats);
            response.put("isPremium", false);
            response.put("weekStart", weekStart.toString());
            response.put("weekEnd", now.toString());
            return ResponseEntity.ok(response);
        }

        // PREMIUM: Generate AI insights
        String userName = user.getName() != null ? user.getName().split(" ")[0] : "User";
        String fitnessGoal = user.getFitnessGoal() != null ? user.getFitnessGoal() : "general health";
        String workoutTypes = workouts.stream().map(Workout::getType).distinct()
                .collect(Collectors.joining(", "));

        String prompt = "You are Wellnest AI generating a weekly health report for " + userName + ".\n\n" +
                "User Goal: " + fitnessGoal + "\n" +
                "Age: " + (user.getAge() != null ? user.getAge() : "not specified") + "\n\n" +
                "WEEKLY DATA (last 7 days):\n" +
                "- Workouts logged: " + totalWorkouts + " (types: " + (workoutTypes.isEmpty() ? "none" : workoutTypes) + ")\n" +
                "- Total calories burned: " + totalCaloriesBurned + " kcal\n" +
                "- Avg daily water intake: " + String.format("%.1f", avgWaterLiters) + "L (goal: 2.5L)\n" +
                "- Avg sleep hours: " + String.format("%.1f", avgSleepHours) + "h (goal: 8h)\n" +
                "- Total steps this week: " + totalSteps + " (goal: 70,000)\n" +
                "- Avg daily calories consumed: " + avgDailyCaloriesConsumed + " kcal\n" +
                "- Avg protein: " + (int) avgProtein + "g per meal\n" +
                "- Overall Health Score: " + healthScore + "/100\n\n" +
                "Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):\n" +
                "{\n" +
                "  \"insights\": [\n" +
                "    {\"emoji\": \"💪\", \"title\": \"short headline\", \"body\": \"1-2 sentence insight\"},\n" +
                "    {\"emoji\": \"...\", \"title\": \"...\", \"body\": \"...\"},\n" +
                "    {\"emoji\": \"...\", \"title\": \"...\", \"body\": \"...\"},\n" +
                "    {\"emoji\": \"...\", \"title\": \"...\", \"body\": \"...\"},\n" +
                "    {\"emoji\": \"...\", \"title\": \"...\", \"body\": \"...\"}\n" +
                "  ],\n" +
                "  \"actionPlan\": [\n" +
                "    \"specific goal 1 for next week\",\n" +
                "    \"specific goal 2 for next week\",\n" +
                "    \"specific goal 3 for next week\"\n" +
                "  ],\n" +
                "  \"doctorSummary\": \"A 2-3 sentence plain-English health summary suitable for sharing with a doctor or trainer.\"\n" +
                "}";

        try {
            String aiRaw = groqService.getResponse(prompt);
            // Extract JSON from response (handle possible markdown wrapping)
            String cleaned = aiRaw.replaceAll("(?s)```json\\s*(.*)```", "$1").trim();
            if (!cleaned.startsWith("{")) {
                int start = cleaned.indexOf("{");
                int end = cleaned.lastIndexOf("}");
                if (start != -1 && end != -1) cleaned = cleaned.substring(start, end + 1);
            }
            JsonNode aiJson = objectMapper.readTree(cleaned);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("stats", stats);
            response.put("isPremium", true);
            response.put("insights", objectMapper.convertValue(aiJson.get("insights"), List.class));
            response.put("actionPlan", objectMapper.convertValue(aiJson.get("actionPlan"), List.class));
            response.put("doctorSummary", aiJson.get("doctorSummary").asText());
            response.put("weekStart", weekStart.toString());
            response.put("weekEnd", now.toString());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            // Fallback: return stats without AI if Groq fails
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("stats", stats);
            response.put("isPremium", true);
            response.put("insights", List.of());
            response.put("actionPlan", List.of());
            response.put("doctorSummary", "AI summary unavailable at this time.");
            response.put("weekStart", weekStart.toString());
            response.put("weekEnd", now.toString());
            return ResponseEntity.ok(response);
        }
    }
}
