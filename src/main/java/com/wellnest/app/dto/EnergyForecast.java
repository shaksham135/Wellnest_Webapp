package com.wellnest.app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnergyForecast {
    private int currentEnergy; // 0-100
    private String status;      // PEAK, FLOW, STABLE, RECOVERY, DIP
    private String message;     // Current contextual insight
    private List<HourForecast> forecast; // Next 6 hours
    private int cognitiveReserve; // Legacy 0-100 Cognitive Readiness
    private int dailyReadiness; // New 0-100 Daily Readiness
    private String dataQuality; // HIGH, MEDIUM, LOW
    private Map<String, Boolean> factors; // Active factors for today

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HourForecast {
        private String time;      // e.g. "14:00"
        private int energyValue;  // 0-100
    }
}
