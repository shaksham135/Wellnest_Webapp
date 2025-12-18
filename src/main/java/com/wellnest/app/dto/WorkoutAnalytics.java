package com.wellnest.app.dto;

import lombok.Data;
import java.util.Map;

@Data
public class WorkoutAnalytics {
    private int totalWorkouts;
    private double totalDuration; // in minutes
    private double avgDuration;   // in minutes
    private Map<String, Integer> workoutsByType; // e.g., {"Cardio": 5, "Strength": 3}
    private Map<String, Double> weeklyTrend; // e.g., {"2023-01-01": 30.5, "2023-01-02": 45.0}
}
