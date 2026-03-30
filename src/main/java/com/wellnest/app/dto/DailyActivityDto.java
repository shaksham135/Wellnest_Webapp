package com.wellnest.app.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class DailyActivityDto {
    private Long id;
    private LocalDate date;
    private Integer steps;
    private Integer activeCalories;
    private Double distanceKm;
    private Boolean isSync;
}
