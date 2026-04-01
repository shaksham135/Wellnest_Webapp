package com.wellnest.app.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wellnest.app.dto.MealDto;
import com.wellnest.app.dto.SleepLogDto;
import com.wellnest.app.dto.WaterIntakeDto;
import com.wellnest.app.dto.WorkoutDto;
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
        
        String systemPrompt = "You are the Wellnest AI Coach. Convert the following natural language health log request into a structured JSON action. " +
                "The user might speak in English, Hindi, or Hinglish. " +
                "SUPPORTED ACTIONS: 'WATER', 'MEAL', 'WORKOUT', 'SLEEP'. " +
                "JSON FORMATS: " +
                "1. WATER: { \"action\": \"WATER\", \"liters\": 0.5, \"reply\": \"Got it! Logged 0.5L water. Keep sipping to stay sharp! 💧\" } " +
                "2. MEAL: { \"action\": \"MEAL\", \"mealType\": \"BREAKFAST\", \"calories\": 450, \"protein\": 30, \"carbs\": 50, \"fats\": 15, \"reply\": \"Fuel logged! 450 kcal added. Great protein intake for muscle recovery! 🥙\" } " +
                "3. WORKOUT: { \"action\": \"WORKOUT\", \"type\": \"Running\", \"durationMinutes\": 30, \"caloriesBurned\": 300, \"reply\": \"What a session! 30 mins logged. Your heart health is thanking you right now! 🏃‍♂️⚡\" } " +
                "4. SLEEP: { \"action\": \"SLEEP\", \"hours\": 7.5, \"quality\": \"GOOD\", \"reply\": \"7.5 hours logged. Your cognitive reserve is recharging nicely. Sleep is your secret weapon! 💤\" } " +
                "RULES: " +
                "- If specific macros aren't mentioned for meals, estimate them based on common averages. " +
                "- The 'reply' field MUST be a supportive, high-energy coach response (English/Hinglish) and include a small tip/suggestion. " +
                "- Return ONLY raw JSON. " +
                "COMMAND: " + transcript;

        String aiResponse = groqService.getResponse(systemPrompt);
        Map<String, Object> result = new HashMap<>();

        try {
            // Remove markdown backticks if present
            aiResponse = aiResponse.replace("```json", "").replace("```", "").trim();
            JsonNode root = objectMapper.readTree(aiResponse);
            String action = root.path("action").asText("ERROR");
            String aiReply = root.path("reply").asText();

            switch (action) {
                case "WATER":
                    WaterIntakeDto waterDto = new WaterIntakeDto();
                    waterDto.setLiters(root.path("liters").asDouble(0.25));
                    trackerService.createWaterForUser(userId, waterDto);
                    result.put("status", "SUCCESS");
                    result.put("message", !aiReply.isEmpty() ? aiReply : "Logged " + waterDto.getLiters() + "L of water. Stay hydrated! 💧");
                    break;

                case "MEAL":
                    MealDto mealDto = new MealDto();
                    mealDto.setMealType(root.path("mealType").asText("SNACK").toUpperCase());
                    mealDto.setCalories(root.path("calories").asInt(200));
                    mealDto.setProtein(root.path("protein").asInt(10));
                    mealDto.setCarbs(root.path("carbs").asInt(20));
                    mealDto.setFats(root.path("fats").asInt(5));
                    trackerService.createMealForUser(userId, mealDto);
                    result.put("status", "SUCCESS");
                    result.put("message", !aiReply.isEmpty() ? aiReply : "Logged " + mealDto.getMealType() + " (" + mealDto.getCalories() + " kcal). Fuel for the mission! 🥗");
                    break;

                case "WORKOUT":
                    WorkoutDto workoutDto = new WorkoutDto();
                    workoutDto.setType(root.path("type").asText("Cardio"));
                    workoutDto.setDurationMinutes(root.path("durationMinutes").asInt(30));
                    workoutDto.setCaloriesBurned(root.path("caloriesBurned").asInt(250));
                    trackerService.createWorkoutForUser(userId, workoutDto);
                    result.put("status", "SUCCESS");
                    result.put("message", !aiReply.isEmpty() ? aiReply : "Logged " + workoutDto.getDurationMinutes() + "m of " + workoutDto.getType() + ". High performance achieved! ⚡");
                    break;

                case "SLEEP":
                    SleepLogDto sleepDto = new SleepLogDto();
                    sleepDto.setHours(root.path("hours").asDouble(8.0));
                    sleepDto.setQuality(root.path("quality").asText("GOOD"));
                    trackerService.createSleepForUser(userId, sleepDto);
                    result.put("status", "SUCCESS");
                    result.put("message", !aiReply.isEmpty() ? aiReply : "Log recorded: " + sleepDto.getHours() + "h sleep. Recalibrating for tomorrow. 💤");
                    break;

                default:
                    result.put("status", "ERROR");
                    result.put("message", !aiReply.isEmpty() ? aiReply : "I couldn't quite catch that. Try saying 'Log 500ml water' or 'I ate a chicken salad'.");
            }

        } catch (Exception e) {
            log.error("Failed to parse/execute AI Voice Command: {}", e.getMessage());
            result.put("status", "ERROR");
            result.put("message", "AI Sync failed: " + e.getMessage());
        }

        return result;
    }
}
