package com.wellnest.app.service;

import com.wellnest.app.model.Notification;
import com.wellnest.app.model.User;
import com.wellnest.app.repository.NotificationRepository;
import com.wellnest.app.repository.UserRepository;
import org.springframework.stereotype.Service;

import com.wellnest.app.model.DailyActivity;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Instant;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

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

    private static final String[] PREMIUM_WEIGHT_LOSS_TIPS = {
        "High-protein meals and neat activities like standing more are perfect for fat loss goals. Keep active, %s! 💪",
        "Fat loss tip: A slight calorie deficit combined with daily step targets works wonders. Have you walked yet, %s? 🚶‍♂️",
        "Premium Tip, %s: Drink water before meals to stay satiated and avoid overeating today! 🚰",
        "Fat loss focus, %s: Combine resistance training with solid sleep to protect muscle while losing fat! 🏋️‍♂️",
        "Keep consistency high! Fat loss is a marathon. Track all your meals today to stay on plan, %s! 🥗"
    };

    private static final String[] PREMIUM_MUSCLE_GAIN_TIPS = {
        "Muscle gain tip, %s: Aim for 1.6g - 2.2g of protein per kg of body weight today! Log your protein. 🥩",
        "Premium Coach: Progressive overload in your workouts is the key to building lean muscle. Push hard, %s! 🏋️‍♂️",
        "Muscle building: Don't skip post-workout nutrition. Carbs and protein are vital for recovery, %s! 🍳",
        "Recovery focus, %s: Muscles grow when you rest, not just when you train. Get 8 hours of solid sleep tonight! 😴",
        "Muscle Tip: Stay hydrated to keep muscle fullness and strength optimal during your lifts, %s! 💧"
    };

    private static final String[] PREMIUM_ENDURANCE_TIPS = {
        "Endurance check, %s: Ensure your electrolyte balance is optimal, especially on high activity days! ⚡",
        "Premium Coach: Aerobic base building takes time. Keep your heart rate in Zone 2 for long runs, %s! 🏃‍♂️",
        "Fueling for performance: Complex carbohydrates are your best friend for sustained energy today, %s! 🍝",
        "Rest day logic, %s: Active recovery like light yoga or walking helps flush lactic acid. Stay mobile! 🧘‍♂️",
        "Hydration is key: Dehydration by just 2%% can significantly drop athletic performance. Keep drinking water, %s! 🚰"
    };

    private static final String[] PREMIUM_GENERAL_TIPS = {
        "Premium Coach: Wellness starts with daily consistency in tracking sleep, nutrition, and steps, %s! 🌟",
        "Healthy mind, %s: A 5-minute mindfulness breathing session can dramatically reduce cortisol and stress. 🧘‍♀️",
        "Hydration boost: Water flushes toxins and boosts cognitive focus. Get your glass now, %s! 💧",
        "Consistent habits build lives. What small health habit can you win today, %s? 🚀",
        "Better sleep quality leads to better cognitive performance and mood. Prioritize your sleep tonight, %s! 🌙"
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
            String goal = user.getFitnessGoal() != null ? user.getFitnessGoal().replace("_", " ").toLowerCase() : "wellbeing";

            String tip;
            String title = "Daily Health Tip";

            if (user.isPremium()) {
                title = "Your Premium Coach Nudge";
                String[] tipArray;
                if (goal.contains("loss") || goal.contains("weight") || goal.contains("fat")) {
                    tipArray = PREMIUM_WEIGHT_LOSS_TIPS;
                } else if (goal.contains("gain") || goal.contains("muscle") || goal.contains("bulk")) {
                    tipArray = PREMIUM_MUSCLE_GAIN_TIPS;
                } else if (goal.contains("endurance") || goal.contains("cardio") || goal.contains("run")) {
                    tipArray = PREMIUM_ENDURANCE_TIPS;
                } else {
                    tipArray = PREMIUM_GENERAL_TIPS;
                }
                int index = (int) (Math.random() * tipArray.length);
                tip = "🏆 " + String.format(tipArray[index], name);
            } else {
                // Normal User: Standard Tip + Upsell
                int index = (int) (Math.random() * STATIC_TIPS.length);
                tip = STATIC_TIPS[index] + "\n\n✨ Upgrade to Wellnest Premium for personalized AI coaching!";
            }
            
            if (tip == null || tip.length() > 300) tip = STATIC_TIPS[0];

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
        logger.info("Triggering Morning Nudges...");
        processMorningMotivation();
    }

    @Scheduled(cron = "0 30 13 * * *") // Every day at 1:30 PM
    public void scheduleMidDayCheck() {
        logger.info("Triggering Mid-Day Nudges...");
        processMidDayCheck();
    }

    @Scheduled(cron = "0 45 20 * * *") // Every day at 8:45 PM
    public void scheduleEveningReview() {
        logger.info("Triggering Evening Nudges...");
        processEveningReview();
    }

    private void processMorningMotivation() {
        Pageable pageable = PageRequest.of(0, 100);
        Page<User> page;
        do {
            page = userRepository.findAll(pageable);
            for (User user : page.getContent()) {
                try {
                    if (!isUserActiveInLast48Hours(user)) {
                        continue;
                    }

                    String title = "Morning Performance Nudge";
                    java.time.Instant startOfToday = LocalDate.now().atStartOfDay(java.time.ZoneId.systemDefault()).toInstant();
                    if (notificationRepository.existsByUser_IdAndTitleAndCreatedAtAfter(user.getId(), title, startOfToday)) {
                        continue;
                    }

                    boolean sleepLogged = !trackerService.getSleepForToday(user.getId()).isEmpty();
                    String name = user.getName() != null ? user.getName() : "Hero";
                    String message;

                    if (!sleepLogged) {
                        int index = (int) (Math.random() * STATIC_SLEEP_NUDGES.length);
                        message = String.format(STATIC_SLEEP_NUDGES[index], name);
                    } else {
                        boolean waterLogged = !trackerService.getWaterForToday(user.getId()).isEmpty();
                        if (!waterLogged) {
                            message = String.format("Good morning, %s! Sleep logged successfully! Let's start the day strong by drinking a glass of water. 💧", name);
                        } else {
                            message = String.format("Good morning, %s! Sleep logged successfully! Remember to fuel up with a healthy breakfast. 🍳", name);
                        }
                    }

                    createNotification(user.getId(), title, message, "TRACKING_REMINDER");
                    Thread.sleep(100);
                } catch (Exception e) {
                    logger.error("Error processing morning motivation for user " + user.getId() + ": " + e.getMessage());
                }
            }
            pageable = pageable.next();
        } while (page.hasNext());
    }

    private void processMidDayCheck() {
        Pageable pageable = PageRequest.of(0, 100);
        Page<User> page;
        do {
            page = userRepository.findAll(pageable);
            for (User user : page.getContent()) {
                try {
                    if (!isUserActiveInLast48Hours(user)) {
                        continue;
                    }

                    String title = "Elite Momentum Check";
                    java.time.Instant startOfToday = LocalDate.now().atStartOfDay(java.time.ZoneId.systemDefault()).toInstant();
                    if (notificationRepository.existsByUser_IdAndTitleAndCreatedAtAfter(user.getId(), title, startOfToday)) {
                        continue;
                    }

                    boolean waterLogged = !trackerService.getWaterForToday(user.getId()).isEmpty();
                    boolean mealsLogged = !trackerService.getMealsForToday(user.getId()).isEmpty();
                    String name = user.getName() != null ? user.getName() : "Hero";
                    String message;

                    if (!waterLogged || !mealsLogged) {
                        if (!mealsLogged) {
                            int index = (int) (Math.random() * STATIC_MEAL_NUDGES.length);
                            message = String.format(STATIC_MEAL_NUDGES[index], name);
                        } else {
                            int index = (int) (Math.random() * STATIC_WATER_NUDGES.length);
                            message = String.format(STATIC_WATER_NUDGES[index], name);
                        }
                    } else {
                        message = String.format("Great job on logging your meals, %s! How is your step target looking today? Keep moving! 🚶‍♂️", name);
                    }

                    createNotification(user.getId(), title, message, "TRACKING_REMINDER");
                    Thread.sleep(100);
                } catch (Exception e) {
                    logger.error("Error processing mid-day check for user " + user.getId() + ": " + e.getMessage());
                }
            }
            pageable = pageable.next();
        } while (page.hasNext());
    }

    private void processEveningReview() {
        Pageable pageable = PageRequest.of(0, 100);
        Page<User> page;
        do {
            page = userRepository.findAll(pageable);
            for (User user : page.getContent()) {
                try {
                    if (!isUserActiveInLast48Hours(user)) {
                        continue;
                    }

                    String title = "Nightly Recovery Recap";
                    java.time.Instant startOfToday = LocalDate.now().atStartOfDay(java.time.ZoneId.systemDefault()).toInstant();
                    if (notificationRepository.existsByUser_IdAndTitleAndCreatedAtAfter(user.getId(), title, startOfToday)) {
                        continue;
                    }

                    boolean missingWater = trackerService.getWaterForToday(user.getId()).isEmpty();
                    boolean missingMeals = trackerService.getMealsForToday(user.getId()).isEmpty();
                    boolean missingSleep = trackerService.getSleepForToday(user.getId()).isEmpty();

                    boolean missingWorkout = true;
                    List<com.wellnest.app.model.Workout> workouts = trackerService.getWorkoutsForToday(user.getId());
                    if (workouts != null && !workouts.isEmpty()) {
                        missingWorkout = false;
                    } else {
                        List<DailyActivity> activities = trackerService.getDailyActivities(user.getId(), LocalDate.now(), LocalDate.now());
                        if (activities != null && !activities.isEmpty()) {
                            for (DailyActivity act : activities) {
                                if (act.getSteps() != null && act.getSteps() > 0) {
                                    missingWorkout = false;
                                    break;
                                }
                            }
                        }
                    }

                    int missingCount = 0;
                    if (missingSleep) missingCount++;
                    if (missingMeals) missingCount++;
                    if (missingWater) missingCount++;
                    if (missingWorkout) missingCount++;

                    String name = user.getName() != null ? user.getName() : "Hero";
                    String message = null;

                    if (missingCount == 0) {
                        int index = (int) (Math.random() * STATIC_ALL_LOGGED_NUDGES.length);
                        message = String.format(STATIC_ALL_LOGGED_NUDGES[index], name);
                    } else {
                        if (user.isPremium()) {
                            String goal = user.getFitnessGoal() != null ? user.getFitnessGoal().replace("_", " ").toLowerCase() : "wellbeing";
                            String role = user.getRole() != null ? user.getRole().replace("ROLE_", "").toLowerCase() : "user";
                            StringBuilder context = new StringBuilder();
                            context.append("Goal: ").append(goal).append(". ");
                            context.append("Today's log completion: ");
                            if (!missingSleep) context.append("Sleep logged. ");
                            else context.append("Sleep NOT logged. ");
                            if (!missingMeals) context.append("Meals logged. ");
                            else context.append("Meals NOT logged. ");
                            if (!missingWater) context.append("Water logged. ");
                            else context.append("Water NOT logged. ");
                            if (!missingWorkout) context.append("Workout/Activity logged. ");
                            else context.append("Workout/Activity NOT logged. ");

                            message = groqService.generateNotification(role, name, context.toString());
                        }

                        if (message == null || message.contains("Error")) {
                            List<String> missingItems = new ArrayList<>();
                            if (missingWater) missingItems.add("water 🚰");
                            if (missingWorkout) missingItems.add("workout/activity 🏃‍♂️");
                            if (missingMeals) missingItems.add("meals 🍽️");
                            if (missingSleep) missingItems.add("sleep 😴");

                            String missingStr = "";
                            if (missingItems.size() == 1) {
                                missingStr = missingItems.get(0);
                            } else if (missingItems.size() == 2) {
                                missingStr = missingItems.get(0) + " and " + missingItems.get(1);
                            } else {
                                for (int i = 0; i < missingItems.size(); i++) {
                                    if (i == missingItems.size() - 1) {
                                        missingStr += "and " + missingItems.get(i);
                                    } else {
                                        missingStr += missingItems.get(i) + ", ";
                                    }
                                }
                            }
                            message = String.format("Hey %s! Let's keep your streak alive. Don't forget to log your %s before bed! 🚀", name, missingStr);
                        }
                    }

                    createNotification(user.getId(), title, message, "AI_NUDGE");
                    Thread.sleep(100);
                } catch (Exception e) {
                    logger.error("Error processing evening review for user " + user.getId() + ": " + e.getMessage());
                }
            }
            pageable = pageable.next();
        } while (page.hasNext());
    }

    private boolean isUserActiveInLast48Hours(User user) {
        LocalDate today = LocalDate.now();
        LocalDate twoDaysAgo = today.minusDays(2);
        
        if (user.getLastChatDate() != null && !user.getLastChatDate().isBefore(twoDaysAgo)) return true;
        if (user.getLastVoiceDate() != null && !user.getLastVoiceDate().isBefore(twoDaysAgo)) return true;
        if (user.getLastScanDate() != null && !user.getLastScanDate().isBefore(twoDaysAgo)) return true;
        
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
        
        if (user.getCreatedAt() != null) {
            LocalDateTime twoDaysAgoLDT = LocalDateTime.now().minusDays(2);
            if (user.getCreatedAt().isAfter(twoDaysAgoLDT)) {
                return true;
            }
        }
        
        return false;
    }
}
