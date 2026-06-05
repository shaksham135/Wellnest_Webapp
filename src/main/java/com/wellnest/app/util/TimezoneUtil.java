package com.wellnest.app.util;

import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import jakarta.servlet.http.HttpServletRequest;
import java.time.ZoneId;
import java.time.ZoneOffset;

public class TimezoneUtil {

    public static ZoneId getClientZoneId() {
        try {
            RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
            if (attrs instanceof ServletRequestAttributes) {
                HttpServletRequest request = ((ServletRequestAttributes) attrs).getRequest();
                
                // Try X-Timezone header first (e.g. "Asia/Kolkata")
                String tzHeader = request.getHeader("X-Timezone");
                if (tzHeader != null && !tzHeader.isEmpty()) {
                    return ZoneId.of(tzHeader);
                }
                
                // Fallback to X-Timezone-Offset header (in minutes)
                String offsetHeader = request.getHeader("X-Timezone-Offset");
                if (offsetHeader != null && !offsetHeader.isEmpty()) {
                    int offsetMinutes = Integer.parseInt(offsetHeader);
                    // JS getTimezoneOffset() returns opposite sign: UTC - Local Time
                    return ZoneOffset.ofTotalSeconds(-offsetMinutes * 60);
                }
            }
        } catch (Exception e) {
            // Log or ignore to fallback
        }
        return ZoneId.of("UTC");
    }

    public static ZoneOffset getClientZoneOffset() {
        ZoneId zoneId = getClientZoneId();
        if (zoneId instanceof ZoneOffset) {
            return (ZoneOffset) zoneId;
        }
        // If it's a full ZoneId like "Asia/Kolkata", get current offset for it
        return zoneId.getRules().getOffset(java.time.Instant.now());
    }
}
