package com.wellnest.app.dto;

import lombok.Data;

@Data
public class GoogleAuthRequest {
    private String token;
    private String role;
    private String fitnessGoal;
}
