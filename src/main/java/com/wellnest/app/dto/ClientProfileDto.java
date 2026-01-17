package com.wellnest.app.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClientProfileDto {
    private Long id;
    private String name;
    private String email;
    private Integer age;
    private Double height;
    private Double weight;
    private String fitnessGoal;

    public ClientProfileDto(Long id, String name, String email, Integer age, Double height, Double weight,
            String fitnessGoal) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.age = age;
        this.height = height;
        this.weight = weight;
        this.fitnessGoal = fitnessGoal;
    }
}
