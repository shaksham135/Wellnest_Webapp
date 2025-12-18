package com.wellnest.app.dto;

import lombok.Data;

@Data
public class HealthMetrics {
    private double bmi;
    private String bmiCategory; // e.g., "Underweight", "Healthy Weight", "Overweight"
}
