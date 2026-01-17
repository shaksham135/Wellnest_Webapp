package com.wellnest.app.dto;

import lombok.Data;

import java.util.List;

@Data
public class TrainerUpdateDto {
    private String location;
    private List<String> specialties;
    private String bio;
}
