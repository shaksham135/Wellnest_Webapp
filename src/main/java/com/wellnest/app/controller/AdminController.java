package com.wellnest.app.controller;

import com.wellnest.app.model.User;
import com.wellnest.app.model.Trainer;
import com.wellnest.app.repository.UserRepository;
import com.wellnest.app.repository.TrainerRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class AdminController {

    private final UserRepository userRepository;
    private final TrainerRepository trainerRepository;
    private final com.wellnest.app.service.UserService userService;
    private final com.wellnest.app.service.BlogService blogService;
    private final com.wellnest.app.service.TrackerService trackerService;

    public AdminController(UserRepository userRepository, TrainerRepository trainerRepository,
            com.wellnest.app.service.UserService userService,
            com.wellnest.app.service.BlogService blogService,
            com.wellnest.app.service.TrackerService trackerService) {
        this.userRepository = userRepository;
        this.trainerRepository = trainerRepository;
        this.userService = userService;
        this.blogService = blogService;
        this.trackerService = trackerService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/trainers")
    public ResponseEntity<List<Trainer>> getAllTrainers() {
        return ResponseEntity.ok(trainerRepository.findAll());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        User user = userRepository.findById(id).get();

        // 1. Cleanup Blog Content (Posts, Comments, Likes)
        blogService.cleanupUserContent(id);

        // 2. Cleanup Weight Logs & Tracker Data
        userService.clearWeightHistory(user);
        trackerService.cleanupUserData(id);

        // 3. Delete Trainer Profile if exists
        trainerRepository.findByUserId(id).ifPresent(trainerRepository::delete);

        // 4. Delete User
        userRepository.deleteById(id);
        return ResponseEntity.ok("User deleted successfully");
    }

    @DeleteMapping("/trainers/{id}")
    public ResponseEntity<?> deleteTrainer(@PathVariable Long id) {
        return trainerRepository.findById(id).map(trainer -> {
            User user = trainer.getUser();
            trainerRepository.delete(trainer);

            // Also delete the user account associated with this trainer
            if (user != null) {
                blogService.cleanupUserContent(user.getId());
                userService.clearWeightHistory(user);
                trackerService.cleanupUserData(user.getId());
                userRepository.delete(user);
            }
            return ResponseEntity.ok("Trainer (and associated user) deleted successfully");
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}/verify")
    public ResponseEntity<?> toggleVerification(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            boolean newStatus = !user.isVerified();
            user.setVerified(newStatus);
            // If verified, request is fulfilled
            if (newStatus) {
                user.setVerificationRequested(false);
            }
            userRepository.save(user);
            return ResponseEntity.ok("User verification status updated to: " + newStatus);
        }).orElse(ResponseEntity.notFound().build());
    }
}
