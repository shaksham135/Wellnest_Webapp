package com.wellnest.app.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "workouts")
public class Workout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id" , nullable = false)
    private  Long userId;

    @Column(nullable = false , length = 64)
    private String type;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "calories_burned")
    private Integer caloriesBurned;

    @Column(name = "performed_at")
    private java.time.Instant performedAt;
    @Column(columnDefinition = "TEXT")
    private String notes;

    public Workout() {
        this.performedAt = java.time.Instant.now();
    }
}
