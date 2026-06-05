package com.wellnest.app.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Setter
@Getter
@Entity
@Table(name = "feedbacks")
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String category; // BUG, SUGGESTION, USABILITY, OTHER

    @Column(nullable = false)
    private Integer rating; // 1 to 5 stars

    @Column(nullable = false, columnDefinition = "TEXT")
    private String feedbackText;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Feedback() {}

    public Feedback(User user, String category, Integer rating, String feedbackText) {
        this.user = user;
        this.category = category;
        this.rating = rating;
        this.feedbackText = feedbackText;
    }
}
