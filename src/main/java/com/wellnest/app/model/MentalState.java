package com.wellnest.app.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "mental_states")
public class MentalState {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "stress_score")
    private Integer stressScore; // 1-10

    @Column(name = "focus_score")
    private Integer focusScore; // 1-10

    @Column(name = "mood_score")
    private Integer moodScore; // 1-10

    @Column(length = 64)
    private String sentiment; // e.g., POSITIVE, NEGATIVE, STRESSED, CALM

    @Column(columnDefinition = "TEXT")
    private String transcription; // From Voice journaling

    @Column(name = "performed_at")
    private Instant performedAt;

    public MentalState() {
        this.performedAt = Instant.now();
    }
}
