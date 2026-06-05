package com.wellnest.app.controller;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.wellnest.app.dto.AuthResponse;
import com.wellnest.app.dto.GoogleAuthRequest;
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
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AuthController.class);

    @org.springframework.beans.factory.annotation.Value("${google.client.id}")
    private String googleClientId;

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

    // Exception handling is delegated to GlobalExceptionHandler

    // ---------- VALIDATION ERROR HANDLER ----------
    @org.springframework.web.bind.annotation.ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(err -> {
            String field = err instanceof FieldError ? ((FieldError) err).getField() : err.getObjectName();
            errors.put(field, err.getDefaultMessage());
        });
        // Return first error as a simple message string for frontend compatibility
        String firstMsg = errors.values().stream().findFirst().orElse("Validation failed");
        return ResponseEntity.badRequest().body(firstMsg);
    }

    // ---------- REGISTER ----------
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        // Sanitise — normalise email to lowercase, trim name
        String email = req.getEmail().trim().toLowerCase();
        String name  = req.getName().trim();
        String phone = (req.getPhone() != null) ? req.getPhone().trim() : null;

        if (userService.emailExists(email)) {
            return ResponseEntity.badRequest().body("This email is already registered. Please log in instead.");
        }

        String hashedPassword = passwordEncoder.encode(req.getPassword());

        // Always USER from public registration — trainer/admin added only via admin panel
        String finalRole = "ROLE_USER";

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(hashedPassword);
        user.setRole(finalRole);
        user.setPhone(phone);
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

    @org.springframework.beans.factory.annotation.Value("${admin.username:admin123@gmail.com}")
    private String adminUsername;

    @org.springframework.beans.factory.annotation.Value("${admin.password:admin123}")
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

    // ---------- GOOGLE LOGIN / REGISTER ----------
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody GoogleAuthRequest req) {
        try {
            String email = null;
            String name = null;

            try {
                String clientId = googleClientId;
                GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                        .setAudience(Collections.singletonList(clientId))
                        .build();

                GoogleIdToken idToken = verifier.verify(req.getToken());
                if (idToken != null) {
                    GoogleIdToken.Payload payload = idToken.getPayload();
                    email = payload.getEmail();
                    name = (String) payload.get("name");
                }
            } catch (Exception e) {
                // Ignore, token might be an Access Token
            }

            if (email == null) {
                // Attempt to use token as Access Token to fetch UserInfo
                try {
                    org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
                    org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                    headers.setBearerAuth(req.getToken());
                    org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>("", headers);
                    ResponseEntity<java.util.Map> response = restTemplate.exchange(
                            "https://www.googleapis.com/oauth2/v3/userinfo", 
                            org.springframework.http.HttpMethod.GET, 
                            entity, 
                            java.util.Map.class
                    );
                    if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                        email = (String) response.getBody().get("email");
                        name = (String) response.getBody().get("name");
                    }
                } catch (Exception e) {
                    System.err.println("Access Token Verification Failed: " + e.getMessage());
                }
            }

            if (email != null) {
                Optional<User> existingUserOpt = userService.findByEmail(email);
                User user;

                if (existingUserOpt.isPresent()) {
                    user = existingUserOpt.get();
                    System.out.println("GOOGLE LOGIN: Existing user found: " + email);
                } else {
                    System.out.println("GOOGLE LOGIN: Registering new user: " + email);
                    user = new User();
                    user.setEmail(email);
                    user.setName(name != null ? name : email.substring(0, email.indexOf("@")));
                    String randomPassword = UUID.randomUUID().toString();
                    user.setPassword(passwordEncoder.encode(randomPassword));
                    
                    String finalRole = "ROLE_USER";
                    if (req.getRole() != null && req.getRole().equalsIgnoreCase("TRAINER")) {
                        finalRole = "ROLE_TRAINER";
                    }
                    user.setRole(finalRole);
                    user.setVerified(true);
                    
                    if ("ROLE_TRAINER".equals(finalRole)) {
                        com.wellnest.app.model.Trainer trainer = new com.wellnest.app.model.Trainer();
                        trainer.setName(user.getName());
                        trainer.setEmail(user.getEmail());
                        
                        String specialty = (req.getFitnessGoal() != null && !req.getFitnessGoal().isEmpty()) 
                                ? req.getFitnessGoal() : "General Fitness";
                        trainer.setSpecialties(new java.util.ArrayList<>(java.util.List.of(specialty)));
                        trainer.setExperience(0);
                        trainer.setRating(5.0);
                        trainer.setLocation("Online");
                        trainer.setAvailability(new java.util.ArrayList<>(java.util.List.of("Mon", "Wed", "Fri")));
                        trainer.setBio("Certified fitness trainer eager to help you reach your goals.");
                        trainer.setImage("https://via.placeholder.com/150");
                        
                        userService.registerTrainer(user, trainer);
                    } else {
                        userService.save(user);
                    }
                }

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
                        "Google Login successful",
                        user.getRole(),
                        profileComplete,
                        user.getId(),
                        user.isVerified(),
                        user.isPremium(),
                        user.getPremiumAccessType() != null ? user.getPremiumAccessType() : (user.isPremium() ? "PAID_PREMIUM" : "FREE")));

            } else {
                return ResponseEntity.status(401).body("Invalid Google token.");
            }
        } catch (Exception e) {
            System.err.println("GOOGLE LOGIN ERROR: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Internal Server Error during Google Auth");
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
                            true, // isVerified
                            true  // Admin is always premium
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
                    user.isVerified(),
                    user.isPremium(),
                    user.getPremiumAccessType() != null ? user.getPremiumAccessType() : (user.isPremium() ? "PAID_PREMIUM" : "FREE")));

        } catch (BadCredentialsException ex) {
            System.out.println("LOGIN FAILED: Bad credentials for database user.");
            return ResponseEntity.status(401).body("Invalid email or password");
        } catch (Exception e) {
            System.err.println("LOGIN ERROR: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Internal Login Error: " + e.getMessage());
        }
    }

    // ---------- FORGOT PASSWORD (OTP) ----------
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestParam String email) {
        Optional<User> optionalUser = userService.findByEmail(email);

        if (optionalUser.isEmpty()) {
            // security best practice: generic message
            return ResponseEntity.ok("If this email exists, an OTP has been sent.");
        }

        User user = optionalUser.get();

        // Generate 6-digit OTP
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        user.setResetToken(otp); // Repurposing resetToken field to store the OTP
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(10));

        userService.save(user);

        // send email with the OTP
        emailService.sendPasswordResetEmail(user.getEmail(), otp);
        
        log.debug("PASSWORD RESET OTP FOR {} IS: {}", user.getEmail(), otp);

        return ResponseEntity.ok("If this email exists, an OTP has been sent.");
    }

    // ---------- RESET PASSWORD (OTP) ----------
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestParam String token,
            @RequestParam String newPassword) {
        // Here `token` from the URL parameter will actually be the 6-digit OTP typed by the user
        Optional<User> optionalUser = userService.findByResetToken(token);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest().body("Invalid or expired OTP");
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
