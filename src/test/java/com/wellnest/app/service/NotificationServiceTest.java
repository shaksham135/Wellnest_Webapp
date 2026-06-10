package com.wellnest.app.service;

import com.wellnest.app.model.*;
import com.wellnest.app.repository.NotificationRepository;
import com.wellnest.app.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private GroqService groqService;
    @Mock
    private TrackerService trackerService;

    @InjectMocks
    private NotificationService notificationService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setName("John Doe");
        user.setEmail("john@example.com");
        user.setFitnessGoal("weight_loss");
        user.setCreatedAt(LocalDateTime.now().minusDays(5));
        user.setLastChatDate(LocalDate.now()); // active
        user.setPremium(false);
    }

    @Test
    void testEnsureDailyTip_StandardUser_SendsStaticTip() {
        when(notificationRepository.existsByUser_IdAndTypeAndCreatedAtAfter(eq(1L), eq("TIP"), any())).thenReturn(false);
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));

        notificationService.getUserNotifications("john@example.com");

        // Captures saved notification
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();

        assertEquals("Daily Health Tip", saved.getTitle());
        assertTrue(saved.getMessage().contains("✨ Upgrade to Wellnest Premium"));
        assertEquals("TIP", saved.getType());
        verifyNoInteractions(groqService); // zero AI token usage for free user
    }

    @Test
    void testEnsureDailyTip_PremiumUser_SendsPremiumStaticTip() {
        user.setPremium(true);
        when(notificationRepository.existsByUser_IdAndTypeAndCreatedAtAfter(eq(1L), eq("TIP"), any())).thenReturn(false);
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));

        notificationService.getUserNotifications("john@example.com");

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();

        assertEquals("Your Premium Coach Nudge", saved.getTitle());
        assertTrue(saved.getMessage().contains("🏆"));
        assertEquals("TIP", saved.getType());
        verifyNoInteractions(groqService); // zero AI token usage for premium user (local tip lookup)
    }

    @Test
    void testMorningMotivation_SleepNotLogged_SendsSleepNudge() {
        Page<User> page = new PageImpl<>(Collections.singletonList(user));
        when(userRepository.findAll(any(Pageable.class))).thenReturn(page);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(trackerService.getSleepForToday(1L)).thenReturn(Collections.emptyList());

        notificationService.scheduleMorningMotivation();

        // Morning nudges have type TRACKING_REMINDER and don't write to DB, but trigger FCM.
        // FCM token is null for this user, so it bypasses FirebaseMessaging send.
        // Let's verify we check sleep logs
        verify(trackerService).getSleepForToday(1L);
        verifyNoInteractions(groqService); // 0 tokens
    }

    @Test
    void testMorningMotivation_SleepLogged_SendsHydrationOrBreakfastNudge() {
        Page<User> page = new PageImpl<>(Collections.singletonList(user));
        when(userRepository.findAll(any(Pageable.class))).thenReturn(page);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(trackerService.getSleepForToday(1L)).thenReturn(List.of(new SleepLog()));
        when(trackerService.getWaterForToday(1L)).thenReturn(Collections.emptyList());

        notificationService.scheduleMorningMotivation();

        verify(trackerService).getSleepForToday(1L);
        verify(trackerService).getWaterForToday(1L);
        verifyNoInteractions(groqService); // 0 tokens
    }

    @Test
    void testMidDayCheck_NutritionMissing_SendsMealNudge() {
        Page<User> page = new PageImpl<>(Collections.singletonList(user));
        when(userRepository.findAll(any(Pageable.class))).thenReturn(page);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(trackerService.getWaterForToday(1L)).thenReturn(Collections.emptyList());
        when(trackerService.getMealsForToday(1L)).thenReturn(Collections.emptyList());

        notificationService.scheduleMidDayCheck();

        verify(trackerService).getWaterForToday(1L);
        verify(trackerService).getMealsForToday(1L);
        verifyNoInteractions(groqService);
    }

    @Test
    void testEveningReview_AllLogged_SendsCongratulatoryNudge() {
        Page<User> page = new PageImpl<>(Collections.singletonList(user));
        when(userRepository.findAll(any(Pageable.class))).thenReturn(page);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(trackerService.getWaterForToday(1L)).thenReturn(List.of(new WaterIntake()));
        when(trackerService.getMealsForToday(1L)).thenReturn(List.of(new Meal()));
        when(trackerService.getSleepForToday(1L)).thenReturn(List.of(new SleepLog()));
        
        Workout w = new Workout();
        when(trackerService.getWorkoutsForToday(1L)).thenReturn(List.of(w));

        notificationService.scheduleEveningReview();

        verifyNoInteractions(groqService); // 0 tokens
    }

    @Test
    void testEveningReview_FreeUser_MissingLogs_SendsStaticMissingNudge() {
        Page<User> page = new PageImpl<>(Collections.singletonList(user));
        when(userRepository.findAll(any(Pageable.class))).thenReturn(page);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(trackerService.getWaterForToday(1L)).thenReturn(Collections.emptyList()); // missing
        when(trackerService.getMealsForToday(1L)).thenReturn(Collections.emptyList()); // missing
        when(trackerService.getSleepForToday(1L)).thenReturn(Collections.emptyList()); // missing
        when(trackerService.getWorkoutsForToday(1L)).thenReturn(Collections.emptyList()); // missing
        when(trackerService.getDailyActivities(eq(1L), any(), any())).thenReturn(Collections.emptyList()); // missing

        notificationService.scheduleEveningReview();

        verifyNoInteractions(groqService); // 0 tokens for free user
    }

    @Test
    void testEveningReview_PremiumUser_MissingLogs_TriggersGroqAI() {
        user.setPremium(true);
        Page<User> page = new PageImpl<>(Collections.singletonList(user));
        when(userRepository.findAll(any(Pageable.class))).thenReturn(page);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(trackerService.getWaterForToday(1L)).thenReturn(Collections.emptyList()); // missing
        when(trackerService.getMealsForToday(1L)).thenReturn(Collections.emptyList()); // missing
        when(trackerService.getSleepForToday(1L)).thenReturn(Collections.emptyList()); // missing
        when(trackerService.getWorkoutsForToday(1L)).thenReturn(Collections.emptyList()); // missing
        when(trackerService.getDailyActivities(eq(1L), any(), any())).thenReturn(Collections.emptyList()); // missing
        when(groqService.generateNotification(any(), any(), any())).thenReturn("Premium personalized review");

        notificationService.scheduleEveningReview();

        verify(groqService).generateNotification(eq("user"), eq("John Doe"), any());
    }
}
