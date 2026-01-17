package com.wellnest.app.service;

import com.wellnest.app.dto.DietPlanDto;
import com.wellnest.app.dto.TrainerFiltersDto;
import com.wellnest.app.dto.TrainerResponse;
import com.wellnest.app.dto.TrainerUpdateDto;
import com.wellnest.app.model.DietPlan;
import com.wellnest.app.model.Trainer;
import com.wellnest.app.repository.DietPlanRepository;
import com.wellnest.app.repository.TrainerRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
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

    public com.wellnest.app.dto.TrainerFiltersDto getFilters() {
        List<Trainer> all = trainerRepository.findAll();
        List<String> locations = all.stream()
                .map(Trainer::getLocation)
                .filter(l -> l != null && !l.isEmpty())
                .distinct()
                .sorted()
                .collect(Collectors.toList());

        List<String> specialties = all.stream()
                .flatMap(t -> t.getSpecialties().stream())
                .distinct()
                .sorted()
                .collect(Collectors.toList());

        return new com.wellnest.app.dto.TrainerFiltersDto(locations, specialties);
    }

    public TrainerResponse updateProfile(String email, com.wellnest.app.dto.TrainerUpdateDto dto) {
        Trainer trainer = trainerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Trainer not found"));

        if (dto.getLocation() != null)
            trainer.setLocation(dto.getLocation());
        if (dto.getBio() != null)
            trainer.setBio(dto.getBio());
        if (dto.getSpecialties() != null)
            trainer.setSpecialties(dto.getSpecialties());

        return toResponse(trainerRepository.save(trainer));
    }

    @Autowired
    private DietPlanRepository dietPlanRepository;

    public void saveDietPlan(String trainerEmail, DietPlanDto dto) {
        Trainer trainer = trainerRepository.findByEmail(trainerEmail)
                .orElseThrow(() -> new RuntimeException("Trainer not found"));

        // Verify connection exists? (Optional but good practice)
        // For now, assume if they have the ID, they can set it.

        Optional<DietPlan> existing = dietPlanRepository.findByTrainerIdAndUserId(trainer.getId(), dto.getClientId());
        DietPlan plan = existing.orElse(new DietPlan());

        plan.setTrainerId(trainer.getId());
        plan.setUserId(dto.getClientId());
        plan.setBreakfast(dto.getBreakfast());
        plan.setLunch(dto.getLunch());
        plan.setDinner(dto.getDinner());
        plan.setSnacks(dto.getSnacks());
        plan.setAdditionalNotes(dto.getAdditionalNotes());
        plan.setUpdatedAt(LocalDateTime.now());

        dietPlanRepository.save(plan);
    }

    public DietPlanDto getDietPlan(Long trainerId, Long clientId) {
        DietPlan plan = dietPlanRepository.findByTrainerIdAndUserId(trainerId, clientId)
                .orElse(null);

        if (plan == null)
            return null;

        DietPlanDto dto = new DietPlanDto();
        dto.setTrainerId(plan.getTrainerId());
        dto.setClientId(plan.getUserId());
        dto.setBreakfast(plan.getBreakfast());
        dto.setLunch(plan.getLunch());
        dto.setDinner(plan.getDinner());
        dto.setSnacks(plan.getSnacks());
        dto.setAdditionalNotes(plan.getAdditionalNotes());
        return dto;
    }

    public TrainerResponse rateTrainer(Long trainerId, Double rating) {
        Trainer trainer = trainerRepository.findById(trainerId)
                .orElseThrow(() -> new RuntimeException("Trainer not found"));

        double currentTotal = (trainer.getRating() != null ? trainer.getRating() : 0.0)
                * (trainer.getRatingCount() != null ? trainer.getRatingCount() : 0);
        int newCount = (trainer.getRatingCount() != null ? trainer.getRatingCount() : 0) + 1;

        double newAvg = (currentTotal + rating) / newCount;
        newAvg = Math.round(newAvg * 10.0) / 10.0;

        trainer.setRating(newAvg);
        trainer.setRatingCount(newCount);

        return toResponse(trainerRepository.save(trainer));
    }
}
