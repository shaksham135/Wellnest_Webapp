package com.wellnest.app.service;

import com.wellnest.app.dto.LeaderboardResponse;
import com.wellnest.app.model.*;
import com.wellnest.app.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeaderboardServiceTest {

    @Mock
    private WorkoutRepository workoutRepository;
    @Mock
    private MealRepository mealRepository;
    @Mock
    private WaterIntakeRepository waterIntakeRepository;
    @Mock
    private SleepLogRepository sleepLogRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private LeaderboardService leaderboardService;

    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        user1 = new User();
        user1.setId(1L);
        user1.setName("Alice");

        user2 = new User();
        user2.setId(2L);
        user2.setName("Bob");
    }

    @Test
    void testGetWeeklyLeaderboard_CalculatesScoresCorrectly() {
        // Arrange scenarios
        // User 1: 60 min workout, 3 meals, 2L water, 8 hr sleep
        // Score: 60 + 30 + 40 + 80 = 210

        // User 2: 30 min workout, 2 meals, 1L water, 7 hr sleep
        // Score: 30 + 20 + 20 + 70 = 140

        Workout w1 = new Workout();
        w1.setUserId(1L);
        w1.setDurationMinutes(60);
        Workout w2 = new Workout();
        w2.setUserId(2L);
        w2.setDurationMinutes(30);

        Meal m1 = new Meal();
        m1.setUserId(1L);
        Meal m2 = new Meal();
        m2.setUserId(1L);
        Meal m3 = new Meal();
        m3.setUserId(1L);
        Meal m4 = new Meal();
        m4.setUserId(2L);
        Meal m5 = new Meal();
        m5.setUserId(2L);

        WaterIntake wa1 = new WaterIntake();
        wa1.setUserId(1L);
        wa1.setLiters(2.0);
        WaterIntake wa2 = new WaterIntake();
        wa2.setUserId(2L);
        wa2.setLiters(1.0);

        SleepLog s1 = new SleepLog();
        s1.setUserId(1L);
        s1.setHours(8.0);
        SleepLog s2 = new SleepLog();
        s2.setUserId(2L);
        s2.setHours(7.0);

        when(workoutRepository.findByPerformedAtBetween(any(), any())).thenReturn(Arrays.asList(w1, w2));
        when(mealRepository.findByLoggedAtBetween(any(), any())).thenReturn(Arrays.asList(m1, m2, m3, m4, m5));
        when(waterIntakeRepository.findByLoggedAtBetween(any(), any())).thenReturn(Arrays.asList(wa1, wa2));
        when(sleepLogRepository.findBySleepDateBetween(any(), any())).thenReturn(Arrays.asList(s1, s2));
        when(userRepository.findAllById(anyCollection())).thenReturn(Arrays.asList(user1, user2));

        // Act
        LeaderboardResponse response = leaderboardService.getWeeklyLeaderboard(2L);

        // Assert
        assertEquals(2, response.getTopUsers().size());

        // Check Rankings
        assertEquals("Alice", response.getTopUsers().get(0).getUserName());
        assertEquals(210.0, response.getTopUsers().get(0).getScore());
        assertEquals(1, response.getTopUsers().get(0).getRank());

        assertEquals("Bob", response.getTopUsers().get(1).getUserName());
        assertEquals(140.0, response.getTopUsers().get(1).getScore());
        assertEquals(2, response.getTopUsers().get(1).getRank());

        // Check Current User Entry
        assertNotNull(response.getCurrentUserEntry());
        assertEquals("Bob", response.getCurrentUserEntry().getUserName());
        assertEquals(2, response.getCurrentUserEntry().getRank());
    }

    @Test
    void testGetWeeklyLeaderboard_HandlesNullValuesSafely() {
        // User 1 has null duration, null liters, etc. should count as 0
        Workout w1 = new Workout();
        w1.setUserId(1L);
        w1.setDurationMinutes(null);
        WaterIntake wa1 = new WaterIntake();
        wa1.setUserId(1L);
        wa1.setLiters(null);
        SleepLog s1 = new SleepLog();
        s1.setUserId(1L);
        s1.setHours(null);

        when(workoutRepository.findByPerformedAtBetween(any(), any())).thenReturn(Collections.singletonList(w1));
        when(waterIntakeRepository.findByLoggedAtBetween(any(), any())).thenReturn(Collections.singletonList(wa1));
        when(sleepLogRepository.findBySleepDateBetween(any(), any())).thenReturn(Collections.singletonList(s1));
        when(mealRepository.findByLoggedAtBetween(any(), any())).thenReturn(Collections.emptyList());

        when(userRepository.findAllById(anyCollection())).thenReturn(Collections.singletonList(user1));

        LeaderboardResponse response = leaderboardService.getWeeklyLeaderboard(1L);

        assertEquals(1, response.getTopUsers().size());
        assertEquals(0.0, response.getTopUsers().get(0).getScore());
    }

    @Test
    void testGetWeeklyLeaderboard_IncludesAllUsersEvenZeroScore() {
        // User 1 has 100 points
        Workout w1 = new Workout();
        w1.setUserId(1L);
        w1.setDurationMinutes(100);
        // User 2 and 3 have 0 points (no logged activity)
        User user3 = new User();
        user3.setId(3L);
        user3.setName("Charlie");

        when(userRepository.findAll()).thenReturn(Arrays.asList(user1, user2, user3));
        when(workoutRepository.findByPerformedAtBetween(any(), any())).thenReturn(Collections.singletonList(w1));
        when(mealRepository.findByLoggedAtBetween(any(), any())).thenReturn(Collections.emptyList());
        when(waterIntakeRepository.findByLoggedAtBetween(any(), any())).thenReturn(Collections.emptyList());
        when(sleepLogRepository.findBySleepDateBetween(any(), any())).thenReturn(Collections.emptyList());

        // When building top users, it fetches details for those in top 10
        when(userRepository.findAllById(anyCollection())).thenReturn(Arrays.asList(user1, user2, user3));

        LeaderboardResponse response = leaderboardService.getWeeklyLeaderboard(2L);

        // Assert: 3 users should be in topUsers even if 2 have zero score
        assertEquals(3, response.getTopUsers().size());
        assertEquals("Alice", response.getTopUsers().get(0).getUserName());
        assertEquals(100.0, response.getTopUsers().get(0).getScore());

        // Bob and Charlie should be there with 0.0
        List<String> userNames = response.getTopUsers().stream().map(u -> u.getUserName()).collect(Collectors.toList());
        assertTrue(userNames.contains("Bob"));
        assertTrue(userNames.contains("Charlie"));
        assertEquals(0.0, response.getTopUsers().get(1).getScore());
        assertEquals(0.0, response.getTopUsers().get(2).getScore());
    }
}
