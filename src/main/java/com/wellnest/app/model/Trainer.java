package com.wellnest.app.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Setter
@Getter
@Entity
@Table(name = "trainers")
public class Trainer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ElementCollection
    @CollectionTable(name = "trainer_specialties", joinColumns = @JoinColumn(name = "trainer_id"))
    @Column(name = "specialty")
    private List<String> specialties = new ArrayList<>();

    private Integer experience; // years of experience

    private Double rating; // 0.0 to 5.0

    @Column(columnDefinition = "integer default 0")
    private Integer ratingCount = 0;

    private String location; // City or "Online"

    @ElementCollection
    @CollectionTable(name = "trainer_availability", joinColumns = @JoinColumn(name = "trainer_id"))
    @Column(name = "day")
    private List<String> availability = new ArrayList<>(); // ["Mon", "Wed", "Fri"]

    @Column(length = 1000)
    private String bio;

    @Column(columnDefinition = "LONGTEXT")
    private String image;

    private String email;

    private String phone;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user; // Link to user account if trainer has one

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Trainer() {
    }

    public Trainer(String name, List<String> specialties, Integer experience, Double rating,
            String location, List<String> availability, String bio, String image,
            String email, String phone) {
        this.name = name;
        this.specialties = specialties;
        this.experience = experience;
        this.rating = rating;
        this.location = location;
        this.availability = availability;
        this.bio = bio;
        this.image = image;
        this.email = email;
        this.phone = phone;
    }
}
