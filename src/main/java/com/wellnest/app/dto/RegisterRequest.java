package com.wellnest.app.dto;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class RegisterRequest {

    private String name;
    private String email;
    private String password;
    private String role;
    private String phone;
    private String fitnessGoal;

    public RegisterRequest() {
    }

}
