package com.wellnest.app.dto;

import lombok.Data;

@Data
public class GoalProgress {
    private String goalType; // "WEIGHT_LOSS", "MUSCLE_GAIN", "ENDURANCE", etc.
    private double currentValue;
    private double targetValue;
    private String unit; // "kg", "days", etc.
    private int percentageComplete;
    private String status; // "On Track", "Needs Improvement", "At Risk"
    private String recommendation; // Customized recommendation
    private java.util.Map<String, Double> weeklyProgressTrend;
}
