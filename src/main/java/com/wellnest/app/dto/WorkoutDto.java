package com.wellnest.app.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Setter
@Getter
public class WorkoutDto {

    private Long userId;

    @NotBlank(message = "Workout type is required")
    private String type;

    @NotNull(message = "Duration is required")
    @jakarta.validation.constraints.Min(value = 1, message = "Duration must be at least 1 minute")
    private Integer durationMinutes;

    @NotNull(message = "Calories burned is required")
    @jakarta.validation.constraints.Min(value = 0, message = "Calories burned cannot be negative")
    private Integer caloriesBurned;
    
    private Instant performedAt; // Defaults to now
    private String notes;

}
