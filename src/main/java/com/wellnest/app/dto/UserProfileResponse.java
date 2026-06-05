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
    @com.fasterxml.jackson.annotation.JsonProperty("isPremium")
    private boolean isPremium;

    private String premiumAccessType;
    private GoalTargetsDto targets;

    private int dailyVoiceCount;
    private java.time.LocalDate lastVoiceDate;
    private int dailyScanCount;
    private java.time.LocalDate lastScanDate;

    private int xp;
    private int level;
    private int coins;
    private String league;

    // Coin Shop Items
    private int streakShieldCount;
    private String activeTheme;
    private boolean xpBoosterActive;
    private boolean hasPremiumBadge;
    private boolean hasGoldTheme;
    private boolean hasEmeraldTheme;

    private String subscriptionPlan;
    private String subscriptionStatus;
    private java.time.LocalDate subscriptionDate;
    private java.time.LocalDateTime premiumActivatedAt;
    private java.time.LocalDateTime firstVoiceLogAt;
    private int maxVoiceCommandsLimit;

    public UserProfileResponse() {
    }

    public UserProfileResponse(String name, String email, String role,
            Integer age, Double heightCm, Double weightKg,
            String gender, String fitnessGoal, String phone,
            boolean isVerified, boolean verificationRequested, boolean isPremium,
            GoalTargetsDto targets, int dailyVoiceCount, java.time.LocalDate lastVoiceDate,
            int dailyScanCount, java.time.LocalDate lastScanDate,
            int xp, int level, int coins, String league) {
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
        this.dailyVoiceCount = dailyVoiceCount;
        this.lastVoiceDate = lastVoiceDate;
        this.dailyScanCount = dailyScanCount;
        this.lastScanDate = lastScanDate;
        this.xp = xp;
        this.level = level;
        this.coins = coins;
        this.league = league;
    }
}
