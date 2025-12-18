package com.wellnest.app.service;

import com.wellnest.app.model.User;
import com.wellnest.app.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {
    private final UserRepository userRepo;

    public UserService(UserRepository userRepository) {
        this.userRepo = userRepository;
    }

    public boolean emailExists(String email){
        return userRepo.existsByEmail(email);
    }
    public User save(User user){
        return userRepo.save(user);
    }
    public Optional<User> findByEmail(String email){
        return userRepo.findByEmail(email);
    }

    public Optional<User> findByResetToken(String token){
        return userRepo.findByResetToken(token);
    }

    public User updateTargetWeight(String email, Double targetWeightKg) {
        User user = userRepo.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        user.setTargetWeightKg(targetWeightKg);
        return userRepo.save(user);
    }
}
