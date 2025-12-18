package com.wellnest.app.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.Map;

@Data
public class WorkoutConsistency {
    private LocalDate startDate;
    private LocalDate endDate;
    private Map<LocalDate, Integer> workoutCounts;
}
