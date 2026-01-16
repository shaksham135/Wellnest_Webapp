package com.wellnest.app.controller;

import com.wellnest.app.dto.AuthResponse;
import com.wellnest.app.dto.LoginRequest;
import com.wellnest.app.dto.RegisterRequest;
import com.wellnest.app.model.User;
import com.wellnest.app.security.JwtService;
import com.wellnest.app.service.EmailService;
import com.wellnest.app.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final com.wellnest.app.repository.TrainerRepository trainerRepository;

    public AuthController(UserService userService,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            EmailService emailService,
            com.wellnest.app.repository.TrainerRepository trainerRepository) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.trainerRepository = trainerRepository;
    }

    // ---------- REGISTER ----------
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {

        if (userService.emailExists(req.getEmail())) {
            return ResponseEntity.badRequest().body("Email already in use");
        }

        String hashedPassword = passwordEncoder.encode(req.getPassword());

        String inputRole = req.getRole();
        String finalRole;

        if (inputRole == null || inputRole.isBlank()) {
            finalRole = "ROLE_USER";
        } else {
            String normalized = inputRole.trim().toUpperCase();
            switch (normalized) {
                case "TRAINER" -> finalRole = "ROLE_TRAINER";
                case "USER" -> finalRole = "ROLE_USER";
                default -> finalRole = "ROLE_USER";
            }
        }

        User user = new User();
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPassword(hashedPassword);
        user.setRole(finalRole);
        user.setPhone(req.getPhone());

        User savedUser = userService.save(user);

        // If newly registered user is a TRAINER, create a Trainer profile
        if ("ROLE_TRAINER".equals(finalRole)) {
            com.wellnest.app.model.Trainer trainer = new com.wellnest.app.model.Trainer();
            trainer.setName(savedUser.getName());
            trainer.setEmail(savedUser.getEmail());
            trainer.setPhone(savedUser.getPhone());
            trainer.setUser(savedUser);
            // Default placeholder values, user can update profile later
            String specialty = (req.getFitnessGoal() != null && !req.getFitnessGoal().isEmpty()) ? req.getFitnessGoal()
                    : "General Fitness";
            trainer.setSpecialties(java.util.List.of(specialty));
            trainer.setExperience(0);
            trainer.setRating(5.0); // New trainers start with 5.0 or 0.0? Let's give them a boost.
            trainer.setLocation("Online");
            trainer.setAvailability(java.util.List.of("Mon", "Wed", "Fri"));
            trainer.setBio("Certified fitness trainer eager to help you reach your goals.");
            trainer.setImage("https://via.placeholder.com/150"); // Placeholder image

            trainerRepository.save(trainer);
        }

        return ResponseEntity.ok("User registered successfully");
    }

    // ---------- LOGIN ----------
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            req.getEmail(),
                            req.getPassword()));

            User user = userService.findByEmail(req.getEmail()).orElseThrow();

            UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                    user.getEmail(),
                    user.getPassword(),
                    java.util.List.of(
                            new org.springframework.security.core.authority.SimpleGrantedAuthority(user.getRole())));

            String jwtToken = jwtService.generateToken(userDetails);

            boolean profileComplete = user.getAge() != null &&
                    user.getHeightCm() != null &&
                    user.getWeightKg() != null &&
                    user.getFitnessGoal() != null;

            AuthResponse response = new AuthResponse(
                    jwtToken,
                    "Login successful",
                    user.getRole(),
                    profileComplete,
                    user.getId());

            return ResponseEntity.ok(response);

        } catch (BadCredentialsException ex) {
            return ResponseEntity.status(401).body("Invalid email or password");
        }
    }

    // ---------- FORGOT PASSWORD ----------
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestParam String email) {
        Optional<User> optionalUser = userService.findByEmail(email);

        if (optionalUser.isEmpty()) {
            // security best practice: generic message
            return ResponseEntity.ok("If this email exists, a reset link has been sent.");
        }

        User user = optionalUser.get();

        String token = UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(15));

        userService.save(user);

        // send email with reset link
        emailService.sendPasswordResetEmail(user.getEmail(), token);

        return ResponseEntity.ok("If this email exists, a reset link has been sent.");
    }

    // ---------- RESET PASSWORD ----------
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestParam String token,
            @RequestParam String newPassword) {
        Optional<User> optionalUser = userService.findByResetToken(token);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest().body("Invalid reset token");
        }

        User user = optionalUser.get();

        if (user.getResetTokenExpiry() == null ||
                user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Reset token expired");
        }

        String hashed = passwordEncoder.encode(newPassword);
        user.setPassword(hashed);
        user.setResetToken(null);
        user.setResetTokenExpiry(null);

        userService.save(user);

        return ResponseEntity.ok("Password reset successfully");
    }
}
