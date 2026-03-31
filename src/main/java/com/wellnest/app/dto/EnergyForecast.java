package com.wellnest.app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnergyForecast {
    private int currentEnergy; // 0-100
    private String status;      // PEAK, FLOW, STABLE, RECOVERY, DIP
    private String message;     // Current contextual insight
    private List<HourForecast> forecast; // Next 6 hours
    private int cognitiveReserve; // 0-100 Cognitive Readiness

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HourForecast {
        private String time;      // e.g. "14:00"
        private int energyValue;  // 0-100
    }
}
