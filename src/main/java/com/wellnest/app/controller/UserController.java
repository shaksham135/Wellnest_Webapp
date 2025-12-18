package com.wellnest.app.controller;

import com.wellnest.app.dto.ProfileUpdateRequest;
import com.wellnest.app.dto.UpdateTargetWeightRequest;
import com.wellnest.app.dto.UserProfileResponse;
import com.wellnest.app.model.User;
import com.wellnest.app.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // GET /api/users/me  (optional, for future)
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMe(Authentication auth) {
        String email = auth.getName();
        User user = userService.findByEmail(email).orElseThrow();

        UserProfileResponse dto = new UserProfileResponse(
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getAge(),
                user.getHeightCm(),
                user.getWeightKg(),
                user.getGender(),
                user.getFitnessGoal(),
                user.getTargetWeightKg()
        );
        return ResponseEntity.ok(dto);
    }

    // PUT /api/users/me/profile  (used by Setup Profile page)
    @PutMapping("/me/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @RequestBody ProfileUpdateRequest req,
            Authentication auth
    ) {
        String email = auth.getName();
        User user = userService.findByEmail(email).orElseThrow();

        user.setAge(req.getAge());
        user.setHeightCm(req.getHeightCm());
        user.setWeightKg(req.getWeightKg());
        user.setGender(req.getGender());
        user.setFitnessGoal(req.getFitnessGoal());

        userService.save(user);

        UserProfileResponse dto = new UserProfileResponse(
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getAge(),
                user.getHeightCm(),
                user.getWeightKg(),
                user.getGender(),
                user.getFitnessGoal(),
                user.getTargetWeightKg()
        );
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/me/target-weight")
    public ResponseEntity<Void> updateTargetWeight(
            @RequestBody UpdateTargetWeightRequest req,
            Authentication auth
    ) {
        String email = auth.getName();
        userService.updateTargetWeight(email, req.getTargetWeightKg());
        return ResponseEntity.ok().build();
    }
}
