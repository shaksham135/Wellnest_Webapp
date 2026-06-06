package com.wellnest.app.service;

import com.wellnest.app.model.User;
import com.wellnest.app.repository.UserRepository;
import com.wellnest.app.repository.WaterIntakeRepository;
import com.wellnest.app.repository.DailyActivityRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Random;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@Service
public class ReminderService {

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final WaterIntakeRepository waterIntakeRepository;
    private final DailyActivityRepository dailyActivityRepository;
    private final GroqService groqService;
    private final Random random = new Random();

    private final String[] waterReminders = {
        "Time for a sip! Drink a glass of water to stay hydrated. 💧",
        "Hydration check! Your body needs water to function at its best. 🚰",
        "Feeling a bit tired? A glass of water might be just what you need! 🥤",
        "Stay fresh! Keep your hydration levels up. 🌊"
    };

    private final String[] workoutReminders = {
        "Did you move today? A quick 15-minute workout can boost your mood! 🏃‍♂️",
        "Consistency is key! Don't forget to track your activity today. 💪",
        "Healthy mind, healthy body. Ready for a quick stretch? 🧘‍♀️",
        "Your goals are waiting! Let's get that workout in. 🏋️‍♂️"
    };

    public ReminderService(NotificationService notificationService, 
                           UserRepository userRepository,
                           WaterIntakeRepository waterIntakeRepository,
                           DailyActivityRepository dailyActivityRepository,
                           GroqService groqService) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.waterIntakeRepository = waterIntakeRepository;
        this.dailyActivityRepository = dailyActivityRepository;
        this.groqService = groqService;
    }

    private final String[] healthTips = {
        "Pro tip: Drinking water before meals can aid digestion and weight management. 💡",
        "Consistency check: Even a 5-minute walk is better than no walk at all! 🚶‍♀️",
        "Better sleep tip: Try to avoid screens 30 minutes before bedtime for deeper rest. 💤",
        "Posture matters: Take a moment to roll your shoulders back and sit up tall. 🧘‍♂️",
        "Healthy eating: Aim for a variety of colorful vegetables in your next meal. 🥦"
    };

    private boolean isUserActiveInLast48Hours(User user) {
        LocalDate today = LocalDate.now();
        LocalDate twoDaysAgo = today.minusDays(2);
        
        // 1. Check direct user activity timestamps
        if (user.getLastChatDate() != null && !user.getLastChatDate().isBefore(twoDaysAgo)) return true;
        if (user.getLastVoiceDate() != null && !user.getLastVoiceDate().isBefore(twoDaysAgo)) return true;
        if (user.getLastScanDate() != null && !user.getLastScanDate().isBefore(twoDaysAgo)) return true;
        
        // 2. Check daily activity logs for the last 3 days (today, yesterday, day before)
        try {
            boolean hasRecentActivity = dailyActivityRepository.findByUserIdAndDate(user.getId(), today).isPresent()
                    || dailyActivityRepository.findByUserIdAndDate(user.getId(), today.minusDays(1)).isPresent()
                    || dailyActivityRepository.findByUserIdAndDate(user.getId(), today.minusDays(2)).isPresent();
            if (hasRecentActivity) return true;
        } catch (Exception e) {
            // Ignore
        }
        
        // 3. Check if they registered in the last 48 hours
        if (user.getCreatedAt() != null) {
            java.time.LocalDateTime twoDaysAgoLDT = java.time.LocalDateTime.now().minusDays(2);
            if (user.getCreatedAt().isAfter(twoDaysAgoLDT)) {
                return true;
            }
        }
        
        return false;
    }

    // Every day at 10:00 AM and 6:00 PM (prevents startup spam)
    @Scheduled(cron = "0 0 10,18 * * *") 
    public void sendWaterReminders() {
        Instant startOfDay = LocalDate.now().atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant endOfDay = LocalDate.now().atTime(java.time.LocalTime.MAX).atZone(ZoneOffset.UTC).toInstant();
        
        Pageable pageable = PageRequest.of(0, 100);
        Page<User> page;
        do {
            page = userRepository.findAll(pageable);
            for (User user : page.getContent()) {
                // Smart Check: Only remind if they haven't logged water today
                boolean hasLoggedWater = !waterIntakeRepository.findByUserIdAndLoggedAtBetween(user.getId(), startOfDay, endOfDay).isEmpty();
                
                if (!hasLoggedWater) {
                    String name = user.getName() != null ? user.getName() : "Hero";
                    String role = user.getRole() != null ? user.getRole().replace("ROLE_", "").toLowerCase() : "user";
                    String goal = user.getFitnessGoal() != null ? user.getFitnessGoal().replace("_", " ").toLowerCase() : "stay healthy";
                    
                    String message;
                    // Cost Optimization: Only call AI for active premium users
                    if (user.isPremium() && isUserActiveInLast48Hours(user)) {
                        message = groqService.generateNotification(role, name, "Goal: " + goal + ". Needs a hydration reminder.");
                    } else {
                        message = waterReminders[random.nextInt(waterReminders.length)];
                    }
                    
                    // Fallback if AI message is error or too long
                    if (message == null || message.contains("Error") || message.length() > 150) {
                        message = waterReminders[random.nextInt(waterReminders.length)];
                    }
                    
                    notificationService.createNotification(user.getId(), "Hydration Reminder", message, "INFO");
                }
            }
            pageable = pageable.next();
        } while (page.hasNext());
    }

    // Every day at 4:00 PM (prevents startup spam)
    @Scheduled(cron = "0 0 16 * * *")
    public void sendWorkoutReminders() {
        LocalDate today = LocalDate.now();
        Pageable pageable = PageRequest.of(0, 100);
        Page<User> page;
        do {
            page = userRepository.findAll(pageable);
            for (User user : page.getContent()) {
                // Smart Check: Only remind if they haven't logged activity today
                boolean hasLoggedActivity = dailyActivityRepository.findByUserIdAndDate(user.getId(), today).isPresent();
                
                if (!hasLoggedActivity) {
                    String name = user.getName() != null ? user.getName() : "Hero";
                    String role = user.getRole() != null ? user.getRole().replace("ROLE_", "").toLowerCase() : "user";
                    String goal = user.getFitnessGoal() != null ? user.getFitnessGoal().replace("_", " ").toLowerCase() : "fitness progress";

                    String message;
                    // Cost Optimization: Only call AI for active premium users
                    if (user.isPremium() && isUserActiveInLast48Hours(user)) {
                        message = groqService.generateNotification(role, name, "Goal: " + goal + ". Needs a motivation push to log a workout.");
                    } else {
                        message = workoutReminders[random.nextInt(workoutReminders.length)];
                    }

                    // Fallback
                    if (message == null || message.contains("Error") || message.length() > 150) {
                        message = workoutReminders[random.nextInt(workoutReminders.length)];
                    }

                    notificationService.createNotification(user.getId(), "Activity Check", message, "SUCCESS");
                }
            }
            pageable = pageable.next();
        } while (page.hasNext());
    }
}
