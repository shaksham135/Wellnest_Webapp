package com.wellnest.app.service;

import com.wellnest.app.dto.LeaderboardEntry;
import com.wellnest.app.dto.LeaderboardResponse;
import com.wellnest.app.model.*;
import com.wellnest.app.repository.*;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class LeaderboardService {

    private final WorkoutRepository workoutRepository;
    private final MealRepository mealRepository;
    private final WaterIntakeRepository waterIntakeRepository;
    private final SleepLogRepository sleepLogRepository;
    private final UserRepository userRepository;

    public LeaderboardService(WorkoutRepository workoutRepository,
            MealRepository mealRepository,
            WaterIntakeRepository waterIntakeRepository,
            SleepLogRepository sleepLogRepository,
            UserRepository userRepository) {
        this.workoutRepository = workoutRepository;
        this.mealRepository = mealRepository;
        this.waterIntakeRepository = waterIntakeRepository;
        this.sleepLogRepository = sleepLogRepository;
        this.userRepository = userRepository;
    }

    public LeaderboardResponse getWeeklyLeaderboard(Long currentUserId) {
        // 1. Determine Date Range (Monday to Sunday)
        LocalDate today = LocalDate.now();
        LocalDate startOfWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate endOfWeek = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));

        LocalDateTime start = startOfWeek.atStartOfDay();
        LocalDateTime end = endOfWeek.atTime(LocalTime.MAX);

        // 2. Fetch all activities for the week
        List<Workout> workouts = workoutRepository.findByPerformedAtBetween(start, end);
        List<Meal> meals = mealRepository.findByLoggedAtBetween(start, end);
        List<WaterIntake> waterIntakes = waterIntakeRepository.findByLoggedAtBetween(start, end);
        List<SleepLog> sleepLogs = sleepLogRepository.findBySleepDateBetween(startOfWeek, endOfWeek);

        // 3. Initialize Scores for ALL users to 0.0
        Map<Long, Double> userScores = new HashMap<>();
        List<User> allUsers = userRepository.findAll();
        for (User user : allUsers) {
            userScores.put(user.getId(), 0.0);
        }

        // 4. Aggregate Scores per User (Addition to base 0.0)
        // Score: 1 pt per minute of workout
        for (Workout w : workouts) {
            double points = (w.getDurationMinutes() != null) ? w.getDurationMinutes().doubleValue() : 0.0;
            userScores.merge(w.getUserId(), points, (a, b) -> (a != null ? a : 0.0) + (b != null ? b : 0.0));
        }

        // Score: 10 pts per meal logged
        for (Meal m : meals) {
            userScores.merge(m.getUserId(), 10.0, (a, b) -> (a != null ? a : 0.0) + (b != null ? b : 0.0));
        }

        // Score: 20 pts per Liter of water
        for (WaterIntake w : waterIntakes) {
            double liters = (w.getLiters() != null) ? w.getLiters() : 0.0;
            userScores.merge(w.getUserId(), liters * 20.0, (a, b) -> (a != null ? a : 0.0) + (b != null ? b : 0.0));
        }

        // Score: 10 pts per hour of sleep
        for (SleepLog s : sleepLogs) {
            double hours = (s.getHours() != null) ? s.getHours() : 0.0;
            userScores.merge(s.getUserId(), hours * 10.0, (a, b) -> (a != null ? a : 0.0) + (b != null ? b : 0.0));
        }

        // Ensure current user is in the map (redundant now but safe)
        userScores.putIfAbsent(currentUserId, 0.0);

        // 4. Sort All Entries
        List<Map.Entry<Long, Double>> sortedEntries = userScores.entrySet().stream()
                .sorted(Map.Entry.<Long, Double>comparingByValue().reversed())
                .collect(Collectors.toList());

        // 5. Identify Users to Fetch (Top 10 + Current User)
        Set<Long> usersToFetch = new HashSet<>();
        usersToFetch.add(currentUserId);
        sortedEntries.stream().limit(10).forEach(e -> usersToFetch.add(e.getKey()));

        Map<Long, User> userMap = userRepository.findAllById(usersToFetch).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        // 6. Build Entries
        List<LeaderboardEntry> top10 = new ArrayList<>();
        LeaderboardEntry currentUserEntry = null;

        int rank = 1;
        for (Map.Entry<Long, Double> entry : sortedEntries) {
            Long userId = entry.getKey();
            Double score = entry.getValue();

            // Check if this user needs to be in our response
            boolean isTop10 = rank <= 10;
            boolean isCurrentUser = userId.equals(currentUserId);

            if (isTop10 || isCurrentUser) {
                User user = userMap.get(userId);
                String name = (user != null) ? user.getName() : "Unknown User";
                LeaderboardEntry dto = new LeaderboardEntry(name, score);
                dto.setRank(rank);

                if (isTop10) {
                    top10.add(dto);
                }
                if (isCurrentUser) {
                    currentUserEntry = dto;
                }
            }
            rank++;
        }

        return new LeaderboardResponse(top10, currentUserEntry);
    }
}
