package com.wellnest.app.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.util.Random;
import java.util.Collections;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/health-tips")
public class HealthTipController {

    private final List<String> FALLBACK_TIPS = List.of(
            "Drink at least 8 glasses of water today for optimal hydration.",
            "Take a 10-minute walk after lunch to boost digestion.",
            "Aim for 7-9 hours of quality sleep tonight.",
            "Include a portion of leafy greens in your dinner.",
            "Practice deep breathing for 5 minutes if you feel stressed.",
            "Limit sugary drinks and opt for herbal tea or water.",
            "Stretch for 5 minutes before starting your work day.",
            "Eat a protein-rich breakfast to curb cravings later.",
            "Avoid blue light screens 1 hour before bed.",
            "Take the stairs instead of the elevator whenever possible.",
            "Snack on nuts or fruit instead of processed chips.",
            "Listen to your body—rest if you are feeling fatigued.",
            "Stand up and move around every hour while working.",
            "Try a new vegetable or fruit this week.",
            "Socialize with a friend—it boosts mental well-being!",
            "Spend 15 minutes in sunlight for Vitamin D.",
            "Keep a water bottle at your desk as a reminder to drink.",
            "Chew your food slowly to improve digestion.",
            "Plan your healthy meals for the week on Sunday.",
            "Replace one coffee with a glass of water.",
            "Do a quick plank or push-ups during TV commercials.",
            "Read a book instead of scrolling social media before bed.",
            "Gratitude journaling can lower stress levels.",
            "Cut down on added salt in your meals.",
            "Make your bedroom a dark, cool sanctuary for sleep.");

    private final List<String> KEYWORDS = List.of("nutrition", "exercise", "sleep", "stress", "heart", "fitness",
            "wellness");
    private final RestTemplate restTemplate = new RestTemplate();
    private final Random random = new Random();

    @GetMapping("/daily")
    public ResponseEntity<?> getDailyTip() {
        try {
            // Pick a random keyword
            String keyword = KEYWORDS.get(random.nextInt(KEYWORDS.size()));
            String url = "https://health.gov/myhealthfinder/api/v4/topicsearch.json?keyword=" + keyword;

            // Fetch from API
            Map response = restTemplate.getForObject(url, Map.class);

            if (response != null && response.containsKey("Result")) {
                Map result = (Map) response.get("Result");
                if (result.containsKey("Resources")) {
                    Map resources = (Map) result.get("Resources");
                    if (resources.containsKey("Resource")) {
                        Object resourceObj = resources.get("Resource");
                        List<Map<String, Object>> resourceList;

                        if (resourceObj instanceof List) {
                            resourceList = (List<Map<String, Object>>) resourceObj;
                        } else if (resourceObj instanceof Map) {
                            resourceList = Collections.singletonList((Map<String, Object>) resourceObj);
                        } else {
                            resourceList = new ArrayList<>();
                        }

                        if (!resourceList.isEmpty()) {
                            // Pick a random item from the results
                            Map<String, Object> randomItem = resourceList.get(random.nextInt(resourceList.size()));
                            String title = (String) randomItem.get("Title");
                            String link = (String) randomItem.get("AccessibleVersion");

                            // Sometimes titles are too long or specific, but it's better than nothing
                            return ResponseEntity.ok(Map.of(
                                    "tip", title,
                                    "source", "MyHealthfinder",
                                    "link", link != null ? link : ""));
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch health tip from API: " + e.getMessage());
            // Fallback to local list on error
        }

        // Fallback Logic
        int dayOfYear = LocalDate.now().getDayOfYear();
        String tip = FALLBACK_TIPS.get(dayOfYear % FALLBACK_TIPS.size());

        return ResponseEntity.ok(Map.of(
                "tip", tip,
                "source", "Wellnest (Daily)"));
    }
}
