package com.wellnest.app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LogResponse<T> {
    private T data;
    private int resonanceScore;
    private String neuralInsight;
    private String resonanceCategory; // Peak, Optimal, Neutral, Low
}
