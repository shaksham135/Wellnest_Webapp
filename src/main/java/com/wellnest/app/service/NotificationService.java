package com.wellnest.app.service;

import com.wellnest.app.model.Notification;
import com.wellnest.app.model.User;
import com.wellnest.app.repository.NotificationRepository;
import com.wellnest.app.repository.UserRepository;
import org.springframework.stereotype.Service;

import com.wellnest.app.model.DailyActivity;
import java.time.LocalDate;
import java.time.LocalDateTime;
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

    private static final String[] STATIC_WATER_NUDGES = {
        "Hey %s! Hydration check! Your body needs water to function at its best. Grab a glass! 🚰",
        "Performance alert, %s! 💦 Drinking enough water keeps energy high and fatigue low. Log your water now!",
        "Water check, %s! Fuel your performance with pure hydration. Let's hit that daily target! 🌊"
    };

    private static final String[] STATIC_MEAL_NUDGES = {
        "Fuel check, %s! You haven't logged any meals today. Consistency in nutrition is key to your growth! 🍽️",
        "Hey %s! Track your nutrition to stay on top of your macros. Let's log your food today! 🍳",
        "Energy check, %s! Keep your metabolism active by logging your meals. What did you eat today? 🥗"
    };

    private static final String[] STATIC_SLEEP_NUDGES = {
        "Rise and shine, %s! Did you get enough rest? Don't forget to log your sleep last night! 😴",
        "Recovery check, %s! Quality sleep is where the magic happens. How many hours did you rest? 💤",
        "Hey %s! Log your sleep last night to analyze your recovery score today. Keep the momentum high! 🌙"
    };

    private static final String[] STATIC_ALL_LOGGED_NUDGES = {
        "Sensational work, %s! You've logged sleep, meals, and water today. You are operating at peak efficiency! 🏆",
        "Boom! %s, all trackers logged today. You're building a bulletproof habit loop! Keep it up. 🚀",
        "Perfect compliance, %s! Rest, fuel, and hydration are all logged. You're winning today! 🌟"
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
        List<User> targetUsers;
        if ("PREMIUM".equalsIgnoreCase(targetGroup)) {
            targetUsers = userRepository.findByIsPremiumTrue();
        } else if ("FREE".equalsIgnoreCase(targetGroup)) {
            targetUsers = userRepository.findAll().stream().filter(u -> !u.isPremium() && (u.getRole() == null || u.getRole().contains("USER"))).collect(Collectors.toList());
        } else if ("TRAINERS".equalsIgnoreCase(targetGroup)) {
            targetUsers = userRepository.findByRole("ROLE_TRAINER");
        } else {
            targetUsers = userRepository.findAll(); // Fallback for ALL
        }

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
        List<User> premiumUsers = userRepository.findByIsPremiumTrue();

        for (User user : premiumUsers) {
            try {
                // --- ACTIVE-USER FILTERING (48 Hours) ---
                if (!isUserActiveInLast48Hours(user)) {
                    logger.info("User {} is inactive in the last 48 hours. Skipping AI cron nudge. 💤", user.getId());
                    continue;
                }

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

                int missingCount = 0;
                if (missingSleep) missingCount++;
                if (missingMeals) missingCount++;
                if (missingWater) missingCount++;

                String nudgeMessage = null;

                if (missingCount == 0) {
                    // Hybrid optimization: 0 tokens used
                    int index = (int) (Math.random() * STATIC_ALL_LOGGED_NUDGES.length);
                    nudgeMessage = String.format(STATIC_ALL_LOGGED_NUDGES[index], name);
                    logger.info("Hybrid Nudge (0-token All Logged) generated for user {}", user.getId());
                } else if (missingCount == 1) {
                    // Hybrid optimization: 0 tokens used
                    if (missingWater) {
                        int index = (int) (Math.random() * STATIC_WATER_NUDGES.length);
                        nudgeMessage = String.format(STATIC_WATER_NUDGES[index], name);
                    } else if (missingMeals) {
                        int index = (int) (Math.random() * STATIC_MEAL_NUDGES.length);
                        nudgeMessage = String.format(STATIC_MEAL_NUDGES[index], name);
                    } else if (missingSleep) {
                        int index = (int) (Math.random() * STATIC_SLEEP_NUDGES.length);
                        nudgeMessage = String.format(STATIC_SLEEP_NUDGES[index], name);
                    }
                    logger.info("Hybrid Nudge (0-token Single Gap) generated for user {}", user.getId());
                } else {
                    // Call Groq (complex multi-parameter alert)
                    if (missingSleep) context.append("Aha—it looks like you missed your sleep log last night! ");
                    if (missingMeals) context.append("Fuel check! You haven't logged any meals today. Consistency is key. ");
                    if (missingWater) context.append("Hydration gap detected—let's hit your target! ");

                    nudgeMessage = groqService.generateNotification("elite coach", name, context.toString());
                }
                
                if (nudgeMessage != null && !nudgeMessage.contains("Error")) {
                    // SENT TO ANDROID AND PERSISTED IN DB (CACHED)
                    createNotification(user.getId(), title, nudgeMessage, "AI_NUDGE");
                    logger.info("Sent personalized AI nudge (Cached): {} to user {}", title, user.getId());
                }

                // RPM Protection: Biological Jitter
                Thread.sleep(300);
            } catch (Exception e) {
                logger.error("Error processing scheduled nudge for user " + user.getId() + ": " + e.getMessage());
            }
        }
    }

    private boolean isUserActiveInLast48Hours(User user) {
        LocalDate today = LocalDate.now();
        LocalDate twoDaysAgo = today.minusDays(2);
        
        // 1. Check user chat/voice/scan dates
        if (user.getLastChatDate() != null && !user.getLastChatDate().isBefore(twoDaysAgo)) return true;
        if (user.getLastVoiceDate() != null && !user.getLastVoiceDate().isBefore(twoDaysAgo)) return true;
        if (user.getLastScanDate() != null && !user.getLastScanDate().isBefore(twoDaysAgo)) return true;
        
        // 2. Check if they have logged daily activities in the last 2 days
        try {
            List<DailyActivity> activities = trackerService.getDailyActivities(user.getId(), twoDaysAgo, today);
            if (activities != null && !activities.isEmpty()) {
                for (DailyActivity act : activities) {
                    if ((act.getSteps() != null && act.getSteps() > 0) || 
                        (act.getActiveCalories() != null && act.getActiveCalories() > 0) ||
                        (act.getDistanceKm() != null && act.getDistanceKm() > 0)) {
                        return true;
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Error checking active-user daily activities: " + e.getMessage());
        }
        
        // 3. Fallback: check if they have registered/created recently
        if (user.getCreatedAt() != null) {
            LocalDateTime twoDaysAgoLDT = LocalDateTime.now().minusDays(2);
            if (user.getCreatedAt().isAfter(twoDaysAgoLDT)) {
                return true;
            }
        }
        
        return false;
    }
}
