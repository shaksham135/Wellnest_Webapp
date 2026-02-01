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

    // ---------- EXCEPTION HANDLER ----------
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleException(Exception e) {
        System.err.println("AUTH CONTROLLER EXCEPTION: " + e.getMessage());
        e.printStackTrace();
        return ResponseEntity.status(500).body("Global Auth Error: " + e.getMessage());
    }

    // ---------- REGISTER ----------
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        System.out.println(
                "DEBUG REGISTER: " + req.getEmail() + " Role: " + req.getRole() + " Goal: " + req.getFitnessGoal());

        if (userService.emailExists(req.getEmail())) {
            System.out.println("DEBUG REGISTER: Email already exists: " + req.getEmail());
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
        user.setFitnessGoal(req.getFitnessGoal());

        if ("ROLE_TRAINER".equals(finalRole)) {
            com.wellnest.app.model.Trainer trainer = new com.wellnest.app.model.Trainer();
            trainer.setName(user.getName());
            trainer.setEmail(user.getEmail());
            trainer.setPhone(user.getPhone());

            // Default placeholder values, user can update profile later
            String specialty = (req.getFitnessGoal() != null && !req.getFitnessGoal().isEmpty()) ? req.getFitnessGoal()
                    : "General Fitness";
            trainer.setSpecialties(new java.util.ArrayList<>(java.util.List.of(specialty)));
            trainer.setExperience(0);
            trainer.setRating(5.0); // New trainers start with 5.0 or 0.0? Let's give them a boost.
            trainer.setLocation("Online");
            trainer.setAvailability(new java.util.ArrayList<>(java.util.List.of("Mon", "Wed", "Fri")));
            trainer.setBio("Certified fitness trainer eager to help you reach your goals.");
            trainer.setImage("https://via.placeholder.com/150"); // Placeholder image

            try {
                userService.registerTrainer(user, trainer);
            } catch (Exception e) {
                System.out.println("DEBUG REGISTER ERROR: " + e.getMessage());
                e.printStackTrace();
                return ResponseEntity.status(500).body("Registration failed: " + e.getMessage());
            }
        } else {
            try {
                userService.save(user);
            } catch (Exception e) {
                return ResponseEntity.status(500).body("Registration failed: " + e.getMessage());
            }
        }

        return ResponseEntity.ok("User registered successfully");
    }

    @org.springframework.beans.factory.annotation.Value("${admin.username}")
    private String adminUsername;

    @org.springframework.beans.factory.annotation.Value("${admin.password}")
    private String adminPassword;

    @jakarta.annotation.PostConstruct
    public void init() {
        String email = (adminUsername != null && !adminUsername.isBlank()) ? adminUsername : "admin123@gmail.com";
        String pass = (adminPassword != null && !adminPassword.isBlank()) ? adminPassword : "admin123";

        System.out.println("AUTH CONTROLLER INIT: Checking AdminUser=" + email);

        if (!userService.emailExists(email)) {
            System.out.println("Creating Admin User in DB...");
            User admin = new User();
            admin.setName("Admin");
            admin.setEmail(email);
            admin.setPassword(passwordEncoder.encode(pass));
            admin.setRole("ROLE_ADMIN");
            admin.setVerified(true);
            admin.setAge(30);
            admin.setHeightCm(175.0);
            admin.setWeightKg(70.0);
            admin.setFitnessGoal("MAINTENANCE");
            admin.setGender("Male");

            userService.save(admin);
            System.out.println("Admin User created successfully.");
        }
    }

    // ---------- LOGIN ----------
    @PostMapping(value = "/login", consumes = "application/json", produces = "application/json")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        try {
            // Trim inputs to avoid whitespace issues
            String email = (req.getEmail() != null) ? req.getEmail().trim() : "";
            String password = (req.getPassword() != null) ? req.getPassword().trim() : "";

            System.out.println("LOGIN ATTEMPT: " + email);

            // 1. Check Admin Credentials (Properties/Hardcoded Fallback)
            String effectiveAdminUser = (adminUsername != null && !adminUsername.isBlank()) ? adminUsername
                    : "admin123@gmail.com";
            String effectiveAdminPass = (adminPassword != null && !adminPassword.isBlank()) ? adminPassword
                    : "admin123";

            if (email.equalsIgnoreCase(effectiveAdminUser)) {
                if (password.equals(effectiveAdminPass)) {
                    System.out.println("LOGIN SUCCESS: Admin user verified via properties.");

                    UserDetails adminDetails = new org.springframework.security.core.userdetails.User(
                            effectiveAdminUser,
                            "",
                            java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                    "ROLE_ADMIN")));

                    String jwtToken = jwtService.generateToken(adminDetails);

                    // Fetch real ID from DB if possible
                    Long adminId = 0L;
                    Optional<User> dbAdmin = userService.findByEmail(effectiveAdminUser);
                    if (dbAdmin.isPresent()) {
                        adminId = dbAdmin.get().getId();
                    }

                    return ResponseEntity.ok(new AuthResponse(
                            jwtToken,
                            "Admin Login Successful",
                            "ROLE_ADMIN",
                            true,
                            adminId,
                            true // isVerified
                    ));
                } else {
                    System.out.println("LOGIN FAILED: Admin password mismatch.");
                    return ResponseEntity.status(401).body("Invalid email or password");
                }
            }

            // 2. Database User Authentication
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password));

            User user = userService.findByEmail(email).orElseThrow();
            System.out.println("LOGIN SUCCESS: Database user found: " + user.getEmail());

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

            return ResponseEntity.ok(new AuthResponse(
                    jwtToken,
                    "Login successful",
                    user.getRole(),
                    profileComplete,
                    user.getId(),
                    user.isVerified()));

        } catch (BadCredentialsException ex) {
            System.out.println("LOGIN FAILED: Bad credentials for database user.");
            return ResponseEntity.status(401).body("Invalid email or password");
        } catch (Exception e) {
            System.err.println("LOGIN ERROR: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Internal Login Error: " + e.getMessage());
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
