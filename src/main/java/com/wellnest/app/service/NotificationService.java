package com.wellnest.app.service;

import com.wellnest.app.model.Notification;
import com.wellnest.app.model.User;
import com.wellnest.app.repository.NotificationRepository;
import com.wellnest.app.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.scheduling.annotation.Scheduled;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
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

    public void updateUserFcmToken(String email, String token) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setFcmToken(token);
        userRepository.save(user);
        logger.info("FCM token updated for user: " + user.getId());
    }

    public void createNotification(Long userId, String title, String message, String type) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Only save to DB if it's a structural or social notification (non-AI noise)
        if (!"AI_NUDGE".equals(type) && !"TRACKING_REMINDER".equals(type)) {
            Notification notification = new Notification(user, title, message, type);
            notificationRepository.save(notification);
        }

        // Native Push Relay (Sent to device regardless)
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
                    List<com.wellnest.app.model.Workout> workouts = trackerService.getWorkoutsForToday(user.getId());
                    if (!workouts.isEmpty()) {
                        context.append("Awesome job—workout logged already! ");
                    }
                } catch (Exception e) {
                    context.append("Keep pushing towards your goals! ");
                }

                tip = groqService.generateNotification(role, name, context.toString());
            } else {
                // Normal User: Standard Tip + Upsell
                int index = (int) (Math.random() * STATIC_TIPS.length);
                tip = STATIC_TIPS[index] + "\n\n✨ Upgrade to Wellnest Premium for personalized AI coaching!";
            }
            
            if (tip == null || tip.contains("Error") || tip.length() > 300) tip = STATIC_TIPS[0];

            Notification notification = new Notification(user, title, tip, "TIP");
            notificationRepository.save(notification);
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

    @org.springframework.scheduling.annotation.Async
    public void broadcastNotification(String title, String message, String type, String targetGroup) {
        logger.info("Starting broadcast: " + title + " | Target: " + targetGroup);
        List<User> users = userRepository.findAll();
        
        List<User> targetUsers = users.stream().filter(u -> {
            if ("PREMIUM".equalsIgnoreCase(targetGroup)) return u.isPremium();
            if ("FREE".equalsIgnoreCase(targetGroup)) return !u.isPremium() && (u.getRole() == null || u.getRole().contains("USER"));
            if ("TRAINERS".equalsIgnoreCase(targetGroup)) return u.getRole() != null && u.getRole().contains("TRAINER");
            return true; // "ALL" or fallback
        }).collect(Collectors.toList());

        int successCount = 0;
        int failCount = 0;

        for (User user : targetUsers) {
            try {
                createNotification(user.getId(), title, message, type);
                successCount++;
            } catch (Exception e) {
                failCount++;
                logger.error("Broadcast failure for user " + user.getId() + ": " + e.getMessage());
            }
        }
        logger.info("Broadcast complete to " + targetGroup + ". Success: " + successCount + ", Failed: " + failCount);
    }

    // --- Automated AI Nudges (Industry Standard Proactive System) ---

    @Scheduled(cron = "0 0 8 * * *") // Every day at 8:00 AM
    public void scheduleMorningMotivation() {
        logger.info("Triggering Morning AI Nudges...");
        processScheduledNudges("Morning Performance Nudge", "Rise and shine!");
    }

    @Scheduled(cron = "0 30 13 * * *") // Every day at 1:30 PM
    public void scheduleMidDayCheck() {
        logger.info("Triggering Mid-Day AI Nudges...");
        processScheduledNudges("Elite Momentum Check", "Stay consistent!");
    }

    @Scheduled(cron = "0 45 20 * * *") // Every day at 8:45 PM
    public void scheduleEveningReview() {
        logger.info("Triggering Evening AI Nudges...");
        processScheduledNudges("Nightly Recovery Recap", "Reflect and recover.");
    }

    private void processScheduledNudges(String title, String defaultMsg) {
        List<User> premiumUsers = userRepository.findAll().stream()
                .filter(User::isPremium)
                .collect(Collectors.toList());

        for (User user : premiumUsers) {
            try {
                // --- NEURAL MEMORY (CACHING) GUARD ---
                // Check if we already generated this specific nudge for today
                java.time.Instant startOfToday = LocalDate.now().atStartOfDay(java.time.ZoneId.systemDefault()).toInstant();
                boolean alreadySentSlot = notificationRepository.existsByUser_IdAndTitleAndCreatedAtAfter(
                        user.getId(), title, startOfToday);

                if (alreadySentSlot) {
                    logger.info("Neural Cache Hit: {} already sent to user {}. Skipping Groq pulse. 🛡️", title, user.getId());
                    continue;
                }

                String name = user.getName() != null ? user.getName() : "Hero";
                String goal = user.getFitnessGoal() != null ? user.getFitnessGoal().replace("_", " ").toLowerCase() : "wellbeing";
                
                StringBuilder context = new StringBuilder();
                context.append("Current Goal: ").append(goal).append(". ");
                
                // --- GAP DETECTION LOGIC ---
                List<com.wellnest.app.model.WaterIntake> water = trackerService.getWaterForToday(user.getId());
                boolean missingWater = water.isEmpty();
                
                List<com.wellnest.app.model.Meal> meals = trackerService.getMealsForToday(user.getId());
                boolean missingMeals = meals.isEmpty();
                
                // Sleep check (was last night's sleep logged?)
                List<com.wellnest.app.model.SleepLog> sleep = trackerService.getSleepForToday(user.getId()); 
                boolean missingSleep = sleep.isEmpty();

                if (missingSleep) context.append("Aha—it looks like you missed your sleep log last night! ");
                if (missingMeals) context.append("Fuel check! You haven't logged any meals today. Consistency is key. ");
                if (missingWater) context.append("Hydration gap detected—let's hit your target! ");

                String aiMessage = groqService.generateNotification("elite coach", name, context.toString());
                
                if (aiMessage != null && !aiMessage.contains("Error")) {
                    // SENT TO ANDROID AND PERSISTED IN DB (CACHED)
                    createNotification(user.getId(), title, aiMessage, "AI_NUDGE");
                    logger.info("Sent personalized AI nudge (Cached): {} to user {}", title, user.getId());
                }

                // RPM Protection: Biological Jitter
                Thread.sleep(300);
            } catch (Exception e) {
                logger.error("Error processing scheduled nudge for user " + user.getId() + ": " + e.getMessage());
            }
        }
    }
}
