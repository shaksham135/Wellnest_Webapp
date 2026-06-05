package com.wellnest.app.service;

import com.wellnest.app.model.User;
import com.wellnest.app.repository.DailyActivityRepository;
import com.wellnest.app.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@Slf4j
public class EngagementService {

    private final UserRepository userRepository;
    private final DailyActivityRepository dailyActivityRepository;
    private final NotificationService notificationService;

    public EngagementService(UserRepository userRepository, 
                             DailyActivityRepository dailyActivityRepository,
                             NotificationService notificationService) {
        this.userRepository = userRepository;
        this.dailyActivityRepository = dailyActivityRepository;
        this.notificationService = notificationService;
    }

    /**
     * STREAK PROTECTION ENGINE
     * Runs every day at 8 PM (20:00).
     * Alerts users who haven't logged any activity yet today.
     */
    @Scheduled(cron = "0 0 20 * * *")
    public void runStreakProtection() {
        log.info("EngagementEngine: Running Streak Protection check... 🔥");
        LocalDate today = LocalDate.now();
        List<User> users = userRepository.findAll();

        for (User user : users) {
            boolean hasActivity = dailyActivityRepository.findByUserIdAndDate(user.getId(), today).isPresent();
            
            if (!hasActivity) {
                log.info("EngagementEngine: Sending streak alert to user: {}", user.getEmail());
                notificationService.createNotification(
                    user.getId(), 
                    "🔥 Streak at Risk!", 
                    "Don't lose your progress! Log your steps or a quick workout now to keep your streak alive.",
                    "ENGAGEMENT"
                );
            }
        }
    }
}
