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
        "Time for a sip, %s! Drink a glass of water to stay hydrated. 💧",
        "Hydration check, %s! Your body needs water to function at its best. 🚰",
        "Feeling a bit tired, %s? A glass of water might be just what you need! 🥤",
        "Stay fresh, %s! Keep your hydration levels up. 🌊"
    };

    private final String[] workoutReminders = {
        "Did you move today, %s? A quick 15-minute workout can boost your mood! 🏃‍♂️",
        "Consistency is key, %s! Don't forget to track your activity today. 💪",
        "Healthy mind, healthy body, %s. Ready for a quick stretch? 🧘‍♀️",
        "Your goals are waiting, %s! Let's get that workout in. 🏋️‍♂️"
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
                    String template = waterReminders[random.nextInt(waterReminders.length)];
                    String message = String.format(template, name);
                    
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
                    String template = workoutReminders[random.nextInt(workoutReminders.length)];
                    String message = String.format(template, name);

                    notificationService.createNotification(user.getId(), "Activity Check", message, "SUCCESS");
                }
            }
            pageable = pageable.next();
        } while (page.hasNext());
    }
}
