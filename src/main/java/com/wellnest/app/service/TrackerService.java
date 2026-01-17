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
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class TrackerService {

    private final WorkoutRepository workoutRepository;
    private final MealRepository mealRepository;
    private final WaterIntakeRepository waterIntakeRepository;
    private final SleepLogRepository sleepLogRepository;

    public TrackerService(WorkoutRepository workoutRepository,
            MealRepository mealRepository,
            WaterIntakeRepository waterIntakeRepository,
            SleepLogRepository sleepLogRepository) {
        this.workoutRepository = workoutRepository;
        this.mealRepository = mealRepository;
        this.waterIntakeRepository = waterIntakeRepository;
        this.sleepLogRepository = sleepLogRepository;
    }

    // -------------------- WORKOUT --------------------

    /**
     * Create a workout for the given userId. DTO's userId is ignored.
     */
    public Workout createWorkoutForUser(Long userId, WorkoutDto dto) {
        Assert.notNull(userId, "userId is required");
        Assert.notNull(dto, "workout dto is required");

        Workout workout = new Workout();
        workout.setUserId(userId);
        workout.setType(dto.getType());
        workout.setDurationMinutes(dto.getDurationMinutes());
        workout.setCaloriesBurned(dto.getCaloriesBurned());
        workout.setPerformedAt(dto.getPerformedAt() != null ? dto.getPerformedAt() : LocalDateTime.now());
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

        Meal meal = new Meal();
        meal.setUserId(userId);
        meal.setMealType(dto.getMealType());
        meal.setCalories(dto.getCalories());
        meal.setProtein(dto.getProtein());
        meal.setCarbs(dto.getCarbs());
        meal.setFats(dto.getFats());
        meal.setLoggedAt(dto.getLoggedAt() != null ? dto.getLoggedAt() : LocalDateTime.now());
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

        WaterIntake water = new WaterIntake();
        water.setUserId(userId);
        water.setLiters(dto.getLiters());
        water.setLoggedAt(dto.getLoggedAt() != null ? dto.getLoggedAt() : LocalDateTime.now());
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

        SleepLog sleep = new SleepLog();
        sleep.setUserId(userId);
        sleep.setHours(dto.getHours());
        sleep.setSleepDate(dto.getSleepDate() != null ? dto.getSleepDate() : LocalDate.now());
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
        if (!s.getUserId().equals(userId)) {
            throw new RuntimeException("Not authorized to delete this sleep log");
        }
        sleepLogRepository.delete(s);
    }
}
