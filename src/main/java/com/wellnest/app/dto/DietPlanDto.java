package com.wellnest.app.dto;

public class DietPlanDto {
    private Long trainerId;
    private Long clientId;
    private String breakfast;
    private String lunch;
    private String dinner;
    private String snacks;
    private String additionalNotes;

    // Assignment Fields
    private Integer workoutCalories;
    private Double waterLiters;
    private Double sleepHours;
    private Integer stepsTarget;

    // Getters and Setters
    public Long getTrainerId() {
        return trainerId;
    }

    public void setTrainerId(Long trainerId) {
        this.trainerId = trainerId;
    }

    public Long getClientId() {
        return clientId;
    }

    public void setClientId(Long clientId) {
        this.clientId = clientId;
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
