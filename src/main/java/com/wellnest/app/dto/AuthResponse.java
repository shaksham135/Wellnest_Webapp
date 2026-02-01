package com.wellnest.app.dto;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class AuthResponse {
    private String token;
    private String message;
    private String role;
    private Long userId;
    private boolean profileComplete;

    @com.fasterxml.jackson.annotation.JsonProperty("isVerified")
    private boolean isVerified;

    public AuthResponse(String token, String message, String role, boolean profileComplete, Long userId,
            boolean isVerified) {
        this.token = token;
        this.message = message;
        this.role = role;
        this.profileComplete = profileComplete;
        this.userId = userId;
        this.isVerified = isVerified;
    }

}
