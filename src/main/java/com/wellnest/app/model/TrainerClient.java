package com.wellnest.app.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Setter
@Getter
@Entity
@Table(name = "trainer_clients")
public class TrainerClient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trainer_id", nullable = false)
    private Trainer trainer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private User client;

    @Column(nullable = false)
    private String status; // PENDING, ACTIVE, REJECTED

    private String initialMessage;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public TrainerClient() {
    }

    public TrainerClient(Trainer trainer, User client, String status, String initialMessage) {
        this.trainer = trainer;
        this.client = client;
        this.status = status;
        this.initialMessage = initialMessage;
    }
}
