package com.wellnest.app.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Setter
@Getter
public class SleepLogDto {
    private Long userId;

    @NotNull(message = "Hours slept is required")
    @Min(value = 1, message = "Sleep hours must be at least 1 hour")
    private Double hours;

    private java.time.Instant sleepDate; // defaults to today
    private String quality; // optional: good, average, poor
    private String notes;

}
