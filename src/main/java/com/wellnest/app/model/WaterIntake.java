package com.wellnest.app.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Setter
@Getter
@Entity
@Table(name = "water_intake")
public class WaterIntake {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="user_id", nullable = false)
    private Long userId;

    private Double liters;

    @Column(name="logged_at")
    private Instant loggedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    public WaterIntake() {
        this.loggedAt = Instant.now();
    }
}
