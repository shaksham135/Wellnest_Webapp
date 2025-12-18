package com.wellnest.app.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Setter
@Getter
@Entity
@Table(name = "weight_logs")
public class WeightLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "weight_kg", nullable = false)
    private Double weightKg;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    public WeightLog() {}

    public WeightLog(User user, Double weightKg, LocalDate logDate) {
        this.user = user;
        this.weightKg = weightKg;
        this.logDate = logDate;
    }
}
