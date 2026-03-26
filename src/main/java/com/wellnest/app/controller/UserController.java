package com.wellnest.app.controller;

import com.wellnest.app.dto.ProfileUpdateRequest;
import com.wellnest.app.dto.UpdateTargetWeightRequest;
import com.wellnest.app.dto.UserProfileResponse;
import com.wellnest.app.dto.GoalTargetsDto;
import com.wellnest.app.model.User;
import com.wellnest.app.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
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
                targets);
        return ResponseEntity.ok(dto);
    }

    // PUT /api/users/me/profile (used by Setup Profile page)
    @PutMapping("/me/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @RequestBody ProfileUpdateRequest req,
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
                targets);
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
}
