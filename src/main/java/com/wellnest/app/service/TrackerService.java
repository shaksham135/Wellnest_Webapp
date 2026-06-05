package com.wellnest.app.service;

import com.wellnest.app.dto.MealDto;
import com.wellnest.app.dto.SleepLogDto;
import com.wellnest.app.dto.WaterIntakeDto;
import com.wellnest.app.dto.WorkoutDto;
import com.wellnest.app.model.Meal;
import com.wellnest.app.model.SleepLog;
import com.wellnest.app.model.WaterIntake;
import com.wellnest.app.model.Workout;
import com.wellnest.app.repository.MealRepository;
import com.wellnest.app.repository.SleepLogRepository;
import com.wellnest.app.repository.WaterIntakeRepository;
import com.wellnest.app.repository.WorkoutRepository;
import com.wellnest.app.repository.DailyActivityRepository;
import com.wellnest.app.model.DailyActivity;
import com.wellnest.app.dto.DailyActivityDto;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

import com.wellnest.app.repository.UserActivityLogRepository;
import com.wellnest.app.model.UserActivityLog;
import com.wellnest.app.repository.UserRepository;
import com.wellnest.app.service.UserService;
import com.wellnest.app.util.TimezoneUtil;

@Service
public class TrackerService {

    private final WorkoutRepository workoutRepository;
    private final MealRepository mealRepository;
    private final WaterIntakeRepository waterIntakeRepository;
    private final SleepLogRepository sleepLogRepository;
    private final DailyActivityRepository dailyActivityRepository;
    private final UserActivityLogRepository userActivityLogRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    public TrackerService(WorkoutRepository workoutRepository,
            MealRepository mealRepository,
            WaterIntakeRepository waterIntakeRepository,
            SleepLogRepository sleepLogRepository,
            DailyActivityRepository dailyActivityRepository,
            UserActivityLogRepository userActivityLogRepository,
            UserRepository userRepository,
            UserService userService) {
        this.workoutRepository = workoutRepository;
        this.mealRepository = mealRepository;
        this.waterIntakeRepository = waterIntakeRepository;
        this.sleepLogRepository = sleepLogRepository;
        this.dailyActivityRepository = dailyActivityRepository;
        this.userActivityLogRepository = userActivityLogRepository;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    // -------------------- WORKOUT --------------------

    /**
     * Create a workout for the given userId. DTO's userId is ignored.
     */
    public Workout createWorkoutForUser(Long userId, WorkoutDto dto) {
        Assert.notNull(userId, "userId is required");
        Assert.notNull(dto, "workout dto is required");

        // Enforce Limit: Max 2 workouts per day
        Instant startOfDay = LocalDate.now().atStartOfDay(ZoneOffset.UTC).toInstant();
        long todayCount = workoutRepository.findByUserIdOrderByPerformedAtDesc(userId).stream()
                .filter(w -> w.getPerformedAt().isAfter(startOfDay))
                .count();

        if (todayCount >= 2) {
            throw new IllegalArgumentException("Daily Limit Reached: You can only log 2 workouts per day.");
        }

        if (dto.getDurationMinutes() != null && (dto.getDurationMinutes() > 180 || dto.getDurationMinutes() < 5)) {
            throw new IllegalArgumentException("Invalid Duration: Workout duration must be between 5 and 180 minutes (3 hours).");
        }
        if (dto.getCaloriesBurned() != null && dto.getCaloriesBurned() > 5000) {
            throw new IllegalArgumentException("Invalid Calories: Max calories per workout is 5000 kcal.");
        }

        Workout workout = new Workout();
        workout.setUserId(userId);
        workout.setType(dto.getType());
        workout.setDurationMinutes(dto.getDurationMinutes());
        workout.setCaloriesBurned(dto.getCaloriesBurned());
        workout.setPerformedAt(dto.getPerformedAt() != null ? dto.getPerformedAt() : Instant.now());
        workout.setNotes(dto.getNotes());

        Workout saved = workoutRepository.save(workout);
        recordActiveEngagement(userId);

        com.wellnest.app.model.User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            int duration = dto.getDurationMinutes() != null ? dto.getDurationMinutes() : 30;
            int xp = 5 + (duration / 5);
            userService.addXp(user, xp);
        }

        return saved;
    }

    public Workout updateWorkoutForUser(Long userId, Long workoutId, WorkoutDto dto) {
        Assert.notNull(userId, "userId is required");
        Assert.notNull(workoutId, "workoutId is required");
        Assert.notNull(dto, "workout DTO is required");

        Workout workout = workoutRepository.findById(workoutId)
                .orElseThrow(() -> new IllegalArgumentException("Workout not found"));
        if (!workout.getUserId().equals(userId)) {
            throw new SecurityException("Not authorized to update this workout");
        }

        if (dto.getDurationMinutes() != null && (dto.getDurationMinutes() > 180 || dto.getDurationMinutes() < 5)) {
            throw new IllegalArgumentException("Invalid Duration: Workout duration must be between 5 and 180 minutes (3 hours).");
        }
        if (dto.getCaloriesBurned() != null && dto.getCaloriesBurned() > 5000) {
            throw new IllegalArgumentException("Invalid Calories: Max calories per workout is 5000 kcal.");
        }

        workout.setType(dto.getType());
        workout.setDurationMinutes(dto.getDurationMinutes());
        workout.setCaloriesBurned(dto.getCaloriesBurned());
        workout.setNotes(dto.getNotes());
        if (dto.getPerformedAt() != null) {
            workout.setPerformedAt(dto.getPerformedAt());
        }
        Workout saved = workoutRepository.save(workout);
        recordActiveEngagement(userId);
        return saved;
    }

    public List<Workout> getWorkoutsForUser(Long userId) {
        Assert.notNull(userId, "userId is required");
        return workoutRepository.findByUserIdOrderByPerformedAtDesc(userId);
    }

    public void deleteWorkout(Long userId, Long workoutId) {
        Assert.notNull(userId, "userId is required");
        Assert.notNull(workoutId, "workoutId is required");
        Workout w = workoutRepository.findById(workoutId)
                .orElseThrow(() -> new RuntimeException("Workout not found"));
        if (!w.getUserId().equals(userId)) {
            throw new RuntimeException("Not authorized to delete this workout");
        }
        workoutRepository.delete(w);
    }

    // -------------------- MEAL --------------------

    public Meal createMealForUser(Long userId, MealDto dto) {
        Assert.notNull(userId, "userId is required");
        Assert.notNull(dto, "meal dto is required");

        // Enforce Limit: Max 1 entry per Meal Type per day (Exempt: SNACK)
        java.time.ZoneOffset zoneOffset = TimezoneUtil.getClientZoneOffset();
        Instant startOfDay = LocalDate.now(zoneOffset).atStartOfDay(zoneOffset).toInstant();
        boolean alreadyLoggedType = mealRepository.findByUserIdOrderByLoggedAtDesc(userId).stream()
                .filter(m -> m.getLoggedAt().isAfter(startOfDay))
                .anyMatch(m -> m.getMealType().equalsIgnoreCase(dto.getMealType()));

        if (alreadyLoggedType && !dto.getMealType().equalsIgnoreCase("SNACK")) {
            throw new IllegalArgumentException(
                    "Daily Limit Reached: You have already logged " + dto.getMealType() + " today. Use 'Snack' for any extra small meals!");
        }

        if (dto.getCalories() != null && (dto.getCalories() > 3000 || dto.getCalories() < 10)) {
            throw new IllegalArgumentException("Invalid Calories: Calories per meal must be between 10 and 3000 kcal.");
        }

        Meal meal = new Meal();
        meal.setUserId(userId);
        meal.setMealType(dto.getMealType());
        meal.setCalories(dto.getCalories());
        meal.setProtein(dto.getProtein());
        meal.setCarbs(dto.getCarbs());
        meal.setFats(dto.getFats());
        meal.setLoggedAt(dto.getLoggedAt() != null ? dto.getLoggedAt() : java.time.Instant.now());
        meal.setNotes(dto.getNotes());

        Meal saved = mealRepository.save(meal);
        recordActiveEngagement(userId);

        com.wellnest.app.model.User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            int protein = dto.getProtein() != null ? dto.getProtein() : 0;
            int xp = 5 + (protein > 0 ? Math.min(5, protein / 10) : 0);
            userService.addXp(user, xp);
        }

        return saved;
    }

    public Meal updateMealForUser(Long userId, Long mealId, MealDto dto) {
        Assert.notNull(userId, "userId is required");
        Assert.notNull(mealId, "mealId is required");
        Assert.notNull(dto, "meal DTO is required");

        Meal meal = mealRepository.findById(mealId)
                .orElseThrow(() -> new IllegalArgumentException("Meal not found"));
        if (!meal.getUserId().equals(userId)) {
            throw new SecurityException("Not authorized to update this meal");
        }

        if (dto.getCalories() != null && (dto.getCalories() > 3000 || dto.getCalories() < 10)) {
            throw new IllegalArgumentException("Invalid Calories: Calories per meal must be between 10 and 3000 kcal.");
        }

        meal.setMealType(dto.getMealType());
        meal.setCalories(dto.getCalories());
        meal.setProtein(dto.getProtein());
        meal.setCarbs(dto.getCarbs());
        meal.setFats(dto.getFats());
        meal.setNotes(dto.getNotes());
        if (dto.getLoggedAt() != null) {
            meal.setLoggedAt(dto.getLoggedAt());
        }
        Meal saved = mealRepository.save(meal);
        recordActiveEngagement(userId);
        return saved;
    }

    public List<Meal> getMealsForUser(Long userId) {
        Assert.notNull(userId, "userId is required");
        return mealRepository.findByUserIdOrderByLoggedAtDesc(userId);
    }

    public void deleteMeal(Long userId, Long mealId) {
        Assert.notNull(userId, "userId is required");
        Assert.notNull(mealId, "mealId is required");
        Meal m = mealRepository.findById(mealId)
                .orElseThrow(() -> new RuntimeException("Meal not found"));
        if (!m.getUserId().equals(userId)) {
            throw new RuntimeException("Not authorized to delete this meal");
        }
        mealRepository.delete(m);
    }

    // -------------------- WATER --------------------

    public WaterIntake createWaterForUser(Long userId, WaterIntakeDto dto) {
        Assert.notNull(userId, "userId is required");
        Assert.notNull(dto, "water dto is required");

        Double litersObj = dto.getLiters();
        double inputLiters = litersObj != null ? litersObj : 0.25;

        // Enforce Limit: Max 10 Liters Total per day
        java.time.ZoneOffset zoneOffset = TimezoneUtil.getClientZoneOffset();
        Instant startOfDay = LocalDate.now(zoneOffset).atStartOfDay(zoneOffset).toInstant();
        final double finalInputLiters = inputLiters;
        double todayTotal = waterIntakeRepository.findByUserIdOrderByLoggedAtDesc(userId).stream()
                .filter(w -> w.getLoggedAt().isAfter(startOfDay))
                .mapToDouble(WaterIntake::getLiters)
                .sum();

        if (todayTotal + finalInputLiters > 10.0) {
            throw new IllegalArgumentException("Daily Limit Reached: You cannot log more than 10L of water per day.");
        }

        if (finalInputLiters < 0.05 || finalInputLiters > 2.0) {
            throw new IllegalArgumentException("Invalid Quantity: Water logged at once must be between 0.05L (50ml) and 2.0L.");
        }

        WaterIntake water = new WaterIntake();
        water.setUserId(userId);
        water.setLiters(finalInputLiters);
        water.setLoggedAt(dto.getLoggedAt() != null ? dto.getLoggedAt() : Instant.now());
        water.setNotes(dto.getNotes());

        WaterIntake saved = waterIntakeRepository.save(water);
        recordActiveEngagement(userId);

        com.wellnest.app.model.User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            double liters = saved.getLiters();
            int logXp = 2 + (int) Math.round(liters * 4.0);
            double target = user.getTargetWaterLiters() != null ? user.getTargetWaterLiters() : 2.0;
            double todayTotalAfter = getWaterForToday(userId).stream()
                    .mapToDouble(WaterIntake::getLiters)
                    .sum();
            if (todayTotalAfter >= target && (todayTotalAfter - liters < target)) {
                userService.addXp(user, logXp + 15);
            } else {
                userService.addXp(user, logXp);
            }
        }

        return saved;
    }

    public WaterIntake updateWaterForUser(Long userId, Long waterId, WaterIntakeDto dto) {
        Assert.notNull(userId, "userId is required");
        Assert.notNull(waterId, "waterId is required");
        Assert.notNull(dto, "water DTO is required");

        WaterIntake water = waterIntakeRepository.findById(waterId)
                .orElseThrow(() -> new IllegalArgumentException("Water log not found"));
        if (!water.getUserId().equals(userId)) {
            throw new SecurityException("Not authorized to update this water log");
        }

        double inputLiters = dto.getLiters();
        if (inputLiters < 0.05 || inputLiters > 2.0) {
            throw new IllegalArgumentException("Invalid Quantity: Water logged at once must be between 0.05L (50ml) and 2.0L.");
        }

        water.setLiters(inputLiters);
        water.setNotes(dto.getNotes());
        if (dto.getLoggedAt() != null) {
            water.setLoggedAt(dto.getLoggedAt());
        }
        WaterIntake saved = waterIntakeRepository.save(water);
        recordActiveEngagement(userId);
        return saved;
    }

    public List<WaterIntake> getWaterForUser(Long userId) {
        Assert.notNull(userId, "userId is required");
        return waterIntakeRepository.findByUserIdOrderByLoggedAtDesc(userId);
    }

    public void deleteWater(Long userId, Long waterId) {
        Assert.notNull(userId, "userId is required");
        Assert.notNull(waterId, "waterId is required");
        WaterIntake w = waterIntakeRepository.findById(waterId)
                .orElseThrow(() -> new RuntimeException("Water log not found"));
        if (!w.getUserId().equals(userId)) {
            throw new RuntimeException("Not authorized to delete this water log");
        }
        waterIntakeRepository.delete(w);
    }

    // -------------------- SLEEP --------------------

    public SleepLog createSleepForUser(Long userId, SleepLogDto dto) {
        Assert.notNull(userId, "userId is required");
        Assert.notNull(dto, "sleep dto is required");

        // Enforce Limit: Max 1 Sleep Record per day
        java.time.ZoneOffset zoneOffset = TimezoneUtil.getClientZoneOffset();
        Instant startOfDay = LocalDate.now(zoneOffset).atStartOfDay(zoneOffset).toInstant();
        boolean alreadyLoggedSleep = sleepLogRepository.findByUserIdOrderBySleepDateDesc(userId).stream()
                .anyMatch(s -> s.getSleepDate().isAfter(startOfDay));

        if (alreadyLoggedSleep) {
            throw new IllegalArgumentException("Daily Limit Reached: You can only log sleep once per day.");
        }

        if (dto.getHours() != null && (dto.getHours() > 18.0 || dto.getHours() < 3.0)) {
            throw new IllegalArgumentException("Invalid Duration: Sleep duration must be between 3 and 18 hours.");
        }

        com.wellnest.app.model.User user = new com.wellnest.app.model.User();
        user.setId(userId);

        SleepLog sleep = new SleepLog();
        sleep.setUser(user);
        sleep.setHours(dto.getHours());
        sleep.setSleepDate(dto.getSleepDate() != null ? dto.getSleepDate() : Instant.now());
        sleep.setQuality(dto.getQuality());
        sleep.setNotes(dto.getNotes());

        SleepLog saved = sleepLogRepository.save(sleep);
        recordActiveEngagement(userId);

        com.wellnest.app.model.User userObj = userRepository.findById(userId).orElse(null);
        if (userObj != null) {
            double hours = saved.getHours() != null ? saved.getHours() : 0.0;
            int xp = 5 + (int) Math.round(hours * 0.5);
            userService.addXp(userObj, xp);
        }

        return saved;
    }

    public SleepLog updateSleepForUser(Long userId, Long sleepLogId, SleepLogDto dto) {
        Assert.notNull(userId, "userId is required");
        Assert.notNull(sleepLogId, "sleepLogId is required");
        Assert.notNull(dto, "sleep DTO is required");

        SleepLog sleep = sleepLogRepository.findById(sleepLogId)
                .orElseThrow(() -> new IllegalArgumentException("Sleep log not found"));
        if (!sleep.getUser().getId().equals(userId)) {
            throw new SecurityException("Not authorized to update this sleep log");
        }

        if (dto.getHours() != null && (dto.getHours() > 18.0 || dto.getHours() < 3.0)) {
            throw new IllegalArgumentException("Invalid Duration: Sleep duration must be between 3 and 18 hours.");
        }

        sleep.setHours(dto.getHours());
        sleep.setQuality(dto.getQuality());
        sleep.setNotes(dto.getNotes());
        if (dto.getSleepDate() != null) {
            sleep.setSleepDate(dto.getSleepDate());
        }
        SleepLog saved = sleepLogRepository.save(sleep);
        recordActiveEngagement(userId);
        return saved;
    }

    public List<SleepLog> getSleepForUser(Long userId) {
        Assert.notNull(userId, "userId is required");
        return sleepLogRepository.findByUserIdOrderBySleepDateDesc(userId);
    }

    public void deleteSleep(Long userId, Long sleepLogId) {
        Assert.notNull(userId, "userId is required");
        Assert.notNull(sleepLogId, "sleepLogId is required");
        SleepLog s = sleepLogRepository.findById(sleepLogId)
                .orElseThrow(() -> new RuntimeException("Sleep log not found"));
        if (!s.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized to delete this sleep log");
        }
        sleepLogRepository.delete(s);
    }

    // -------------------- DAILY ACTIVITY (Steps, Calories, Distance) --------------------

    public DailyActivity logDailyActivity(Long userId, DailyActivityDto dto) {
        Assert.notNull(userId, "userId is required");
        Assert.notNull(dto, "daily activity dto is required");

        LocalDate targetDate = dto.getDate() != null ? dto.getDate() : LocalDate.now(TimezoneUtil.getClientZoneId());
 
        if (dto.getSteps() != null && (dto.getSteps() > 50000 || dto.getSteps() < 1) && (dto.getIsSync() == null || !dto.getIsSync())) {
            throw new IllegalArgumentException("Invalid Steps: Steps logged manually must be between 1 and 50,000 steps.");
        }

        // Enforce Limit: Max 1 Daily Activity record per day. 
        // If it exists, we update it instead of creating a new one (Upsert behavior).
        DailyActivity activity = dailyActivityRepository.findByUserIdAndDate(userId, targetDate)
                .orElse(new DailyActivity());

        if (activity.getId() == null) {
            // It's a brand new record
            com.wellnest.app.model.User userRef = new com.wellnest.app.model.User();
            userRef.setId(userId);
            activity.setUser(userRef);
            activity.setDate(targetDate);
        }

        // Sync Behavior vs Manual Log Behavior
        if (dto.getIsSync() != null && dto.getIsSync()) {
            // Replacement logic for total-syncs from Health Connect
            if (dto.getSteps() != null) activity.setSteps(dto.getSteps());
            if (dto.getActiveCalories() != null) activity.setActiveCalories(dto.getActiveCalories());
            if (dto.getDistanceKm() != null) activity.setDistanceKm(dto.getDistanceKm());
        } else {
            // Additive logic for manual user entries
            int currentSteps = activity.getSteps() != null ? activity.getSteps() : 0;
            int currentCalories = activity.getActiveCalories() != null ? activity.getActiveCalories() : 0;
            double currentDistance = activity.getDistanceKm() != null ? activity.getDistanceKm() : 0.0;
            activity.setSteps(currentSteps + (dto.getSteps() != null ? dto.getSteps() : 0));
            activity.setActiveCalories(currentCalories + (dto.getActiveCalories() != null ? dto.getActiveCalories() : 0));
            activity.setDistanceKm(currentDistance + (dto.getDistanceKm() != null ? dto.getDistanceKm() : 0.0));
        }

        DailyActivity saved = dailyActivityRepository.save(activity);
        recordActiveEngagement(userId);

        com.wellnest.app.model.User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            int steps = dto.getSteps() != null ? dto.getSteps() : 0;
            int logXp = 2 + (steps / 2000);
            int target = user.getTargetSteps() != null ? user.getTargetSteps() : 10000;
            int previousSteps = saved.getSteps() - steps;
            if (saved.getSteps() >= target && previousSteps < target) {
                userService.addXp(user, logXp + 15);
            } else {
                userService.addXp(user, logXp);
            }
        }

        return saved;
    }

    public List<DailyActivity> getDailyActivities(Long userId, LocalDate startDate, LocalDate endDate) {
        Assert.notNull(userId, "userId is required");
        // Default to fetching the last 30 days if range is not provided
        java.time.ZoneId zoneId = TimezoneUtil.getClientZoneId();
        LocalDate start = startDate != null ? startDate : LocalDate.now(zoneId).minusDays(30);
        LocalDate end = endDate != null ? endDate : LocalDate.now(zoneId);
        
        return dailyActivityRepository.findByUserIdAndDateBetweenOrderByDateDesc(userId, start, end);
    }

    public void deleteDailyActivity(Long userId, Long activityId) {
        Assert.notNull(userId, "userId is required");
        Assert.notNull(activityId, "activityId is required");
        DailyActivity a = dailyActivityRepository.findById(activityId)
                .orElseThrow(() -> new RuntimeException("Daily activity log not found"));
        if (!a.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized to delete this activity log");
        }
        dailyActivityRepository.delete(a);
    }

    @org.springframework.transaction.annotation.Transactional
    public void cleanupUserData(Long userId) {
        Assert.notNull(userId, "userId is required");
        workoutRepository.deleteByUserId(userId);
        mealRepository.deleteByUserId(userId);
        waterIntakeRepository.deleteByUserId(userId);
        sleepLogRepository.deleteByUserId(userId);
    }

    // --- HELPERS FOR AI NOTIFICATION ENGINE ---

    public List<Workout> getWorkoutsForToday(Long userId) {
        java.time.ZoneOffset zoneOffset = TimezoneUtil.getClientZoneOffset();
        Instant startOfDay = LocalDate.now(zoneOffset).atStartOfDay(zoneOffset).toInstant();
        return workoutRepository.findByUserIdOrderByPerformedAtDesc(userId).stream()
                .filter(w -> w.getPerformedAt().isAfter(startOfDay))
                .collect(java.util.stream.Collectors.toList());
    }

    public List<Meal> getMealsForToday(Long userId) {
        java.time.ZoneOffset zoneOffset = TimezoneUtil.getClientZoneOffset();
        Instant startOfDay = LocalDate.now(zoneOffset).atStartOfDay(zoneOffset).toInstant();
        return mealRepository.findByUserIdOrderByLoggedAtDesc(userId).stream()
                .filter(m -> m.getLoggedAt().isAfter(startOfDay))
                .collect(java.util.stream.Collectors.toList());
    }

    public List<WaterIntake> getWaterForToday(Long userId) {
        java.time.ZoneOffset zoneOffset = TimezoneUtil.getClientZoneOffset();
        Instant startOfDay = LocalDate.now(zoneOffset).atStartOfDay(zoneOffset).toInstant();
        return waterIntakeRepository.findByUserIdOrderByLoggedAtDesc(userId).stream()
                .filter(w -> w.getLoggedAt().isAfter(startOfDay))
                .collect(java.util.stream.Collectors.toList());
    }

    public List<SleepLog> getSleepForToday(Long userId) {
        // Sleep is usually logged for the previous night, so we check a 24h window
        Instant last24h = Instant.now().minus(java.time.Duration.ofHours(24));
        return sleepLogRepository.findByUserIdOrderBySleepDateDesc(userId).stream()
                .filter(s -> s.getSleepDate().isAfter(last24h))
                .collect(java.util.stream.Collectors.toList());
    }

    public void recordActiveEngagement(Long userId) {
        if (userId == null) return;
        LocalDate today = LocalDate.now(TimezoneUtil.getClientZoneId());
        if (!userActivityLogRepository.existsByUserIdAndActiveDate(userId, today)) {
            userActivityLogRepository.save(new UserActivityLog(userId, today));
        }
    }

    public List<LocalDate> getActiveDates(Long userId) {
        if (userId == null) return List.of();
        return userActivityLogRepository.findByUserId(userId).stream()
                .map(UserActivityLog::getActiveDate)
                .collect(java.util.stream.Collectors.toList());
    }
}
