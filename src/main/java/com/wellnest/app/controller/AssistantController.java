package com.wellnest.app.controller;

import com.wellnest.app.model.DailyBriefing;
import com.wellnest.app.service.AppUserService;
import com.wellnest.app.service.AssistantService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assistant")
public class AssistantController {

    private final AssistantService assistantService;
    private final AppUserService appUserService;

    public AssistantController(AssistantService assistantService, AppUserService appUserService) {
        this.assistantService = assistantService;
        this.appUserService = appUserService;
    }

    @GetMapping("/briefing")
    public ResponseEntity<DailyBriefing> getDailyBriefing(Authentication authentication, @RequestParam(required = false) String date) {
        Long userId = appUserService.getUserIdFromAuthentication(authentication);
        DailyBriefing briefing = assistantService.getTodayBriefing(userId, date);
        return ResponseEntity.ok(briefing);
    }
}
