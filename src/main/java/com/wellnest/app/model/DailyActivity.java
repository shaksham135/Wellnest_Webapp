package com.wellnest.app.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Setter
@Getter
@Entity
@Table(name = "daily_activity")
public class DailyActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate date;

    @Column(columnDefinition = "integer default 0")
    private Integer steps = 0;

    @Column(columnDefinition = "integer default 0")
    private Integer activeCalories = 0;

    @Column(columnDefinition = "double default 0.0")
    private Double distanceKm = 0.0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public DailyActivity() {}

    public DailyActivity(User user, LocalDate date, Integer steps, Integer activeCalories, Double distanceKm) {
        this.user = user;
        this.date = date;
        this.steps = steps;
        this.activeCalories = activeCalories;
        this.distanceKm = distanceKm;
    }
}
