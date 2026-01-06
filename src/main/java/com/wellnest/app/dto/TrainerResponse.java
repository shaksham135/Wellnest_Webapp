package com.wellnest.app.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class TrainerResponse {
    private Long id;
    private Long userId;
    private String name;
    private List<String> specialties;
    private Integer experience;
    private Double rating;
    private String location;
    private List<String> availability;
    private String bio;
    private String image;
    private String email;
    private String phone;

    public TrainerResponse() {
    }

    public TrainerResponse(Long id, Long userId, String name, List<String> specialties, Integer experience,
            Double rating, String location, List<String> availability, String bio,
            String image, String email, String phone) {
        this.id = id;
        this.userId = userId;
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
