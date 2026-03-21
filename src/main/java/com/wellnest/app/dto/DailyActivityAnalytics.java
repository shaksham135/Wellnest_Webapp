package com.wellnest.app.dto;

import lombok.Data;
import java.util.Map;

@Data
public class DailyActivityAnalytics {
    // Top-level averages
    private double avgDailySteps;
    private double avgDailyCalories;
    private double avgDailyDistance;

    // Targets (populated from User or defaults)
    private int targetSteps;
    private double targetCalories;
    private double targetDistance;

    // Days met target
    private int daysMetStepsGoal;
    private int daysMetCaloriesGoal;
    private int daysMetDistanceGoal;

    // Weekly Trends over the past X days (mapped by date String)
    private Map<String, Integer> weeklyStepsTrend;
    private Map<String, Double> weeklyCaloriesTrend;
    private Map<String, Double> weeklyDistanceTrend;
}
