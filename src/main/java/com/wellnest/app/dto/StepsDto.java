package com.wellnest.app.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StepsDto {
    private Long id;
    private Integer count;
    private Double distance;
    private Integer caloriesBurned;
    private String notes;
    private LocalDateTime createdAt;
}