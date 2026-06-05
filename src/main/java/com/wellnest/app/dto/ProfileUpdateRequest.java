package com.wellnest.app.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class ProfileUpdateRequest {

    @NotNull(message = "Age is required")
    @Min(value = 5, message = "Age must be at least 5")
    @Max(value = 120, message = "Age must be at most 120")
    private Integer age;

    @NotNull(message = "Height is required")
    @DecimalMin(value = "50.0", message = "Height must be at least 50 cm")
    @DecimalMax(value = "250.0", message = "Height must be at most 250 cm")
    private Double heightCm;

    @NotNull(message = "Weight is required")
    @DecimalMin(value = "20.0", message = "Weight must be at least 20 kg")
    @DecimalMax(value = "350.0", message = "Weight must be at most 350 kg")
    private Double weightKg;

    @NotBlank(message = "Gender is required")
    @Pattern(regexp = "^(?i)(MALE|FEMALE|OTHER)$", message = "Gender must be MALE, FEMALE, or OTHER")
    private String gender;

    @NotBlank(message = "Fitness goal is required")
    @Pattern(regexp = "^(?i)(WEIGHT_LOSS|MUSCLE_GAIN|FITNESS|MAINTAIN|WORKOUT_FREQUENCY)$", message = "Invalid fitness goal")
    private String fitnessGoal;

    @Pattern(regexp = "^$|^\\+?[0-9\\s-]{10,15}$", message = "Invalid phone number format")
    private String phone;

    public ProfileUpdateRequest() {
    }

}
