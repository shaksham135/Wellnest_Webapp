package com.wellnest.app.controller;

import com.wellnest.app.dto.DailyActivityDto;
import com.wellnest.app.model.User;
import com.wellnest.app.service.DailyActivityService;
import com.wellnest.app.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/activity")
@CrossOrigin
public class DailyActivityController {

    private final DailyActivityService dailyActivityService;
    private final UserService userService;

    public DailyActivityController(DailyActivityService dailyActivityService, UserService userService) {
        this.dailyActivityService = dailyActivityService;
        this.userService = userService;
    }

    @PostMapping("/sync")
    public ResponseEntity<String> syncActivity(@RequestBody DailyActivityDto dto, Authentication auth) {
        String email = auth.getName();
        User user = userService.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        
        dailyActivityService.syncActivity(user, dto);
        
        return ResponseEntity.ok("Activity synced successfully");
    }
}
