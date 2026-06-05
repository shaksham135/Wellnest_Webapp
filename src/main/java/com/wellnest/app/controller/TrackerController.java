package com.wellnest.app.controller;

import com.wellnest.app.dto.MealDto;
import com.wellnest.app.dto.SleepLogDto;
import com.wellnest.app.dto.WaterIntakeDto;
import com.wellnest.app.dto.WorkoutDto;
import com.wellnest.app.model.Meal;
import com.wellnest.app.model.SleepLog;
import com.wellnest.app.model.WaterIntake;
import com.wellnest.app.model.Workout;
import com.wellnest.app.model.DailyActivity;
import com.wellnest.app.dto.DailyActivityDto;
import com.wellnest.app.service.AppUserService;
import com.wellnest.app.service.TrackerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Secure controller that resolves the logged-in user via AppUserService and
 * never trusts client-provided userId.
 *
 * Ensure Spring Security is configured and requests contain authentication
 * (JWT/session).
 */
@RestController
@RequestMapping("/api/trackers")
@Validated
public class TrackerController {

    private final TrackerService trackerService;
    private final AppUserService appUserService;
    private final com.wellnest.app.service.AssistantService assistantService;
    private final com.wellnest.app.repository.UserRepository userRepository;
    private final com.wellnest.app.service.UserService userService;

    public TrackerController(TrackerService trackerService, 
                           AppUserService appUserService,
                           com.wellnest.app.service.AssistantService assistantService,
                           com.wellnest.app.repository.UserRepository userRepository,
                           com.wellnest.app.service.UserService userService) {
        this.trackerService = trackerService;
        this.appUserService = appUserService;
        this.assistantService = assistantService;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    // -------------------- WORKOUT --------------------

    @PostMapping("/workouts")
    public ResponseEntity<com.wellnest.app.dto.LogResponse<Workout>> createWorkout(@Valid @RequestBody WorkoutDto dto,
            Authentication authentication) {
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        Workout created = trackerService.createWorkoutForUser(userId, dto);
        com.wellnest.app.model.User user = userRepository.findById(userId).orElse(null);
        return ResponseEntity.ok((com.wellnest.app.dto.LogResponse<Workout>) assistantService.generateInstantInsight(created, user));
    }

    @GetMapping("/workouts")
    public ResponseEntity<List<Workout>> getWorkouts(Authentication authentication) {
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        List<Workout> list = trackerService.getWorkoutsForUser(userId);
        return ResponseEntity.ok(list);
    }

    @DeleteMapping("/workouts/{id}")
    public ResponseEntity<Void> deleteWorkout(@PathVariable Long id, Authentication authentication) {
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        trackerService.deleteWorkout(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/workouts/{id}")
    public ResponseEntity<Workout> updateWorkout(@PathVariable Long id, @Valid @RequestBody WorkoutDto dto,
            Authentication authentication) {
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        Workout updated = trackerService.updateWorkoutForUser(userId, id, dto);
        return ResponseEntity.ok(updated);
    }

    // -------------------- MEAL --------------------

    @PostMapping("/meals")
    public ResponseEntity<com.wellnest.app.dto.LogResponse<Meal>> createMeal(@Valid @RequestBody MealDto dto,
            Authentication authentication) {
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        Meal created = trackerService.createMealForUser(userId, dto);
        com.wellnest.app.model.User user = userRepository.findById(userId).orElse(null);
        return ResponseEntity.ok((com.wellnest.app.dto.LogResponse<Meal>) assistantService.generateInstantInsight(created, user));
    }

    @GetMapping("/meals")
    public ResponseEntity<List<Meal>> getMeals(Authentication authentication) {
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        List<Meal> list = trackerService.getMealsForUser(userId);
        return ResponseEntity.ok(list);
    }

    @DeleteMapping("/meals/{id}")
    public ResponseEntity<Void> deleteMeal(@PathVariable Long id, Authentication authentication) {
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        trackerService.deleteMeal(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/meals/{id}")
    public ResponseEntity<Meal> updateMeal(@PathVariable Long id, @Valid @RequestBody MealDto dto,
            Authentication authentication) {
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        Meal updated = trackerService.updateMealForUser(userId, id, dto);
        return ResponseEntity.ok(updated);
    }

    // -------------------- WATER --------------------

    @PostMapping("/water")
    public ResponseEntity<com.wellnest.app.dto.LogResponse<WaterIntake>> createWater(@Valid @RequestBody WaterIntakeDto dto,
            Authentication authentication) {
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        WaterIntake created = trackerService.createWaterForUser(userId, dto);
        com.wellnest.app.model.User user = userRepository.findById(userId).orElse(null);
        return ResponseEntity.ok((com.wellnest.app.dto.LogResponse<WaterIntake>) assistantService.generateInstantInsight(created, user));
    }

    @GetMapping("/water")
    public ResponseEntity<List<WaterIntake>> getWater(Authentication authentication) {
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        List<WaterIntake> list = trackerService.getWaterForUser(userId);
        return ResponseEntity.ok(list);
    }

    @DeleteMapping("/water/{id}")
    public ResponseEntity<Void> deleteWater(@PathVariable Long id, Authentication authentication) {
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        trackerService.deleteWater(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/water/{id}")
    public ResponseEntity<WaterIntake> updateWater(@PathVariable Long id, @Valid @RequestBody WaterIntakeDto dto,
            Authentication authentication) {
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        WaterIntake updated = trackerService.updateWaterForUser(userId, id, dto);
        return ResponseEntity.ok(updated);
    }

    // -------------------- SLEEP --------------------

    @PostMapping("/sleep")
    public ResponseEntity<com.wellnest.app.dto.LogResponse<SleepLog>> createSleep(@Valid @RequestBody SleepLogDto dto,
            Authentication authentication) {
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        SleepLog created = trackerService.createSleepForUser(userId, dto);
        com.wellnest.app.model.User user = userRepository.findById(userId).orElse(null);
        return ResponseEntity.ok((com.wellnest.app.dto.LogResponse<SleepLog>) assistantService.generateInstantInsight(created, user));
    }

    @GetMapping("/sleep")
    public ResponseEntity<List<SleepLog>> getSleep(Authentication authentication) {
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        List<SleepLog> list = trackerService.getSleepForUser(userId);
        return ResponseEntity.ok(list);
    }

    @DeleteMapping("/sleep/{id}")
    public ResponseEntity<Void> deleteSleep(@PathVariable Long id, Authentication authentication) {
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        trackerService.deleteSleep(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/sleep/{id}")
    public ResponseEntity<SleepLog> updateSleep(@PathVariable Long id, @Valid @RequestBody SleepLogDto dto,
            Authentication authentication) {
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        SleepLog updated = trackerService.updateSleepForUser(userId, id, dto);
        return ResponseEntity.ok(updated);
    }

    // -------------------- DAILY ACTIVITY (Steps, Calories) --------------------

    @PostMapping("/activity")
    public ResponseEntity<com.wellnest.app.dto.LogResponse<DailyActivity>> createDailyActivity(@Valid @RequestBody DailyActivityDto dto,
            Authentication authentication) {
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        DailyActivity created = trackerService.logDailyActivity(userId, dto);
        com.wellnest.app.model.User user = userRepository.findById(userId).orElse(null);
        return ResponseEntity.ok((com.wellnest.app.dto.LogResponse<DailyActivity>) assistantService.generateInstantInsight(created, user));
    }

    @GetMapping("/activity")
    public ResponseEntity<List<DailyActivity>> getDailyActivities(
            Authentication authentication,
            @RequestParam(required = false) java.time.LocalDate startDate,
            @RequestParam(required = false) java.time.LocalDate endDate) {
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        List<DailyActivity> list = trackerService.getDailyActivities(userId, startDate, endDate);
        return ResponseEntity.ok(list);
    }

    @DeleteMapping("/activity/{id}")
    public ResponseEntity<Void> deleteDailyActivity(@PathVariable Long id, Authentication authentication) {
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        trackerService.deleteDailyActivity(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/undo")
    public ResponseEntity<Void> undoLog(
            @RequestParam("type") String type,
            @RequestParam("id") Long id,
            Authentication authentication) {
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        switch (type.toUpperCase()) {
            case "WATER":
                trackerService.deleteWater(userId, id);
                break;
            case "MEAL":
                trackerService.deleteMeal(userId, id);
                break;
            case "WORKOUT":
                trackerService.deleteWorkout(userId, id);
                break;
            case "SLEEP":
                trackerService.deleteSleep(userId, id);
                break;
            case "ACTIVITY":
                trackerService.deleteDailyActivity(userId, id);
                break;
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/active-days")
    public ResponseEntity<List<java.time.LocalDate>> getActiveDays(Authentication authentication) {
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        List<java.time.LocalDate> list = trackerService.getActiveDates(userId);
        return ResponseEntity.ok(list);
    }
}
