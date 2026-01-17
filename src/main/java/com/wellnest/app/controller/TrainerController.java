package com.wellnest.app.controller;

import com.wellnest.app.dto.TrainerResponse;
import com.wellnest.app.service.TrainerService;
import com.wellnest.app.dto.DietPlanDto;
import com.wellnest.app.service.UserService;
import com.wellnest.app.repository.TrainerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trainers")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class TrainerController {

    @Autowired
    private TrainerService trainerService;

    @Autowired
    private UserService userService;

    @Autowired
    private TrainerRepository trainerRepository;

    // GET /api/trainers - Get all trainers
    @GetMapping
    public ResponseEntity<List<TrainerResponse>> getAllTrainers() {
        List<TrainerResponse> trainers = trainerService.getAllTrainers();
        return ResponseEntity.ok(trainers);
    }

    // GET /api/trainers/match - Match trainers based on goal and location filters
    @GetMapping("/match")
    public ResponseEntity<List<TrainerResponse>> matchTrainers(
            @RequestParam(required = false, defaultValue = "All") String goal,
            @RequestParam(required = false, defaultValue = "Any") String location) {
        List<TrainerResponse> trainers = trainerService.matchTrainers(goal, location);
        return ResponseEntity.ok(trainers);
    }

    // GET /api/trainers/{id} - Get a specific trainer by ID
    @GetMapping("/{id}")
    public ResponseEntity<TrainerResponse> getTrainerById(@PathVariable Long id) {
        TrainerResponse trainer = trainerService.getTrainerById(id);
        if (trainer == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(trainer);
    }

    @GetMapping("/filters")
    public ResponseEntity<com.wellnest.app.dto.TrainerFiltersDto> getFilters() {
        return ResponseEntity.ok(trainerService.getFilters());
    }

    @PutMapping("/profile")
    public ResponseEntity<TrainerResponse> updateProfile(
            @RequestBody com.wellnest.app.dto.TrainerUpdateDto dto,
            org.springframework.security.core.Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(trainerService.updateProfile(email, dto));
    }

    @PostMapping("/diet-plan")
    public ResponseEntity<String> saveDietPlan(@RequestBody DietPlanDto dietPlanDto, Authentication authentication) {
        String email = authentication.getName();
        trainerService.saveDietPlan(email, dietPlanDto);
        return ResponseEntity.ok("Diet plan saved successfully");
    }

    @GetMapping("/diet-plan/client/{clientId}")
    public ResponseEntity<DietPlanDto> getDietPlanForClient(@PathVariable Long clientId,
            Authentication authentication) {
        String email = authentication.getName();
        // Improve: get trainer ID from email to be safe
        com.wellnest.app.model.Trainer trainer = trainerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Trainer not found"));

        DietPlanDto plan = trainerService.getDietPlan(trainer.getId(), clientId);
        return ResponseEntity.ok(plan);
    }

    @GetMapping("/diet-plan/trainer/{trainerId}")
    public ResponseEntity<DietPlanDto> getDietPlanForTrainer(@PathVariable Long trainerId,
            Authentication authentication) {
        String email = authentication.getName();
        com.wellnest.app.model.User user = userService.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        DietPlanDto plan = trainerService.getDietPlan(trainerId, user.getId());
        return ResponseEntity.ok(plan);
    }

    @PostMapping("/{id}/rate")
    public ResponseEntity<TrainerResponse> rateTrainer(
            @PathVariable Long id,
            @RequestBody com.wellnest.app.dto.RatingDto ratingDto) {
        return ResponseEntity.ok(trainerService.rateTrainer(id, ratingDto.getRating()));
    }
}
