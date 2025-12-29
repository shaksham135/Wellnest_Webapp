package com.wellnest.app.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class StepsAnalytics {
    private long totalSteps;
    private double avgDailySteps;
    private double totalDistance; // in kilometers
    private double avgDailyDistance; // in kilometers
    private int totalCaloriesBurned;
    private double avgDailyCalories;
    private Map<String, Long> weeklySteps; // date -> steps
    private Map<String, Double> weeklyDistance; // date -> distance in km
    private Map<String, Integer> weeklyCalories; // date -> calories
    private String activityLevel; // Sedentary, Low Active, Somewhat Active, Active, Highly Active
    private int dailyGoal; // daily step goal
    private double goalAchievementRate; // percentage of days goal was met
    private List<String> insights; // weekly insights
}