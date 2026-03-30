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

@Service
public class TrackerService {

    private final WorkoutRepository workoutRepository;
    private final MealRepository mealRepository;
    private final WaterIntakeRepository waterIntakeRepository;
    private final SleepLogRepository sleepLogRepository;
    private final DailyActivityRepository dailyActivityRepository;

    public TrackerService(WorkoutRepository workoutRepository,
            MealRepository mealRepository,
            WaterIntakeRepository waterIntakeRepository,
            SleepLogRepository sleepLogRepository,
            DailyActivityRepository dailyActivityRepository) {
        this.workoutRepository = workoutRepository;
        this.mealRepository = mealRepository;
        this.waterIntakeRepository = waterIntakeRepository;
        this.sleepLogRepository = sleepLogRepository;
        this.dailyActivityRepository = dailyActivityRepository;
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

        Workout workout = new Workout();
        workout.setUserId(userId);
        workout.setType(dto.getType());
        workout.setDurationMinutes(dto.getDurationMinutes());
        workout.setCaloriesBurned(dto.getCaloriesBurned());
        workout.setPerformedAt(dto.getPerformedAt() != null ? dto.getPerformedAt() : Instant.now());
        workout.setNotes(dto.getNotes());

        return workoutRepository.save(workout);
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

        // Enforce Limit: Max 1 entry per Meal Type per day
        Instant startOfDay = LocalDate.now().atStartOfDay(ZoneOffset.UTC).toInstant();
        boolean alreadyLoggedType = mealRepository.findByUserIdOrderByLoggedAtDesc(userId).stream()
                .filter(m -> m.getLoggedAt().isAfter(startOfDay))
                .anyMatch(m -> m.getMealType().equalsIgnoreCase(dto.getMealType()));

        if (alreadyLoggedType) {
            throw new IllegalArgumentException(
                    "Daily Limit Reached: You have already logged " + dto.getMealType() + " today.");
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

        return mealRepository.save(meal);
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

        // Enforce Limit: Max 10 Liters Total per day
        Instant startOfDay = LocalDate.now().atStartOfDay(ZoneOffset.UTC).toInstant();
        double todayTotal = waterIntakeRepository.findByUserIdOrderByLoggedAtDesc(userId).stream()
                .filter(w -> w.getLoggedAt().isAfter(startOfDay))
                .mapToDouble(WaterIntake::getLiters)
                .sum();

        if (todayTotal + dto.getLiters() > 10.0) {
            throw new IllegalArgumentException("Daily Limit Reached: You cannot log more than 10L of water per day.");
        }

        // Enforce Cooldown: Max 1 entry per hour
        List<WaterIntake> history = waterIntakeRepository.findByUserIdOrderByLoggedAtDesc(userId);
        if (!history.isEmpty()) {
            WaterIntake last = history.get(0);
            Instant now = Instant.now();
            long minutesDiff = java.time.Duration.between(last.getLoggedAt(), now).toMinutes();
            if (minutesDiff < 60) {
                throw new IllegalArgumentException(
                        "Cooldown Active: Please wait " + (60 - minutesDiff) + " minutes before logging water again.");
            }
        }

        WaterIntake water = new WaterIntake();
        water.setUserId(userId);
        water.setLiters(dto.getLiters());
        water.setLoggedAt(dto.getLoggedAt() != null ? dto.getLoggedAt() : Instant.now());
        water.setNotes(dto.getNotes());

        return waterIntakeRepository.save(water);
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
        Instant startOfDay = LocalDate.now().atStartOfDay(ZoneOffset.UTC).toInstant();
        boolean alreadyLoggedSleep = sleepLogRepository.findByUserIdOrderBySleepDateDesc(userId).stream()
                .anyMatch(s -> s.getSleepDate().isAfter(startOfDay));

        if (alreadyLoggedSleep) {
            throw new IllegalArgumentException("Daily Limit Reached: You can only log sleep once per day.");
        }

        com.wellnest.app.model.User user = new com.wellnest.app.model.User();
        user.setId(userId);

        SleepLog sleep = new SleepLog();
        sleep.setUser(user);
        sleep.setHours(dto.getHours());
        sleep.setSleepDate(dto.getSleepDate() != null ? dto.getSleepDate() : Instant.now());
        sleep.setQuality(dto.getQuality());
        sleep.setNotes(dto.getNotes());

        return sleepLogRepository.save(sleep);
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

        LocalDate targetDate = dto.getDate() != null ? dto.getDate() : LocalDate.now();

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
            activity.setSteps(activity.getSteps() + (dto.getSteps() != null ? dto.getSteps() : 0));
            activity.setActiveCalories(activity.getActiveCalories() + (dto.getActiveCalories() != null ? dto.getActiveCalories() : 0));
            activity.setDistanceKm(activity.getDistanceKm() + (dto.getDistanceKm() != null ? dto.getDistanceKm() : 0.0));
        }

        return dailyActivityRepository.save(activity);
    }

    public List<DailyActivity> getDailyActivities(Long userId, LocalDate startDate, LocalDate endDate) {
        Assert.notNull(userId, "userId is required");
        // Default to fetching the last 30 days if range is not provided
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate end = endDate != null ? endDate : LocalDate.now();
        
        return dailyActivityRepository.findByUserIdAndDateBetweenOrderByDateAsc(userId, start, end);
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
}
