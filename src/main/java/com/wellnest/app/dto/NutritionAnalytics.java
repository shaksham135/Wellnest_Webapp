package com.wellnest.app.dto;

import lombok.Data;
import java.util.Map;

@Data
public class NutritionAnalytics {
    private double avgDailyCalories;
    private double avgDailyProtein;
    private double avgDailyCarbs;
    private double avgDailyFat;
    private Map<String, Double> weeklyCalorieTrend;
    private Map<String, Double> macronutrientDistribution; // {"protein": 30.0, "carbs": 40.0, "fat": 30.0}
}
