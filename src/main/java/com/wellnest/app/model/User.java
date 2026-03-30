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
