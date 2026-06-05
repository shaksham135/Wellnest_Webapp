package com.wellnest.app.controller;

import com.wellnest.app.dto.ProfileUpdateRequest;
import com.wellnest.app.dto.UpdateTargetWeightRequest;
import com.wellnest.app.dto.UserProfileResponse;
import com.wellnest.app.dto.GoalTargetsDto;
import jakarta.validation.Valid;
import com.wellnest.app.model.User;
import com.wellnest.app.service.UserService;
import com.wellnest.app.model.*;
import com.wellnest.app.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Random;

@RestController
@RequestMapping("/api/users")
@CrossOrigin
public class UserController {

    private final UserService userService;
    private final WorkoutRepository workoutRepository;
    private final MealRepository mealRepository;
    private final WaterIntakeRepository waterIntakeRepository;
    private final SleepLogRepository sleepLogRepository;
    private final DailyActivityRepository dailyActivityRepository;
    private final WeightLogRepository weightLogRepository;
    private final DailyBriefingRepository dailyBriefingRepository;

    public UserController(UserService userService,
                          WorkoutRepository workoutRepository,
                          MealRepository mealRepository,
                          WaterIntakeRepository waterIntakeRepository,
                          SleepLogRepository sleepLogRepository,
                          DailyActivityRepository dailyActivityRepository,
                          WeightLogRepository weightLogRepository,
                          DailyBriefingRepository dailyBriefingRepository) {
        this.userService = userService;
        this.workoutRepository = workoutRepository;
        this.mealRepository = mealRepository;
        this.waterIntakeRepository = waterIntakeRepository;
        this.sleepLogRepository = sleepLogRepository;
        this.dailyActivityRepository = dailyActivityRepository;
        this.weightLogRepository = weightLogRepository;
        this.dailyBriefingRepository = dailyBriefingRepository;
    }

    // GET /api/users/me (optional, for future)
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMe(Authentication auth) {
        String email = auth.getName();
        User user = userService.findByEmail(email).orElseThrow();

        GoalTargetsDto targets = new GoalTargetsDto();
        targets.setTargetSteps(user.getTargetSteps());
        targets.setTargetWaterLiters(user.getTargetWaterLiters());
        targets.setTargetSleepHours(user.getTargetSleepHours());
        targets.setTargetWorkoutsPerWeek(user.getTargetWorkoutsPerWeek());
        targets.setTargetActiveCalories(user.getTargetActiveCalories());
        targets.setTargetDistanceKm(user.getTargetDistanceKm());

        UserProfileResponse dto = new UserProfileResponse(
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getAge(),
                user.getHeightCm(),
                user.getWeightKg(),
                user.getGender(),
                user.getFitnessGoal(),
                user.getPhone(),
                user.isVerified(),
                user.isVerificationRequested(),
                user.isPremium(),
                targets,
                user.getDailyVoiceCount(),
                user.getLastVoiceDate(),
                user.getDailyScanCount(),
                user.getLastScanDate(),
                user.getXp(),
                user.getLevel(),
                user.getCoins(),
                user.getLeague());
        // Shop fields
        dto.setStreakShieldCount(user.getStreakShieldCount());
        dto.setActiveTheme(user.getActiveTheme() != null ? user.getActiveTheme() : "default");
        dto.setXpBoosterActive(user.getXpBoosterExpiry() != null && user.getXpBoosterExpiry().isAfter(java.time.LocalDateTime.now()));
        dto.setHasPremiumBadge(user.isHasPremiumBadge());
        dto.setHasGoldTheme(user.isHasGoldTheme());
        dto.setHasEmeraldTheme(user.isHasEmeraldTheme());
        dto.setSubscriptionPlan(user.getSubscriptionPlan());
        dto.setSubscriptionStatus(user.getSubscriptionStatus());
        dto.setSubscriptionDate(user.getSubscriptionDate());
        dto.setPremiumActivatedAt(user.getPremiumActivatedAt());
        dto.setFirstVoiceLogAt(user.getFirstVoiceLogAt());
        dto.setMaxVoiceCommandsLimit(user.calculateMaxVoiceCommandsLimit());
        dto.setPremiumAccessType(user.getPremiumAccessType() != null ? user.getPremiumAccessType() : "FREE");
        return ResponseEntity.ok(dto);
    }

    // PUT /api/users/me/profile (used by Setup Profile page)
    @PutMapping("/me/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @Valid @RequestBody ProfileUpdateRequest req,
            Authentication auth) {
        String email = auth.getName();
        User user = userService.findByEmail(email).orElseThrow();

        if (req.getWeightKg() != null && !req.getWeightKg().equals(user.getWeightKg())) {
            userService.updateWeight(user, req.getWeightKg());
        } else {
            user.setWeightKg(req.getWeightKg());
        }

        user.setAge(req.getAge());
        user.setHeightCm(req.getHeightCm());
        // Weight set above or in updateWeight
        user.setGender(req.getGender());
        user.setFitnessGoal(req.getFitnessGoal());
        user.setPhone(req.getPhone());

        userService.save(user);

        GoalTargetsDto targets = new GoalTargetsDto();
        targets.setTargetSteps(user.getTargetSteps());
        targets.setTargetWaterLiters(user.getTargetWaterLiters());
        targets.setTargetSleepHours(user.getTargetSleepHours());
        targets.setTargetWorkoutsPerWeek(user.getTargetWorkoutsPerWeek());
        targets.setTargetActiveCalories(user.getTargetActiveCalories());
        targets.setTargetDistanceKm(user.getTargetDistanceKm());

        UserProfileResponse dto = new UserProfileResponse(
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getAge(),
                user.getHeightCm(),
                user.getWeightKg(),
                user.getGender(),
                user.getFitnessGoal(),
                user.getPhone(),
                user.isVerified(),
                user.isVerificationRequested(),
                user.isPremium(),
                targets,
                user.getDailyVoiceCount(),
                user.getLastVoiceDate(),
                user.getDailyScanCount(),
                user.getLastScanDate(),
                user.getXp(),
                user.getLevel(),
                user.getCoins(),
                user.getLeague());
        // Shop fields
        dto.setStreakShieldCount(user.getStreakShieldCount());
        dto.setActiveTheme(user.getActiveTheme() != null ? user.getActiveTheme() : "default");
        dto.setXpBoosterActive(user.getXpBoosterExpiry() != null && user.getXpBoosterExpiry().isAfter(java.time.LocalDateTime.now()));
        dto.setHasPremiumBadge(user.isHasPremiumBadge());
        dto.setHasGoldTheme(user.isHasGoldTheme());
        dto.setHasEmeraldTheme(user.isHasEmeraldTheme());
        dto.setSubscriptionPlan(user.getSubscriptionPlan());
        dto.setSubscriptionStatus(user.getSubscriptionStatus());
        dto.setSubscriptionDate(user.getSubscriptionDate());
        dto.setPremiumActivatedAt(user.getPremiumActivatedAt());
        dto.setFirstVoiceLogAt(user.getFirstVoiceLogAt());
        dto.setMaxVoiceCommandsLimit(user.calculateMaxVoiceCommandsLimit());
        dto.setPremiumAccessType(user.getPremiumAccessType() != null ? user.getPremiumAccessType() : "FREE");
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/me/target-weight")
    public ResponseEntity<Void> updateTargetWeight(
            @RequestBody UpdateTargetWeightRequest req,
            Authentication auth) {
        String email = auth.getName();
        userService.updateTargetWeight(email, req.getTargetWeightKg());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/request-verification")
    public ResponseEntity<?> requestVerification(Authentication authentication) {
        if (authentication == null)
            return ResponseEntity.status(401).build();
        String email = authentication.getName();
        User user = userService.findByEmail(email).orElseThrow();

        user.setVerificationRequested(true);
        userService.save(user);

        return ResponseEntity.ok("Verification requested successfully");
    }

    @PutMapping("/targets")
    public ResponseEntity<Void> updateTargets(@RequestBody GoalTargetsDto req, Authentication auth) {
        String email = auth.getName();
        User user = userService.findByEmail(email).orElseThrow();

        user.setTargetSteps(req.getTargetSteps());
        user.setTargetWaterLiters(req.getTargetWaterLiters());
        user.setTargetSleepHours(req.getTargetSleepHours());
        user.setTargetWorkoutsPerWeek(req.getTargetWorkoutsPerWeek());
        user.setTargetActiveCalories(req.getTargetActiveCalories());
        user.setTargetDistanceKm(req.getTargetDistanceKm());

        userService.save(user);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/me/fcm-token")
    public ResponseEntity<Void> updateFcmToken(@RequestBody java.util.Map<String, String> payload, Authentication auth) {
        String email = auth.getName();
        User user = userService.findByEmail(email).orElseThrow();
        user.setFcmToken(payload.get("token"));
        userService.save(user);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/me/toggle-premium")
    public ResponseEntity<Boolean> togglePremium(Authentication auth) {
        String email = auth.getName();
        User user = userService.findByEmail(email).orElseThrow();
        user.setPremium(!user.isPremium());
        userService.save(user);
        return ResponseEntity.ok(user.isPremium());
    }

    @PostMapping("/shop/purchase")
    public ResponseEntity<java.util.Map<String, Object>> purchaseShopItem(
            @RequestBody java.util.Map<String, String> body,
            Authentication auth) {
        String email = auth.getName();
        User user = userService.findByEmail(email).orElseThrow();
        String itemId = body.get("itemId");
        java.util.Map<String, Object> result = userService.purchaseItem(user, itemId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/me/seed-demo-data")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<UserProfileResponse> seedDemoData(Authentication auth) {
        String email = auth.getName();
        User user = userService.findByEmail(email).orElseThrow();
        Long userId = user.getId();

        // 1. Clean existing records to avoid duplicate or constraint issues
        List<WaterIntake> waterLogs = waterIntakeRepository.findByUserIdOrderByLoggedAtDesc(userId);
        waterIntakeRepository.deleteAll(waterLogs);

        List<Workout> workouts = workoutRepository.findByUserIdOrderByPerformedAtDesc(userId);
        workoutRepository.deleteAll(workouts);

        List<Meal> meals = mealRepository.findByUserIdOrderByLoggedAtDesc(userId);
        mealRepository.deleteAll(meals);

        List<SleepLog> sleepLogs = sleepLogRepository.findByUserIdOrderBySleepDateDesc(userId);
        sleepLogRepository.deleteAll(sleepLogs);

        List<WeightLog> weightLogs = weightLogRepository.findByUserIdOrderByLogDateAsc(userId);
        weightLogRepository.deleteAll(weightLogs);

        List<DailyActivity> dailyActivities = dailyActivityRepository.findByUserId(userId);
        dailyActivityRepository.deleteAll(dailyActivities);

        dailyBriefingRepository.deleteByUser(user);

        // 2. Seed 7 days of data
        LocalDate today = LocalDate.now();
        Random rand = new Random();
        Double baseWeight = user.getWeightKg() != null ? user.getWeightKg() : 72.0;

        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            Instant instant = date.atStartOfDay(ZoneOffset.UTC).toInstant().plusSeconds(3600 * 12); // Noon

            // A. Seed Daily Activity
            Integer steps = 7000 + rand.nextInt(4500); // 7000 to 11500
            Integer activeCals = (int) (steps * 0.04);
            Double distKm = steps * 0.00075;
            DailyActivity act = new DailyActivity(user, date, steps, activeCals, distKm);
            dailyActivityRepository.save(act);

            // B. Seed Water Intake
            WaterIntake water = new WaterIntake();
            water.setUserId(userId);
            water.setLiters(2.0 + rand.nextInt(6) * 0.25); // 2.0L to 3.25L
            water.setLoggedAt(instant);
            waterIntakeRepository.save(water);

            // C. Seed Sleep
            SleepLog sleep = new SleepLog();
            sleep.setUser(user);
            sleep.setHours(6.5 + rand.nextInt(5) * 0.5); // 6.5h to 8.5h
            sleep.setSleepDate(instant.minusSeconds(3600 * 8)); // Morning
            sleep.setQuality(rand.nextBoolean() ? "GOOD" : "EXCELLENT");
            sleep.setNotes("Slept well. Woke up feeling energized.");
            sleepLogRepository.save(sleep);

            // D. Seed Workout (every other day)
            if (i % 2 == 0) {
                Workout workout = new Workout();
                workout.setUserId(userId);
                workout.setType(rand.nextBoolean() ? "Cardio" : "Strength");
                workout.setDurationMinutes(30 + rand.nextInt(31)); // 30 to 60 mins
                workout.setCaloriesBurned(200 + rand.nextInt(201)); // 200 to 400 kcal
                workout.setPerformedAt(instant.plusSeconds(3600 * 4)); // Late afternoon
                workout.setNotes("Solid session. Felt strong.");
                workoutRepository.save(workout);
            }

            // E. Seed Meals
            // Breakfast
            Meal breakfast = new Meal();
            breakfast.setUserId(userId);
            breakfast.setMealType("BREAKFAST");
            breakfast.setCalories(350 + rand.nextInt(151)); // 350 to 500
            breakfast.setProtein(15 + rand.nextInt(16)); // 15 to 30g
            breakfast.setCarbs(35 + rand.nextInt(21));
            breakfast.setFats(10 + rand.nextInt(11));
            breakfast.setLoggedAt(instant.minusSeconds(3600 * 4));
            mealRepository.save(breakfast);

            // Lunch
            Meal lunch = new Meal();
            lunch.setUserId(userId);
            lunch.setMealType("LUNCH");
            lunch.setCalories(550 + rand.nextInt(201)); // 550 to 750
            lunch.setProtein(25 + rand.nextInt(21));
            lunch.setCarbs(60 + rand.nextInt(31));
            lunch.setFats(15 + rand.nextInt(11));
            lunch.setLoggedAt(instant);
            mealRepository.save(lunch);

            // Dinner
            Meal dinner = new Meal();
            dinner.setUserId(userId);
            dinner.setMealType("DINNER");
            dinner.setCalories(450 + rand.nextInt(201)); // 450 to 650
            dinner.setProtein(20 + rand.nextInt(21));
            dinner.setCarbs(50 + rand.nextInt(31));
            dinner.setFats(12 + rand.nextInt(11));
            dinner.setLoggedAt(instant.plusSeconds(3600 * 6));
            mealRepository.save(dinner);

            // F. Seed Weight (gradual decline)
            Double weightOffset = (double) i * 0.15; // gradual loss down to today
            WeightLog weight = new WeightLog(user, baseWeight + weightOffset, date);
            weightLogRepository.save(weight);
        }

        // 3. Set Gamification Metrics
        user.setLevel(5);
        user.setXp(120);
        user.setCoins(250);
        user.setLeague("Silver");
        user.setStreakShieldCount(2);
        userService.save(user);

        return getMe(auth);
    }
}
