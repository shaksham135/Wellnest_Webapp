package com.wellnest.app.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class AnalyticsSummary {
    private LocalDate startDate;
    private LocalDate endDate;
    private WorkoutAnalytics workoutAnalytics;
    private NutritionAnalytics nutritionAnalytics;
    private SleepAnalytics sleepAnalytics;
    private WaterIntakeAnalytics waterIntakeAnalytics;
    private GoalProgress goalProgress;
    private HealthMetrics healthMetrics;
    private WorkoutConsistency workoutConsistency;
    private DailyActivityAnalytics dailyActivityAnalytics;
    
    // SaaS Premium Features
    private java.util.List<String> premiumInsights;
    private java.util.Map<String, Object> neuralMetrics;
}
