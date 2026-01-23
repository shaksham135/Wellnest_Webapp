package com.wellnest.app.controller;

import com.wellnest.app.dto.LeaderboardResponse;
import com.wellnest.app.service.AppUserService;
import com.wellnest.app.service.LeaderboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;
    private final AppUserService appUserService;

    public LeaderboardController(LeaderboardService leaderboardService, AppUserService appUserService) {
        this.leaderboardService = leaderboardService;
        this.appUserService = appUserService;
    }

    @GetMapping("/weekly")
    public ResponseEntity<LeaderboardResponse> getWeeklyLeaderboard(Authentication authentication) {
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        return ResponseEntity.ok(leaderboardService.getWeeklyLeaderboard(userId));
    }
}
