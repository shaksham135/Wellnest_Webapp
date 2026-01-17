package com.wellnest.app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TrainerFiltersDto {
    private List<String> locations;
    private List<String> specialties;
}
