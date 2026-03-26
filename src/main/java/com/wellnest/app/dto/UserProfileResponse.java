package com.wellnest.app.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserProfileResponse {

    private String name;
    private String email;
    private String role;

    private Integer age;
    private Double heightCm;

    private Double weightKg;
    private String gender;
    private String fitnessGoal;
    private String phone;
    @com.fasterxml.jackson.annotation.JsonProperty("isVerified")
    private boolean isVerified;
    private boolean verificationRequested;
    private boolean isPremium;
    private GoalTargetsDto targets;

    public UserProfileResponse() {
    }

    public UserProfileResponse(String name, String email, String role,
            Integer age, Double heightCm, Double weightKg,
            String gender, String fitnessGoal, String phone,
            boolean isVerified, boolean verificationRequested, boolean isPremium,
            GoalTargetsDto targets) {
        this.name = name;
        this.email = email;
        this.role = role;
        this.age = age;
        this.heightCm = heightCm;
        this.weightKg = weightKg;
        this.gender = gender;
        this.fitnessGoal = fitnessGoal;
        this.phone = phone;
        this.isPremium = isPremium;
        this.isVerified = isVerified;
        this.verificationRequested = verificationRequested;
        this.targets = targets;
    }
}
