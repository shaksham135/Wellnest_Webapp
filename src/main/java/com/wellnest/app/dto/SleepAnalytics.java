package com.wellnest.app.dto;

import lombok.Data;
import java.util.Map;

@Data
public class SleepAnalytics {
    private double avgSleepDuration; // in hours
    private double avgSleepQuality;  // 1-5 scale
    private Map<String, Double> weeklySleepTrend;
    private String sleepConsistency; // "Good", "Fair", "Poor"
}
