package com.wellnest.app.dto;

import lombok.Data;
import java.util.Map;

@Data
public class WaterIntakeAnalytics {
    private double avgDailyIntake; // in ml
    private double targetDailyIntake; // in ml
    private Map<String, Double> weeklyIntakeTrend;
    private int daysMetGoal; // number of days met water intake goal
}
