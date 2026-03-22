package com.wellnest.app.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Setter
@Getter
@Entity
@Table(name = "sleep_logs")
public class SleepLog {
    // Getters/setters
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Changed from userId to User object for relationship
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private Double hours;

    @Column(name="sleep_date")
    private java.time.Instant sleepDate;
    private java.time.Instant createdAt;

    private String quality; // optional

    @Column(columnDefinition = "TEXT")
    private String notes;

    public SleepLog() {
        this.createdAt = java.time.Instant.now();
    }
    
    public SleepLog(User user, java.time.Instant sleepDate, Double hours, String quality) {
        this.user = user;
        this.sleepDate = sleepDate;
        this.hours = hours;
        this.quality = quality;
        this.createdAt = java.time.Instant.now();
    }

}
