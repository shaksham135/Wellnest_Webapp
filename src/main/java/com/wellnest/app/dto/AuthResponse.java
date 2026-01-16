package com.wellnest.app.dto;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class AuthResponse {
    private String token;
    private String message;
    private String role;
    private boolean profileComplete;
    private Long userId;

    public AuthResponse() {
    }

    public AuthResponse(String token, String message, String role, boolean profileComplete, Long userId) {
        this.token = token;
        this.message = message;
        this.role = role;
        this.profileComplete = profileComplete;
        this.userId = userId;
    }

}
