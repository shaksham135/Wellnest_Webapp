package com.wellnest.app.controller;

import com.wellnest.app.dto.MealDto;
import com.wellnest.app.dto.SleepLogDto;
import com.wellnest.app.dto.WaterIntakeDto;
import com.wellnest.app.dto.WorkoutDto;
import com.wellnest.app.model.Meal;
import com.wellnest.app.model.SleepLog;
import com.wellnest.app.model.WaterIntake;
import com.wellnest.app.model.Workout;
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

    public TrackerController(TrackerService trackerService, AppUserService appUserService) {
        this.trackerService = trackerService;
        this.appUserService = appUserService;
    }

    // -------------------- WORKOUT --------------------

    @PostMapping("/workouts")
    public ResponseEntity<Workout> createWorkout(@Valid @RequestBody WorkoutDto dto,
            Authentication authentication) {
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        Workout created = trackerService.createWorkoutForUser(userId, dto);
        return ResponseEntity.ok(created);
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

    // -------------------- MEAL --------------------

    @PostMapping("/meals")
    public ResponseEntity<Meal> createMeal(@Valid @RequestBody MealDto dto,
            Authentication authentication) {
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        Meal created = trackerService.createMealForUser(userId, dto);
        return ResponseEntity.ok(created);
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

    // -------------------- WATER --------------------

    @PostMapping("/water")
    public ResponseEntity<WaterIntake> createWater(@Valid @RequestBody WaterIntakeDto dto,
            Authentication authentication) {
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        WaterIntake created = trackerService.createWaterForUser(userId, dto);
        return ResponseEntity.ok(created);
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

    // -------------------- SLEEP --------------------

    @PostMapping("/sleep")
    public ResponseEntity<SleepLog> createSleep(@Valid @RequestBody SleepLogDto dto,
            Authentication authentication) {
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        SleepLog created = trackerService.createSleepForUser(userId, dto);
        return ResponseEntity.ok(created);
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
}
