package com.wellnest.app.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/health-tips")
public class HealthTipController {

        private final RestTemplate restTemplate = new RestTemplate();

        // Robust Fallback List (Over 30 tips for monthly variety)
        record Tip(String text, String category) {
        }

        private final List<Tip> BACKUP_TIPS = List.of(
                        new Tip("Hydration is key: Drink a glass of water now.", "Hydration"),
                        new Tip("Take a 5-minute break to stretch your back.", "Fitness"),
                        new Tip("Sleep is when your muscles recover—aim for 8 hours.", "Sleep"),
                        new Tip("Eat a fruit or vegetable with your next meal.", "Nutrition"),
                        new Tip("Deep breathing reduces cortisol levels instantly.", "Stress"),
                        new Tip("Walking 10 minutes after a meal aids digestion.", "Fitness"),
                        new Tip("Avoid screens 30 minutes before bed for better sleep.", "Sleep"),
                        new Tip("Your body needs rest as much as it needs activity.", "Wellness"),
                        new Tip("Consistency is better than intensity.", "Motivation"),
                        new Tip("Listen to your body—if you're tired, rest.", "Wellness"),
                        new Tip("Swap soda for sparkling water or herbal tea.", "Nutrition"),
                        new Tip("Take the stairs instead of the elevator today.", "Fitness"),
                        new Tip("Practice gratitude: Name 3 things you are thankful for.", "Mindfulness"),
                        new Tip("Stand up and move around every hour.", "Fitness"),
                        new Tip("Eat slowly and chew your food thoroughly.", "Nutrition"),
                        new Tip("Get at least 15 minutes of sunlight today.", "Wellness"),
                        new Tip("Replace processed snacks with nuts or seeds.", "Nutrition"),
                        new Tip("Read a book instead of scrolling before bed.", "Sleep"),
                        new Tip("Do a plank for 30 seconds to strengthen your core.", "Fitness"),
                        new Tip("Smile! It signals your brain to release serotonin.", "Mindfulness"),
                        new Tip("Cut back on added sugars for better energy levels.", "Nutrition"),
                        new Tip("Keep your bedroom cool and dark for better sleep.", "Sleep"),
                        new Tip("Park further away to get more steps in.", "Fitness"),
                        new Tip("Stay present: Focus on your breath for 1 minute.", "Mindfulness"),
                        new Tip("Eat a high-protein breakfast to stay full longer.", "Nutrition"),
                        new Tip("Limit caffeine intake after 2 PM.", "Sleep"),
                        new Tip("Stretch your neck and shoulders to release tension.", "Fitness"),
                        new Tip("Connect with a friend or loved one today.", "Social Wellness"),
                        new Tip("Declutter your workspace for a clearer mind.", "Productivity"),
                        new Tip("Drink water before every meal.", "Hydration"));

        @GetMapping("/daily")
        public ResponseEntity<?> getDailyTip() {
                try {
                        // ZenQuotes API: Returns an array of objects [ { "q": "quote", "a": "author",
                        // ... } ]
                        String url = "https://zenquotes.io/api/random";

                        // Fetch as List of Maps
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> response = restTemplate.getForObject(url, List.class);

                        if (response != null && !response.isEmpty()) {
                                Map<String, Object> quoteObj = response.get(0);
                                String quoteText = (String) quoteObj.get("q");
                                // ZenQuotes are inspirational, so we categorize them generally or randomly
                                String category = "Inspiration";

                                return ResponseEntity.ok(Map.of(
                                                "tip", quoteText,
                                                "category", category,
                                                "source", "ZenQuotes API"));
                        }
                } catch (Exception e) {
                        // Log error silently and use fallback
                        System.err.println("Health Tip API Error: " + e.getMessage());
                }

                // --- FALLBACK LOGIC ---
                // Pick a backup tip based on Day of Year so it rotates daily even offline
                int index = (LocalDate.now().getDayOfYear()) % BACKUP_TIPS.size();
                Tip backup = BACKUP_TIPS.get(index);

                return ResponseEntity.ok(Map.of(
                                "tip", backup.text(),
                                "category", backup.category(),
                                "source", "Wellnest Coach (Offline)"));
        }
}
