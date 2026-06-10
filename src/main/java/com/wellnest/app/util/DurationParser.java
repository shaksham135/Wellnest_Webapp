package com.wellnest.app.util;

import lombok.extern.slf4j.Slf4j;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
public class DurationParser {

    public static class QuantityResult {
        public Double exactValue;
        public Double minValue;
        public Double maxValue;
        public boolean isRange = false;
        public boolean approximate = false;
        public double confidence = 1.0;
        public String unit = "minute"; // "hour", "minute", "glass", "step", "km", etc.
        public boolean hasQuantity = false;
        public boolean hasDuration = false; // backward compatibility

        public double getAsMinutes() {
            double val = exactValue != null ? exactValue : (minValue != null ? (minValue + maxValue) / 2.0 : 30.0);
            if ("hour".equals(unit)) {
                return val * 60.0;
            }
            return val;
        }

        public double getAsHours() {
            double val = exactValue != null ? exactValue : (minValue != null ? (minValue + maxValue) / 2.0 : 8.0);
            if ("minute".equals(unit)) {
                return val / 60.0;
            }
            return val;
        }
    }

    public static QuantityResult parse(String normalized) {
        return parse(normalized, normalized);
    }

    public static QuantityResult parse(String normalized, String original) {
        QuantityResult result = new QuantityResult();
        if (normalized == null || normalized.trim().isEmpty()) {
            return result;
        }

        // 1. Base confidence determination based on original text spelling / typos
        double baseConfidence = 1.0;
        if (original != null && !original.trim().isEmpty()) {
            String origLower = original.toLowerCase();

            // Level 1: minor typos (sava, derh, dhayi, adha, paune)
            if (origLower.contains("sava") || origLower.contains("derh") || 
                origLower.contains("dhayi") || origLower.contains("adha") || 
                origLower.contains("paune")) {
                baseConfidence = 0.92;
            }
            // Level 2: medium typos (shawa, deedh, dhaye, adhe, pauna, swa)
            if (origLower.contains("shawa") || origLower.contains("deedh") || 
                origLower.contains("dhaye") || origLower.contains("adhe") || 
                origLower.contains("pauna") || origLower.contains("swa")) {
                baseConfidence = 0.85;
            }
            // Level 3: worst typos (sawaa, deth, adhai, aadhe, paund, ghata)
            if (origLower.contains("sawaa") || origLower.contains("deth") || 
                origLower.contains("adhai") || origLower.contains("aadhe") || 
                origLower.contains("paund") || origLower.contains("ghata")) {
                baseConfidence = 0.72;
            }

            // Check unit spelling typos
            if (origLower.contains("ghnte") || origLower.contains("gnhta") || 
                origLower.contains("ghnto") || origLower.contains("ghnta") ||
                origLower.contains("ghnt") || origLower.contains("ghantein") ||
                origLower.contains("minut") || origLower.contains("minuts") || 
                origLower.contains("mnt") || origLower.contains("mnts") || 
                origLower.contains("mints") || origLower.contains("mint")) {
                baseConfidence = Math.min(baseConfidence, 0.88);
            }
        }

        result.confidence = baseConfidence;

        // 2. Detect approximations
        if (normalized.contains("lagbhag") || normalized.contains("karib") || normalized.contains("approx") || 
            normalized.contains("around") || normalized.contains("nearly") || normalized.contains("almost")) {
            result.approximate = true;
            result.confidence *= 0.85;
        }

        // Remove approximation words so they don't block digit extraction
        String cleaned = normalized.replaceAll("\\b(lagbhag|karib|approx|approximately|around|about|nearly|almost)\\b", "").trim();

        // Standardize omitted minute unit: e.g. "2 hour 30" -> "2 hour 30 minute"
        cleaned = cleaned.replaceAll("(\\d+(?:\\.\\d+)?)\\s*hour\\s*(\\d+(?:\\.\\d+)?)(?!\\s*minute)\\b", "$1 hour $2 minute");

        // 3. Parse Ranges (e.g. "3 se 4 hour" or "3 to 4 hour" or "3-4 hour")
        Pattern hourRangePattern = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(?:se|to|-)\\s*(\\d+(?:\\.\\d+)?)\\s*hour");
        Matcher hourRangeMatcher = hourRangePattern.matcher(cleaned);
        if (hourRangeMatcher.find()) {
            result.minValue = Double.parseDouble(hourRangeMatcher.group(1));
            result.maxValue = Double.parseDouble(hourRangeMatcher.group(2));
            result.isRange = true;
            result.unit = "hour";
            result.confidence *= 0.90;
            result.hasQuantity = true;
            result.hasDuration = true;
            return result;
        }

        Pattern minRangePattern = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(?:se|to|-)\\s*(\\d+(?:\\.\\d+)?)\\s*minute");
        Matcher minRangeMatcher = minRangePattern.matcher(cleaned);
        if (minRangeMatcher.find()) {
            result.minValue = Double.parseDouble(minRangeMatcher.group(1));
            result.maxValue = Double.parseDouble(minRangeMatcher.group(2));
            result.isRange = true;
            result.unit = "minute";
            result.confidence *= 0.90;
            result.hasQuantity = true;
            result.hasDuration = true;
            return result;
        }

        // 4. Parse composite "X hour Y minute"
        Pattern compositePattern = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*hour\\s*(\\d+(?:\\.\\d+)?)\\s*minute");
        Matcher compositeMatcher = compositePattern.matcher(cleaned);
        if (compositeMatcher.find()) {
            double hrs = Double.parseDouble(compositeMatcher.group(1));
            double mins = Double.parseDouble(compositeMatcher.group(2));
            result.exactValue = hrs * 60.0 + mins;
            result.unit = "minute"; // composite is resolved to minutes directly
            result.hasQuantity = true;
            result.hasDuration = true;
            return result;
        }

        // 5. Parse single unit "X hour" or "Y minute"
        Pattern hourPattern = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*hour");
        Matcher hourMatcher = hourPattern.matcher(cleaned);
        if (hourMatcher.find()) {
            result.exactValue = Double.parseDouble(hourMatcher.group(1));
            result.unit = "hour";
            result.hasQuantity = true;
            result.hasDuration = true;
            return result;
        }

        Pattern minPattern = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*minute");
        Matcher minMatcher = minPattern.matcher(cleaned);
        if (minMatcher.find()) {
            result.exactValue = Double.parseDouble(minMatcher.group(1));
            result.unit = "minute";
            result.hasQuantity = true;
            result.hasDuration = true;
            return result;
        }

        // 6. Fallback: bare number (e.g. "ran 30")
        Pattern barePattern = Pattern.compile("(\\d+(?:\\.\\d+)?)");
        Matcher bareMatcher = barePattern.matcher(cleaned);
        if (bareMatcher.find()) {
            result.exactValue = Double.parseDouble(bareMatcher.group(1));
            result.unit = "minute"; // default fallback is minute
            result.confidence *= 0.70;
            result.hasQuantity = true;
            result.hasDuration = true;
        }

        return result;
    }
}
