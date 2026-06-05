package com.wellnest.app.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Setter
@Getter
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @com.fasterxml.jackson.annotation.JsonProperty("isPremium")
    private boolean isPremium = false;

    private int dailyChatCount = 0;
    private java.time.LocalDate lastChatDate;

    private int dailyVoiceCount = 0;
    private java.time.LocalDate lastVoiceDate;

    private int dailyScanCount = 0;
    private java.time.LocalDate lastScanDate;

    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    private String password;

    private String role;

    private Integer age;

    private Double heightCm;

    private Double weightKg;

    private String gender;

    private String fitnessGoal;

    private String phone;

    private String resetToken;

    private LocalDateTime resetTokenExpiry;

    private Double targetWeightKg;

    private Integer targetSteps;
    private Double targetWaterLiters;
    private Double targetSleepHours;
    private Integer targetWorkoutsPerWeek;
    private Double targetActiveCalories;
    private Double targetDistanceKm;

    @Column(nullable = false)
    private boolean isVerified = false;

    @Column(nullable = false)
    private boolean verificationRequested = false;

    @Column(nullable = false)
    private boolean isSuspended = false;

    private int xp = 0;
    private int level = 1;
    private int coins = 0;
    private String league = "Bronze";

    // Coin Shop Items
    private int streakShieldCount = 0;
    private String activeTheme = "default";
    private LocalDateTime xpBoosterExpiry = null;
    private boolean hasPremiumBadge = false;
    private boolean hasGoldTheme = false;
    private boolean hasEmeraldTheme = false;

    private String subscriptionPlan;
    private String subscriptionStatus;
    private java.time.LocalDate subscriptionDate;
    private LocalDateTime premiumActivatedAt;

    // Beta Premium Access Type: FREE | BETA_PREMIUM | PAID_PREMIUM | ADMIN_GRANTED | LIFETIME
    @Column(nullable = false)
    private String premiumAccessType = "FREE";

    private LocalDateTime firstVoiceLogAt;

    private String fcmToken;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public User() {
    }

    public User(String name, String email, String password, String role) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
    }

}
