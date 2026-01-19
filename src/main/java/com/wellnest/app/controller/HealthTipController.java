package com.wellnest.app.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import java.util.List;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/health-tips")
public class HealthTipController {

    private final List<String> TIPS = List.of(
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

    @GetMapping("/daily")
    public ResponseEntity<?> getDailyTip() {
        // Use DayOfYear to consistently show the same tip for the whole day for
        // everyone
        int dayOfYear = LocalDate.now().getDayOfYear();
        String tip = TIPS.get(dayOfYear % TIPS.size());

        return ResponseEntity.ok(Map.of(
                "tip", tip));
    }
}
