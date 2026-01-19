package com.wellnest.app.service;

import com.wellnest.app.model.User;
import com.wellnest.app.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {
    private final UserRepository userRepo;
    private final com.wellnest.app.repository.TrainerRepository trainerRepo;
    private final com.wellnest.app.repository.WeightLogRepository weightLogRepository;

    public UserService(UserRepository userRepository, com.wellnest.app.repository.TrainerRepository trainerRepo,
            com.wellnest.app.repository.WeightLogRepository weightLogRepository) {
        this.userRepo = userRepository;
        this.trainerRepo = trainerRepo;
        this.weightLogRepository = weightLogRepository;
    }

    public boolean emailExists(String email) {
        return userRepo.existsByEmail(email);
    }

    public User save(User user) {
        return userRepo.save(user);
    }

    public Optional<User> findByEmail(String email) {
        return userRepo.findByEmail(email);
    }

    public Optional<User> findByResetToken(String token) {
        return userRepo.findByResetToken(token);
    }

    public User updateTargetWeight(String email, Double targetWeightKg) {
        User user = userRepo.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        user.setTargetWeightKg(targetWeightKg);
        return userRepo.save(user);
    }

    public void updateWeight(User user, Double newWeight) {
        java.time.LocalDate today = java.time.LocalDate.now();
        java.util.List<com.wellnest.app.model.WeightLog> logs = weightLogRepository
                .findByUserIdOrderByLogDateAsc(user.getId());

        // 1. Handle "No History" or "Only Today's History"
        if (logs.isEmpty()) {
            // Case A: Absolutely no logs. Backfill existing weight to Yesterday.
            java.time.LocalDate startDate = user.getCreatedAt() != null
                    ? user.getCreatedAt().toLocalDate()
                    : today.minusDays(1);

            if (!startDate.isBefore(today)) {
                startDate = today.minusDays(1);
            }
            // Use current user weight as the "start", or newWeight if null (edge case)
            Double startWeight = user.getWeightKg() != null ? user.getWeightKg() : newWeight;

            com.wellnest.app.model.WeightLog initialLog = new com.wellnest.app.model.WeightLog(user, startWeight,
                    startDate);
            weightLogRepository.save(initialLog);

        } else {
            // Case B: We have logs, but maybe they are all from Today?
            boolean hasHistory = logs.stream().anyMatch(l -> l.getLogDate().isBefore(today));

            if (!hasHistory) {
                // All logs are from today. We need to push the EARLIEST one to Yesterday used
                // as an anchor.
                com.wellnest.app.model.WeightLog firstLog = logs.get(0);
                firstLog.setLogDate(today.minusDays(1));
                weightLogRepository.save(firstLog);

                // If there were others from today, we might want to delete them to avoid
                // clutter,
                // but standard overwrite logic below handles "Today".
            }
        }

        // 2. Clear pre-existing logs for TODAY (Standard "One Log Per Day" rule)
        // We re-fetch or filter because we might have just modified one above.
        java.util.List<com.wellnest.app.model.WeightLog> todayLogs = weightLogRepository
                .findByUserIdAndLogDateBetween(user.getId(), today, today);
        if (!todayLogs.isEmpty()) {
            weightLogRepository.deleteAll(todayLogs);
        }

        // 3. Log the NEW weight for TODAY
        com.wellnest.app.model.WeightLog newLog = new com.wellnest.app.model.WeightLog(user, newWeight, today);
        weightLogRepository.save(newLog);

        // 4. Update User entity
        user.setWeightKg(newWeight);
        userRepo.save(user);
    }

    public void clearWeightHistory(User user) {
        java.util.List<com.wellnest.app.model.WeightLog> logs = weightLogRepository
                .findByUserIdOrderByLogDateAsc(user.getId());
        weightLogRepository.deleteAll(logs);

        // After clearing, we should probably re-initialize the current weight as the
        // "start"
        // effectively resetting the journey to today.
        // We do this by calling updateWeight with the current weight.
        if (user.getWeightKg() != null) {
            updateWeight(user, user.getWeightKg());
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public void registerTrainer(User user, com.wellnest.app.model.Trainer trainer) {
        User savedUser = userRepo.save(user);
        trainer.setUser(savedUser);
        trainerRepo.save(trainer);
    }
}
