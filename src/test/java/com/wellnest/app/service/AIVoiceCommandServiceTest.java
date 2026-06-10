package com.wellnest.app.service;

import com.wellnest.app.dto.WorkoutDto;
import com.wellnest.app.model.User;
import com.wellnest.app.model.Workout;
import com.wellnest.app.repository.UserRepository;
import com.wellnest.app.util.DurationParser;
import com.wellnest.app.util.TranscriptNormalizer;
import com.wellnest.app.util.NumberParser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AIVoiceCommandServiceTest {

    @Mock
    private GroqService groqService;
    @Mock
    private TrackerService trackerService;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AIVoiceCommandService aiVoiceCommandService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setName("John Doe");
        user.setWeightKg(70.0);
    }

    @Test
    void testProcessVoiceCommand_AadheGhanteRunning_ParsesTo30Minutes() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        
        Workout mockWorkout = new Workout();
        mockWorkout.setId(10L);
        when(trackerService.createWorkoutForUser(eq(1L), any(WorkoutDto.class))).thenReturn(mockWorkout);

        Map<String, Object> result = aiVoiceCommandService.processVoiceCommand(1L, "main aadhe ghante Tak running Kiya");

        assertEquals("SUCCESS", result.get("status"));
        assertEquals("WORKOUT", result.get("action"));
        assertEquals(10L, result.get("createdId"));

        ArgumentCaptor<WorkoutDto> captor = ArgumentCaptor.forClass(WorkoutDto.class);
        verify(trackerService).createWorkoutForUser(eq(1L), captor.capture());
        WorkoutDto workoutDto = captor.getValue();

        assertEquals(30, workoutDto.getDurationMinutes());
        assertEquals("running", workoutDto.getType());
        verifyNoInteractions(groqService); // should match regex parser directly (0 tokens)
    }

    @Test
    void testProcessVoiceCommand_IWorkFor30Minutes_ParsesAsWorkout() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        Workout mockWorkout = new Workout();
        mockWorkout.setId(11L);
        when(trackerService.createWorkoutForUser(eq(1L), any(WorkoutDto.class))).thenReturn(mockWorkout);

        Map<String, Object> result = aiVoiceCommandService.processVoiceCommand(1L, "I work for 30 minutes");

        assertEquals("SUCCESS", result.get("status"));
        assertEquals("WORKOUT", result.get("action"));

        ArgumentCaptor<WorkoutDto> captor = ArgumentCaptor.forClass(WorkoutDto.class);
        verify(trackerService).createWorkoutForUser(eq(1L), captor.capture());
        WorkoutDto workoutDto = captor.getValue();

        assertEquals(30, workoutDto.getDurationMinutes());
        assertEquals("workout", workoutDto.getType());
        verifyNoInteractions(groqService); // matches regex directly via 'work ' keyword
    }

    @Test
    void testProcessVoiceCommand_WorkoutWithoutNumber_DefaultsTo30Mins() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        Workout mockWorkout = new Workout();
        mockWorkout.setId(12L);
        when(trackerService.createWorkoutForUser(eq(1L), any(WorkoutDto.class))).thenReturn(mockWorkout);

        Map<String, Object> result = aiVoiceCommandService.processVoiceCommand(1L, "I did a workout");

        assertEquals("SUCCESS", result.get("status"));
        assertEquals("WORKOUT", result.get("action"));

        ArgumentCaptor<WorkoutDto> captor = ArgumentCaptor.forClass(WorkoutDto.class);
        verify(trackerService).createWorkoutForUser(eq(1L), captor.capture());
        WorkoutDto workoutDto = captor.getValue();

        assertEquals(30, workoutDto.getDurationMinutes()); // default duration, not multiplied by 60
        assertEquals("workout", workoutDto.getType());
        verifyNoInteractions(groqService);
    }

    @Test
    void testDurationParser_DirectUnitsAndConfidence() {
        // Decimal inputs
        DurationParser.QuantityResult res1 = DurationParser.parse("1.5 hour");
        assertEquals(90.0, res1.getAsMinutes());
        assertEquals(1.0, res1.confidence);

        // Mixed Decimal + Hindi
        String norm2 = TranscriptNormalizer.normalize("2.5 ghante cycling");
        norm2 = NumberParser.resolveNumbers(norm2);
        DurationParser.QuantityResult res2 = DurationParser.parse(norm2, "2.5 ghante cycling");
        assertEquals(150.0, res2.getAsMinutes());

        // Bare Duration
        DurationParser.QuantityResult res3 = DurationParser.parse("30 minute");
        assertEquals(30.0, res3.getAsMinutes());
        assertTrue(res3.hasQuantity);

        // Fraction only
        String norm4 = TranscriptNormalizer.normalize("aadha ghanta walk");
        norm4 = NumberParser.resolveNumbers(norm4);
        DurationParser.QuantityResult res4 = DurationParser.parse(norm4, "aadha ghanta walk");
        assertEquals(30.0, res4.getAsMinutes());

        // Dedh
        String norm5 = TranscriptNormalizer.normalize("dedh ghanta gym");
        norm5 = NumberParser.resolveNumbers(norm5);
        DurationParser.QuantityResult res5 = DurationParser.parse(norm5, "dedh ghanta gym");
        assertEquals(90.0, res5.getAsMinutes());

        // Dhai
        String norm6 = TranscriptNormalizer.normalize("dhai ghante cycling");
        norm6 = NumberParser.resolveNumbers(norm6);
        DurationParser.QuantityResult res6 = DurationParser.parse(norm6, "dhai ghante cycling");
        assertEquals(150.0, res6.getAsMinutes());

        // Paune do ghante
        String norm7 = TranscriptNormalizer.normalize("paune do ghante");
        norm7 = NumberParser.resolveNumbers(norm7);
        DurationParser.QuantityResult res7 = DurationParser.parse(norm7, "paune do ghante");
        assertEquals(105.0, res7.getAsMinutes());
    }

    @Test
    void testTranscriptNormalizer_NarrowHomophones() {
        // "to run" should not change, but "to hour" should change to "2 hour"
        String text1 = "I want to run";
        String norm1 = TranscriptNormalizer.normalize(text1);
        assertTrue(norm1.contains("to run"));
        assertFalse(norm1.contains("2 run"));

        String text2 = "I slept to hours";
        String norm2 = TranscriptNormalizer.normalize(text2);
        norm2 = NumberParser.resolveNumbers(norm2);
        assertTrue(norm2.contains("2 hour"));
    }

    @Test
    void testDurationParser_ConfidenceLevels() {
        // Level 1: sava
        String text1 = "sava ghante running";
        String norm1 = NumberParser.resolveNumbers(TranscriptNormalizer.normalize(text1));
        DurationParser.QuantityResult res1 = DurationParser.parse(norm1, text1);
        assertEquals(0.92, res1.confidence, 0.01);

        // Level 2: shawa
        String text2 = "shawa ghante running";
        String norm2 = NumberParser.resolveNumbers(TranscriptNormalizer.normalize(text2));
        DurationParser.QuantityResult res2 = DurationParser.parse(norm2, text2);
        assertEquals(0.85, res2.confidence, 0.01);

        // Level 3: sawaa ghata running (typo in both sawaa and ghata)
        String text3 = "sawaa ghata running";
        String norm3 = NumberParser.resolveNumbers(TranscriptNormalizer.normalize(text3));
        DurationParser.QuantityResult res3 = DurationParser.parse(norm3, text3);
        assertEquals(0.72, res3.confidence, 0.01);

        // Bare number fallback confidence
        String text4 = "ran 30";
        String norm4 = NumberParser.resolveNumbers(TranscriptNormalizer.normalize(text4));
        DurationParser.QuantityResult res4 = DurationParser.parse(norm4, text4);
        assertEquals(0.70, res4.confidence, 0.01);

        // Range confidence
        String text5 = "3 se 4 ghante";
        String norm5 = NumberParser.resolveNumbers(TranscriptNormalizer.normalize(text5));
        DurationParser.QuantityResult res5 = DurationParser.parse(norm5, text5);
        assertEquals(0.90, res5.confidence, 0.01);

        // Approximation check
        String text6 = "lagbhag 2 hour";
        String norm6 = NumberParser.resolveNumbers(TranscriptNormalizer.normalize(text6));
        DurationParser.QuantityResult res6 = DurationParser.parse(norm6, text6);
        assertTrue(res6.approximate);
        assertEquals(1.0 * 0.85, res6.confidence, 0.01);
    }

    @Test
    void testProcessVoiceCommand_IntegrationFlows() {
        // 1. Sleep: "sade teen ghante soya" -> 3.5 hours sleep
        com.wellnest.app.model.SleepLog mockSleep = new com.wellnest.app.model.SleepLog();
        mockSleep.setId(20L);
        when(trackerService.createSleepForUser(eq(1L), any(com.wellnest.app.dto.SleepLogDto.class))).thenReturn(mockSleep);

        Map<String, Object> resultSleep = aiVoiceCommandService.processVoiceCommand(1L, "sade teen ghante soya");
        assertEquals("SUCCESS", resultSleep.get("status"));
        assertEquals("SLEEP", resultSleep.get("action"));

        ArgumentCaptor<com.wellnest.app.dto.SleepLogDto> sleepCaptor = ArgumentCaptor.forClass(com.wellnest.app.dto.SleepLogDto.class);
        verify(trackerService).createSleepForUser(eq(1L), sleepCaptor.capture());
        assertEquals(3.5, sleepCaptor.getValue().getHours(), 0.01);

        // 2. Workout range: "teen se chaar ghante workout"
        Map<String, Object> resultWorkoutRange = aiVoiceCommandService.processVoiceCommand(1L, "teen se chaar ghante workout");
        assertEquals("ERROR", resultWorkoutRange.get("status"));
        assertTrue(resultWorkoutRange.get("displayMessage").toString().contains("Invalid Duration"));
    }
}

