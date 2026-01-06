package com.wellnest.app.service;

import com.wellnest.app.dto.TrainerResponse;
import com.wellnest.app.model.Trainer;
import com.wellnest.app.repository.TrainerRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TrainerService {

    private final TrainerRepository trainerRepository;

    public TrainerService(TrainerRepository trainerRepository) {
        this.trainerRepository = trainerRepository;
    }

    // Initialize default trainers method removed to support real user data only.

    public List<TrainerResponse> getAllTrainers() {
        return trainerRepository.findAllByOrderByRatingDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<TrainerResponse> matchTrainers(String goal, String location) {
        List<Trainer> allTrainers = trainerRepository.findAll();

        return allTrainers.stream()
                .filter(trainer -> matchesGoal(trainer, goal))
                .filter(trainer -> matchesLocation(trainer, location))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private boolean matchesGoal(Trainer trainer, String goal) {
        if (goal == null || goal.equalsIgnoreCase("All")) {
            return true;
        }

        // Check if any specialty matches the goal
        boolean directMatch = trainer.getSpecialties().stream()
                .anyMatch(s -> s.toLowerCase().contains(goal.toLowerCase()));

        // Fallback logic: if goal is 'Weight Loss' and trainer has 'HIIT' or 'Cardio',
        // that's a match too
        if (!directMatch && goal.equalsIgnoreCase("Weight Loss")) {
            directMatch = trainer.getSpecialties().stream()
                    .anyMatch(s -> s.equalsIgnoreCase("HIIT") || s.equalsIgnoreCase("Cardio"));
        }

        return directMatch;
    }

    private boolean matchesLocation(Trainer trainer, String location) {
        if (location == null || location.equalsIgnoreCase("Any")) {
            return true;
        }

        if (location.equalsIgnoreCase("Online")) {
            return trainer.getLocation().equalsIgnoreCase("Online");
        }

        // If specific city, match city OR Online trainers are also available
        return trainer.getLocation().equalsIgnoreCase(location) ||
                trainer.getLocation().equalsIgnoreCase("Online");
    }

    public TrainerResponse getTrainerById(Long id) {
        return trainerRepository.findById(id)
                .map(this::toResponse)
                .orElse(null);
    }

    private TrainerResponse toResponse(Trainer trainer) {
        return new TrainerResponse(
                trainer.getId(),
                trainer.getUser().getId(),
                trainer.getName(),
                trainer.getSpecialties(),
                trainer.getExperience(),
                trainer.getRating(),
                trainer.getLocation(),
                trainer.getAvailability(),
                trainer.getBio(),
                trainer.getImage(),
                trainer.getEmail(),
                trainer.getPhone());
    }
}
