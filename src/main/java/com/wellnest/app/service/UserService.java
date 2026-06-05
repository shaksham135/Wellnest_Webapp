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
        java.time.LocalDateTime now = java.time.LocalDateTime.now();

        // 1. Time-frequency validation (12-hour limit with 5-minute grace period)
        if (user.getWeightLastChangedAt() != null) {
            java.time.LocalDateTime lastChange = user.getWeightLastChangedAt();
            if (lastChange.plusMinutes(5).isBefore(now) && lastChange.plusHours(12).isAfter(now)) {
                long secondsRemaining = java.time.Duration.between(now, lastChange.plusHours(12)).getSeconds();
                long hours = secondsRemaining / 3600;
                long minutes = (secondsRemaining % 3600) / 60;
                String timeMsg = (hours > 0 ? hours + "h " : "") + minutes + "m";
                throw new IllegalArgumentException("Weight can only be updated once every 12 hours. Please wait " + timeMsg + ".");
            }
        }

        // 2. Drastic change validation (20% threshold, skip if within grace period)
        if (user.getWeightKg() != null && user.getWeightKg() > 0) {
            double prevWeight = user.getWeightKg();
            double diffPercent = Math.abs(newWeight - prevWeight) / prevWeight;
            boolean isGracePeriod = user.getWeightLastChangedAt() != null && user.getWeightLastChangedAt().plusMinutes(5).isAfter(now);
            if (!isGracePeriod && diffPercent > 0.20) {
                throw new IllegalArgumentException("Weight change is too drastic. New weight must be within 20% of your last recorded weight (" + prevWeight + " kg).");
            }
        }

        java.time.LocalDate today = java.time.LocalDate.now();
        java.util.List<com.wellnest.app.model.WeightLog> logs = weightLogRepository
                .findByUserIdOrderByLogDateAsc(user.getId());

        // 3. Handle "No History" or "Only Today's History"
        if (logs.isEmpty()) {
            // Case A: Absolutely no logs. Backfill existing weight to Yesterday.
            java.time.LocalDate startDate = user.getCreatedAt() != null
                    ? user.getCreatedAt().toLocalDate()
                    : today.minusDays(1);

            if (!startDate.isBefore(today)) {
                startDate = today.minusDays(1);
            }
            // Use current user weight as the "start", or newWeight if null/0 (edge case)
            Double startWeight = (user.getWeightKg() != null && user.getWeightKg() > 0) ? user.getWeightKg() : newWeight;

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

        // 4. Clear pre-existing logs for TODAY (Standard "One Log Per Day" rule)
        // We re-fetch or filter because we might have just modified one above.
        java.util.List<com.wellnest.app.model.WeightLog> todayLogs = weightLogRepository
                .findByUserIdAndLogDateBetween(user.getId(), today, today);
        if (!todayLogs.isEmpty()) {
            weightLogRepository.deleteAll(todayLogs);
        }

        // 5. Log the NEW weight for TODAY
        com.wellnest.app.model.WeightLog newLog = new com.wellnest.app.model.WeightLog(user, newWeight, today);
        weightLogRepository.save(newLog);

        // 6. Update User entity
        user.setWeightKg(newWeight);
        user.setWeightLastChangedAt(now);
        userRepo.save(user);
    }

    public void clearWeightHistory(User user) {
        java.util.List<com.wellnest.app.model.WeightLog> logs = weightLogRepository
                .findByUserIdOrderByLogDateAsc(user.getId());
        weightLogRepository.deleteAll(logs);

        // Reset the weight change timer on history clear
        user.setWeightLastChangedAt(null);
        userRepo.save(user);

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

    @org.springframework.transaction.annotation.Transactional
    public void addXp(User user, int xpAmount) {
        // Check XP Booster — double XP if active
        boolean boosterActive = user.getXpBoosterExpiry() != null &&
                user.getXpBoosterExpiry().isAfter(java.time.LocalDateTime.now());
        int effectiveXp = boosterActive ? xpAmount * 2 : xpAmount;

        int currentXp = user.getXp() + effectiveXp;
        int currentLevel = user.getLevel();
        int requiredXp = currentLevel * 100; // Level 1 needs 100XP, Level 2 needs 200XP, etc.

        int coinsEarned = 0;
        while (currentXp >= requiredXp) {
            currentXp -= requiredXp;
            currentLevel++;
            coinsEarned += currentLevel * 10; // Level up bonus coins (doubled from 5 to 10)
            requiredXp = currentLevel * 100;
        }

        user.setXp(currentXp);
        // Improved coin rate: xp/5 (was xp/10), + level-up bonus
        int passiveCoins = effectiveXp / 5;
        if (currentLevel > user.getLevel()) {
            user.setLevel(currentLevel);
            user.setCoins(user.getCoins() + coinsEarned + passiveCoins);

            // League update logic based on level
            if (currentLevel >= 15) {
                user.setLeague("Diamond");
            } else if (currentLevel >= 10) {
                user.setLeague("Gold");
            } else if (currentLevel >= 5) {
                user.setLeague("Silver");
            } else {
                user.setLeague("Bronze");
            }
        } else {
            user.setCoins(user.getCoins() + passiveCoins);
        }
        userRepo.save(user);
    }

    @org.springframework.transaction.annotation.Transactional
    public java.util.Map<String, Object> purchaseItem(User user, String itemId) {
        java.util.Map<String, Object> result = new java.util.HashMap<>();

        int cost;
        switch (itemId) {
            case "streak_shield":   cost = 30;  break;
            case "xp_booster":     cost = 75;  break;
            case "premium_badge":  cost = 75;  break; // 75 Coins Elite Badge
            case "theme_emerald":  cost = 50;  break; // Emerald Theme
            case "theme_gold":     cost = 50;  break; // Gold Theme
            case "theme_default":  cost = 0;   break; // Default Theme
            default:
                result.put("success", false);
                result.put("message", "Unknown item");
                return result;
        }

        // Check ownership so that "buying" an owned theme/badge acts as "Equip" (0 cost)
        boolean alreadyOwned = false;
        if ("premium_badge".equals(itemId) && user.isHasPremiumBadge()) {
            alreadyOwned = true;
        } else if ("theme_gold".equals(itemId) && user.isHasGoldTheme()) {
            alreadyOwned = true;
        } else if ("theme_emerald".equals(itemId) && user.isHasEmeraldTheme()) {
            alreadyOwned = true;
        } else if ("theme_default".equals(itemId)) {
            alreadyOwned = true;
        }

        int costToCharge = alreadyOwned ? 0 : cost;

        if (user.getCoins() < costToCharge) {
            result.put("success", false);
            result.put("message", "Not enough coins! You need " + costToCharge + " 🪙");
            return result;
        }

        // Deduct coins
        user.setCoins(user.getCoins() - costToCharge);

        // Grant or equip item
        switch (itemId) {
            case "streak_shield":
                user.setStreakShieldCount(user.getStreakShieldCount() + 1);
                result.put("message", "🛡️ Streak Shield activated! Your streak is protected for 1 day.");
                break;
            case "xp_booster":
                // 24 hours of 2x XP
                user.setXpBoosterExpiry(java.time.LocalDateTime.now().plusHours(24));
                result.put("message", "⚡ XP Booster active! Earn 2x XP for the next 24 hours.");
                break;
            case "premium_badge":
                user.setHasPremiumBadge(true);
                result.put("message", "👑 Elite Badge equipped! It now shows next to your name.");
                break;
            case "theme_emerald":
                user.setHasEmeraldTheme(true);
                user.setActiveTheme("emerald");
                result.put("message", alreadyOwned ? "🌿 Emerald Theme equipped!" : "🌿 Emerald Theme purchased and equipped!");
                break;
            case "theme_gold":
                user.setHasGoldTheme(true);
                user.setActiveTheme("gold");
                result.put("message", alreadyOwned ? "✨ Gold Theme equipped!" : "✨ Gold Theme purchased and equipped!");
                break;
            case "theme_default":
                user.setActiveTheme("default");
                result.put("message", "🎨 Default Theme equipped!");
                break;
        }

        userRepo.save(user);
        result.put("success", true);
        result.put("newCoins", user.getCoins());
        return result;
    }
}
