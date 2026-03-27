package com.wellnest.app.service;

import com.wellnest.app.model.Notification;
import com.wellnest.app.model.User;
import com.wellnest.app.repository.NotificationRepository;
import com.wellnest.app.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;
import org.springframework.scheduling.annotation.Scheduled;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.FirebaseMessagingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final GroqService groqService;
    private final TrackerService trackerService;
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    private static final String[] STATIC_TIPS = {
        "Pro tip: Drinking water before meals can aid digestion and weight management. 💡",
        "Consistency is key! Even a 10-minute walk counts towards your fitness goals. 🚶‍♂️",
        "Getting 7-8 hours of sleep helps your muscles recover faster after workouts. 😴",
        "High-protein snacks like Greek yogurt or nuts help keep you full longer. 🥜",
        "Try deep breathing for 5 minutes today to reduce stress and improve focus. 🧘‍♀️"
    };

    public NotificationService(NotificationRepository notificationRepository, 
                               UserRepository userRepository,
                               GroqService groqService,
                               TrackerService trackerService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.groqService = groqService;
        this.trackerService = trackerService;
    }

    public void createNotification(Long userId, String title, String message, String type) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Notification notification = new Notification(user, title, message, type);
        notificationRepository.save(notification);

        // Native Push Relay
        sendFcmNotification(user, title, message);
    }

    public void sendFcmNotification(User user, String title, String body) {
        if (user.getFcmToken() == null || user.getFcmToken().isEmpty()) {
            return;
        }

        try {
            Message message = Message.builder()
                    .setToken(user.getFcmToken())
                    .setNotification(com.google.firebase.messaging.Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .build();

            String response = FirebaseMessaging.getInstance().send(message);
            logger.info("Successfully sent FCM message: " + response);
        } catch (Exception e) {
            logger.error("Failed to send FCM message to user " + user.getId() + ": " + e.getMessage());
        }
    }

    public List<Notification> getUserNotifications(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Trigger daily tip if needed (one per day, on first check)
        ensureDailyTip(user);

        return notificationRepository.findByUser_IdOrderByCreatedAtDesc(user.getId());
    }

    private void ensureDailyTip(User user) {
        java.time.Instant startOfToday = LocalDate.now().atStartOfDay(java.time.ZoneId.systemDefault()).toInstant();
        boolean alreadyGotTip = notificationRepository.existsByUser_IdAndTypeAndCreatedAtAfter(
                user.getId(), "TIP", startOfToday);

        if (!alreadyGotTip) {
            String name = user.getName() != null ? user.getName() : "Hero";
            String role = user.getRole() != null ? user.getRole().replace("ROLE_", "").toLowerCase() : "user";
            String goal = user.getFitnessGoal() != null ? user.getFitnessGoal().replace("_", " ").toLowerCase() : "wellbeing";

            String tip;
            String title = "Daily Health Tip";

            if (user.isPremium()) {
                title = "Your AI Coach Nudge";
                // Gather Context for Premium
                StringBuilder context = new StringBuilder();
                context.append("Goal: ").append(goal).append(". ");
                
                try {
                    var workouts = trackerService.getWorkoutsForUser(user.getId());
                    if (!workouts.isEmpty()) {
                        var last = workouts.get(0);
                        context.append("Last workout: ").append(last.getType()).append(" for ").append(last.getDurationMinutes()).append(" mins. ");
                    }
                    
                    var water = trackerService.getWaterForUser(user.getId());
                    double waterToday = water.stream()
                        .filter(w -> w.getLoggedAt().isAfter(startOfToday))
                        .mapToDouble(com.wellnest.app.model.WaterIntake::getLiters)
                        .sum();
                    context.append("Water today: ").append(String.format("%.1f", waterToday)).append("L (Target: ").append(user.getTargetWaterLiters()).append("L). ");
                } catch (Exception e) {
                    context.append("Keep pushing towards your goals!");
                }

                tip = groqService.generateNotification(role, name, context.toString());
            } else {
                // Normal User: Standard Tip + Upsell
                int index = (int) (Math.random() * STATIC_TIPS.length);
                tip = STATIC_TIPS[index] + "\n\n✨ Upgrade to Wellnest Premium for personalized AI coaching!";
            }
            
            // Standard fallback if AI fails or returns error
            if (tip == null || tip.contains("Error") || tip.length() > 300) {
                tip = STATIC_TIPS[0];
            }

            Notification notification = new Notification(user, title, tip, "TIP");
            notificationRepository.save(notification);

            // Also push to mobile
            sendFcmNotification(user, title, tip);
        }
    }

    public void markAsRead(Long notificationId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        n.setRead(true);
        notificationRepository.save(n);
    }

    public void markAllAsRead(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Notification> list = notificationRepository.findByUser_IdOrderByCreatedAtDesc(user.getId());
        list.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(list);
    }

    public void notifyAllUsers(String title, String message, String type) {
        List<User> users = userRepository.findAll();
        List<Notification> notifications = new ArrayList<>();
        
        for (User user : users) {
            notifications.add(new Notification(user, title, message, type));
            // Relay to FCM
            sendFcmNotification(user, title, message);
        }
        
        notificationRepository.saveAll(notifications);
    }

    // --- Automated AI Nudges (Industry Standard Proactive System) ---

    @Scheduled(cron = "0 30 8 * * *") // Every day at 8:30 AM
    public void scheduleMorningMotivation() {
        logger.info("Triggering Morning AI Nudges...");
        processScheduledNudges("Morning Motivation", "Start your day strong!");
    }

    @Scheduled(cron = "0 0 14 * * *") // Every day at 2:00 PM
    public void scheduleHydrationCheck() {
        logger.info("Triggering Hydration AI Nudges...");
        processScheduledNudges("Hydration Check", "Time to drink up!");
    }

    @Scheduled(cron = "0 0 21 * * *") // Every day at 9:00 PM
    public void scheduleEveningReview() {
        logger.info("Triggering Evening AI Nudges...");
        processScheduledNudges("Daily Review", "Reflect on your progress.");
    }

    @Scheduled(cron = "0 0 10 * * *") // Every day at 10:00 AM (Standard tip for everyone)
    public void scheduleNormalUserTips() {
        logger.info("Triggering standard tips for non-premium users...");
        List<User> normalUsers = userRepository.findAll().stream()
                .filter(u -> !u.isPremium())
                .collect(Collectors.toList());

        for (User user : normalUsers) {
            try {
                // Ensure we haven't already sent a tip today
                java.time.Instant startOfToday = LocalDate.now().atStartOfDay(java.time.ZoneId.systemDefault()).toInstant();
                boolean alreadyGotTip = notificationRepository.existsByUser_IdAndTypeAndCreatedAtAfter(
                        user.getId(), "TIP", startOfToday);

                if (!alreadyGotTip) {
                    int index = (int) (Math.random() * STATIC_TIPS.length);
                    String tip = STATIC_TIPS[index] + "\n\n✨ Upgrade to Wellnest Premium for personalized AI coaching!";
                    String title = "Daily Health Tip";

                    Notification n = new Notification(user, title, tip, "TIP");
                    notificationRepository.save(n);
                    sendFcmNotification(user, title, tip);
                }
            } catch (Exception e) {
                logger.error("Error processing standard tip for user " + user.getId() + ": " + e.getMessage());
            }
        }
    }

    private void processScheduledNudges(String title, String defaultMsg) {
        List<User> premiumUsers = userRepository.findAll().stream()
                .filter(User::isPremium)
                .collect(Collectors.toList());

        for (User user : premiumUsers) {
            try {
                // Ensure we haven't already sent a nudge of this type very recently (within 4 hours)
                java.time.Instant fourHoursAgo = java.time.Instant.now().minusSeconds(4 * 3600);
                boolean recentlyNudged = notificationRepository.existsByUser_IdAndTypeAndCreatedAtAfter(
                        user.getId(), "AI_NUDGE", fourHoursAgo);
                
                if (!recentlyNudged) {
                    String name = user.getName() != null ? user.getName() : "Hero";
                    String goal = user.getFitnessGoal() != null ? user.getFitnessGoal().replace("_", " ").toLowerCase() : "wellbeing";
                    
                    StringBuilder context = new StringBuilder();
                    context.append("Current Goal: ").append(goal).append(". ");
                    context.append("Time of day: ").append(LocalDateTime.now().getHour()).append(":00. ");
                    
                    // Simple data fetch for context
                    var water = trackerService.getWaterForUser(user.getId());
                    double waterToday = water.stream()
                        .filter(w -> w.getLoggedAt().isAfter(LocalDate.now().atStartOfDay(java.time.ZoneId.systemDefault()).toInstant()))
                        .mapToDouble(com.wellnest.app.model.WaterIntake::getLiters)
                        .sum();
                    context.append("Water logged today: ").append(String.format("%.1f", waterToday)).append("L. ");

                    String aiMessage = groqService.generateNotification("premium user", name, context.toString());
                    
                    if (aiMessage != null && !aiMessage.contains("Error")) {
                        Notification n = new Notification(user, title, aiMessage, "AI_NUDGE");
                        notificationRepository.save(n);
                        sendFcmNotification(user, title, aiMessage);
                    }
                }
            } catch (Exception e) {
                logger.error("Error processing scheduled nudge for user " + user.getId() + ": " + e.getMessage());
            }
        }
    }
}
