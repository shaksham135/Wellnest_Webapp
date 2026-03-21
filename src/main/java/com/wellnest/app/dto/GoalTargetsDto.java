package com.wellnest.app.dto;

import lombok.Data;

@Data
public class GoalTargetsDto {
    private Integer targetSteps;
    private Double targetWaterLiters;
    private Double targetSleepHours;
    private Integer targetWorkoutsPerWeek;
    private Double targetActiveCalories;
    private Double targetDistanceKm;
}
