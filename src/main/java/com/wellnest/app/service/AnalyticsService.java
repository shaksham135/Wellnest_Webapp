package com.wellnest.app.service;

import com.wellnest.app.dto.AnalyticsSummary;
import org.springframework.security.core.Authentication;
import java.time.LocalDate;

public interface AnalyticsService {
    AnalyticsSummary getUserAnalytics(Authentication authentication, LocalDate startDate, LocalDate endDate);
    AnalyticsSummary getUserAnalytics(Authentication authentication);
}
