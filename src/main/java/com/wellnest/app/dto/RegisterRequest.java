package com.wellnest.app.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class RegisterRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 60, message = "Name must be between 2 and 60 characters")
    @Pattern(
        regexp = "^[a-zA-Z\\s'-]+$",
        message = "Name can only contain letters, spaces, hyphens and apostrophes"
    )
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Please enter a valid email address (e.g. user@example.com)")
    @Size(max = 120, message = "Email must not exceed 120 characters")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*(),.?\":{}|<>]).{8,}$",
        message = "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character"
    )
    private String password;

    // Fixed to USER only — trainers are added via admin
    private String role = "USER";

    @Pattern(
        regexp = "^(\\+?[0-9]{7,15})?$",
        message = "Phone number must be 7–15 digits (optionally starting with +)"
    )
    private String phone;

    private String fitnessGoal;

    public RegisterRequest() {
    }

}
