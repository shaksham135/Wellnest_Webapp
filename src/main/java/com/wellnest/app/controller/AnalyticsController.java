package com.wellnest.app.controller;

import com.wellnest.app.dto.AnalyticsSummary;
import com.wellnest.app.service.AnalyticsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "http://localhost:3000")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/summary")
    public ResponseEntity<AnalyticsSummary> getAnalyticsSummary(
            Authentication authentication,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        AnalyticsSummary summary;
        if (startDate != null && endDate != null) {
            summary = analyticsService.getUserAnalytics(authentication, startDate, endDate);
        } else {
            summary = analyticsService.getUserAnalytics(authentication);
        }

        return ResponseEntity.ok(summary);
    }
}
