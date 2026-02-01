package com.wellnest.app.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class DietPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long trainerId;
    private Long userId; // Client

    @Column(columnDefinition = "TEXT")
    private String breakfast;

    @Column(columnDefinition = "TEXT")
    private String lunch;

    @Column(columnDefinition = "TEXT")
    private String dinner;

    @Column(columnDefinition = "TEXT")
    private String snacks;

    @Column(columnDefinition = "TEXT")
    private String additionalNotes;

    // Assignment Fields
    private Integer workoutCalories;
    private Double waterLiters;
    private Double sleepHours;
    private Integer stepsTarget;

    private LocalDateTime updatedAt;

    public DietPlan() {
    }

    public DietPlan(Long trainerId, Long userId, String breakfast, String lunch, String dinner, String snacks,
            String additionalNotes, Integer workoutCalories, Double waterLiters, Double sleepHours,
            Integer stepsTarget) {
        this.trainerId = trainerId;
        this.userId = userId;
        this.breakfast = breakfast;
        this.lunch = lunch;
        this.dinner = dinner;
        this.snacks = snacks;
        this.additionalNotes = additionalNotes;
        this.workoutCalories = workoutCalories;
        this.waterLiters = waterLiters;
        this.sleepHours = sleepHours;
        this.stepsTarget = stepsTarget;
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTrainerId() {
        return trainerId;
    }

    public void setTrainerId(Long trainerId) {
        this.trainerId = trainerId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getBreakfast() {
        return breakfast;
    }

    public void setBreakfast(String breakfast) {
        this.breakfast = breakfast;
    }

    public String getLunch() {
        return lunch;
    }

    public void setLunch(String lunch) {
        this.lunch = lunch;
    }

    public String getDinner() {
        return dinner;
    }

    public void setDinner(String dinner) {
        this.dinner = dinner;
    }

    public String getSnacks() {
        return snacks;
    }

    public void setSnacks(String snacks) {
        this.snacks = snacks;
    }

    public String getAdditionalNotes() {
        return additionalNotes;
    }

    public void setAdditionalNotes(String additionalNotes) {
        this.additionalNotes = additionalNotes;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Integer getWorkoutCalories() {
        return workoutCalories;
    }

    public void setWorkoutCalories(Integer workoutCalories) {
        this.workoutCalories = workoutCalories;
    }

    public Double getWaterLiters() {
        return waterLiters;
    }

    public void setWaterLiters(Double waterLiters) {
        this.waterLiters = waterLiters;
    }

    public Double getSleepHours() {
        return sleepHours;
    }

    public void setSleepHours(Double sleepHours) {
        this.sleepHours = sleepHours;
    }

    public Integer getStepsTarget() {
        return stepsTarget;
    }

    public void setStepsTarget(Integer stepsTarget) {
        this.stepsTarget = stepsTarget;
    }
}
