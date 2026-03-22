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
    private Integer durationMinutes;

    private Integer caloriesBurned;
    
    private Instant performedAt; // Defaults to now
    private String notes;

}
