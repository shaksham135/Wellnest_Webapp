package com.wellnest.app.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wellnest.app.dto.*;
import com.wellnest.app.model.DailyActivity;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class AIVoiceCommandService {

    private final GroqService groqService;
    private final TrackerService trackerService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AIVoiceCommandService(GroqService groqService, TrackerService trackerService) {
        this.groqService = groqService;
        this.trackerService = trackerService;
    }

    public Map<String, Object> processVoiceCommand(Long userId, String transcript) {
        log.info("Processing Voice Command for userId {}: '{}'", userId, transcript);
        
        String systemPrompt = "Wellnest AI Coach. Convert log to JSON. Match user's natural Hinglish/English. " +
                "ACTIONS: WATER, MEAL, WORKOUT, SLEEP, ACTIVITY (steps/dist). " +
                "FORMAT: { \"action\": \"...\", \"displayMessage\": \"[emojis allowed]\", \"voiceMessage\": \"[clean text only]\", ... } " +
                "SCHEMAS: WATER{liters}, MEAL{mealType, calories, protein, carbs, fats}, WORKOUT{type, durationMinutes, caloriesBurned}, SLEEP{hours, quality}, ACTIVITY{steps, distanceKm}. " +
                "COMMAND: " + transcript;

        String aiResponse = groqService.getResponse(systemPrompt, "llama-3.1-8b-instant");
        Map<String, Object> result = new HashMap<>();

        try {
            aiResponse = aiResponse.replace("```json", "").replace("```", "").trim();
            JsonNode root = objectMapper.readTree(aiResponse);
            String action = root.path("action").asText("ERROR");
            String displayMsg = root.path("displayMessage").asText();
            String voiceMsg = root.path("voiceMessage").asText();

            // Default Fallbacks
            if (displayMsg.isEmpty()) displayMsg = "Logged your " + action.toLowerCase() + "! 🛡️⚡";
            if (voiceMsg.isEmpty()) voiceMsg = "Logged your " + action.toLowerCase();

            switch (action) {
                case "WATER":
                    WaterIntakeDto waterDto = new WaterIntakeDto();
                    waterDto.setLiters(root.path("liters").asDouble(0.25));
                    trackerService.createWaterForUser(userId, waterDto);
                    break;

                case "MEAL":
                    MealDto mealDto = new MealDto();
                    mealDto.setMealType(root.path("mealType").asText("SNACK").toUpperCase());
                    mealDto.setCalories(root.path("calories").asInt(200));
                    mealDto.setProtein(root.path("protein").asInt(10));
                    mealDto.setCarbs(root.path("carbs").asInt(20));
                    mealDto.setFats(root.path("fats").asInt(5));
                    trackerService.createMealForUser(userId, mealDto);
                    break;

                case "WORKOUT":
                    WorkoutDto workoutDto = new WorkoutDto();
                    workoutDto.setType(root.path("type").asText("General"));
                    workoutDto.setDurationMinutes(root.path("durationMinutes").asInt(30));
                    workoutDto.setCaloriesBurned(root.path("caloriesBurned").asInt(250));
                    trackerService.createWorkoutForUser(userId, workoutDto);
                    break;

                case "SLEEP":
                    SleepLogDto sleepDto = new SleepLogDto();
                    sleepDto.setHours(root.path("hours").asDouble(8.0));
                    sleepDto.setQuality(root.path("quality").asText("GOOD"));
                    trackerService.createSleepForUser(userId, sleepDto);
                    break;

                case "ACTIVITY":
                    DailyActivityDto activityDto = new DailyActivityDto();
                    activityDto.setSteps(root.path("steps").asInt(0));
                    activityDto.setDistanceKm(root.path("distanceKm").asDouble(0.0));
                    activityDto.setIsSync(false); // Manual voice entry is additive
                    trackerService.logDailyActivity(userId, activityDto);
                    break;

                default:
                    result.put("status", "ERROR");
                    result.put("displayMessage", "I couldn't quite catch that. Try saying 'Log 500ml water'. 🎙️");
                    result.put("voiceMessage", "I couldn't quite catch that. Try saying Log 500ml water.");
                    return result;
            }

            result.put("status", "SUCCESS");
            result.put("displayMessage", displayMsg);
            result.put("voiceMessage", voiceMsg);

        } catch (Exception e) {
            log.error("Failed to parse AI Voice Command: {}", e.getMessage());
            result.put("status", "ERROR");
            result.put("displayMessage", "AI Sync failed: " + e.getMessage());
            result.put("voiceMessage", "AI Sync failed.");
        }

        return result;
    }
}
