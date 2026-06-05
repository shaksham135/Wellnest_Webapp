package com.wellnest.app.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class DailyActivityDto {
    private Long id;
    @jakarta.validation.constraints.NotNull(message = "Date is required")
    private LocalDate date;

    @jakarta.validation.constraints.Min(value = 0, message = "Steps cannot be negative")
    private Integer steps;

    @jakarta.validation.constraints.Min(value = 0, message = "Calories cannot be negative")
    private Integer activeCalories;

    @jakarta.validation.constraints.Min(value = 0, message = "Distance cannot be negative")
    private Double distanceKm;

    private Boolean isSync;
}
