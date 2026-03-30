package com.wellnest.app.controller;

import com.wellnest.app.model.User;
import com.wellnest.app.model.Trainer;
import com.wellnest.app.repository.UserRepository;
import com.wellnest.app.repository.TrainerRepository;
import com.wellnest.app.dto.TrainerResponse;
import com.wellnest.app.service.NotificationService;
import com.wellnest.app.service.TrainerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final TrainerRepository trainerRepository;
    private final com.wellnest.app.service.UserService userService;
    private final com.wellnest.app.service.BlogService blogService;
    private final com.wellnest.app.service.TrackerService trackerService;
    private final TrainerService trainerService;
    private final NotificationService notificationService;

    public AdminController(UserRepository userRepository, TrainerRepository trainerRepository,
            com.wellnest.app.service.UserService userService,
            com.wellnest.app.service.BlogService blogService,
            com.wellnest.app.service.TrackerService trackerService,
            TrainerService trainerService,
            NotificationService notificationService) {
        this.userRepository = userRepository;
        this.trainerRepository = trainerRepository;
        this.userService = userService;
        this.blogService = blogService;
        this.trackerService = trackerService;
        this.trainerService = trainerService;
        this.notificationService = notificationService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        // Self-heal: If a trainer is verified but user is not, sync them
        boolean changed = false;
        for (User user : users) {
            if ("ROLE_TRAINER".equals(user.getRole()) && !user.isVerified()) {
                java.util.Optional<Trainer> trainerOpt = trainerRepository.findByEmail(user.getEmail());
                if (trainerOpt.isPresent() && trainerOpt.get().isVerified()) {
                    user.setVerified(true);
                    user.setVerificationRequested(false);
                    userRepository.save(user);
                    changed = true;
                }
            }
        }
        // If we fixed anything, return fresh list
        if (changed) return ResponseEntity.ok(userRepository.findAll());
        return ResponseEntity.ok(users);
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

    // GET /api/admin/trainers/pending-verifications — list trainers awaiting cert review
    @GetMapping("/trainers/pending-verifications")
    public ResponseEntity<List<Trainer>> getPendingVerifications() {
        List<Trainer> pending = trainerRepository.findByVerificationRequestedTrue();
        return ResponseEntity.ok(pending);
    }

    // PUT /api/admin/trainers/{id}/verify — approve a trainer's verification
    @PutMapping("/trainers/{id}/verify")
    public ResponseEntity<?> verifyTrainer(@PathVariable Long id) {
        return trainerRepository.findById(id).map(trainer -> {
            trainer.setVerified(true);
            trainer.setVerificationRequested(false);
            
            // Sync with User entity (Robust sync)
            User user = trainer.getUser();
            if (user == null && trainer.getEmail() != null) {
                user = userRepository.findByEmail(trainer.getEmail()).orElse(null);
            }
            
            if (user != null) {
                user.setVerified(true);
                user.setVerificationRequested(false);
                userRepository.save(user);
            }
            
            trainerRepository.save(trainer);
            
            // Notify Trainer
            if (user != null) {
                notificationService.createNotification(user.getId(), "Verification Approved!", 
                    "Congratulations! Your trainer profile has been verified. You can now connect with clients.", "SUCCESS");
            }
            
            return ResponseEntity.ok("Trainer verified successfully");
        }).orElse(ResponseEntity.notFound().build());
    }

    // PUT /api/admin/trainers/{id}/reject — reject a trainer's verification request
    @PutMapping("/trainers/{id}/reject")
    public ResponseEntity<?> rejectTrainerVerification(@PathVariable Long id) {
        return trainerRepository.findById(id).map(trainer -> {
            trainer.setVerified(false);
            trainer.setVerificationRequested(false);
            
            // Sync with User entity (Robust sync)
            User user = trainer.getUser();
            if (user == null && trainer.getEmail() != null) {
                user = userRepository.findByEmail(trainer.getEmail()).orElse(null);
            }
            
            if (user != null) {
                user.setVerified(false);
                user.setVerificationRequested(false);
                userRepository.save(user);
            }
            
            // Clear the certificates on rejection so trainer can re-upload
            trainer.setCertificate1(null);
            trainer.setCertificate2(null);
            trainer.setCertificate3(null);
            trainerRepository.save(trainer);

            // Notify Trainer
            if (user != null) {
                notificationService.createNotification(user.getId(), "Verification Rejected", 
                    "Your trainer verification request was rejected. Please ensure your certificates are valid and try again.", "ALERT");
            }

            return ResponseEntity.ok("Trainer verification request rejected");
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/notifications/broadcast")
    public ResponseEntity<?> broadcastNotification(@RequestBody java.util.Map<String, String> payload) {
        String title = payload.get("title");
        String message = payload.get("message");
        String type = payload.getOrDefault("type", "INFO");

        if (title == null || message == null) {
            return ResponseEntity.badRequest().body("Title and Message are required");
        }

        notificationService.notifyAllUsers(title, message, type);
        return ResponseEntity.accepted().body("Notification broadcasted successfully to all users");
    }
}
