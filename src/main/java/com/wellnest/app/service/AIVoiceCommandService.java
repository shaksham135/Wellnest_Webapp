package com.wellnest.app.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wellnest.app.dto.*;
import com.wellnest.app.model.DailyActivity;
import com.wellnest.app.util.TranscriptNormalizer;
import com.wellnest.app.util.NumberParser;
import com.wellnest.app.util.DurationParser;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class AIVoiceCommandService {

    private final GroqService groqService;
    private final TrackerService trackerService;
    private final com.wellnest.app.repository.UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper()
        .configure(com.fasterxml.jackson.core.JsonParser.Feature.ALLOW_COMMENTS, true)
        .configure(com.fasterxml.jackson.core.JsonParser.Feature.ALLOW_SINGLE_QUOTES, true)
        .configure(com.fasterxml.jackson.core.JsonParser.Feature.ALLOW_UNQUOTED_FIELD_NAMES, true);

    public AIVoiceCommandService(GroqService groqService, 
                                 TrackerService trackerService,
                                 com.wellnest.app.repository.UserRepository userRepository) {
        this.groqService = groqService;
        this.trackerService = trackerService;
        this.userRepository = userRepository;
    }

    public Map<String, Object> processVoiceCommand(Long userId, String transcript) {
        log.info("Processing Voice Command for userId {}: '{}'", userId, transcript);
        if (transcript != null) {
            transcript = transcript.replace(",", "");
        }
        
        // 1. Try local regex parsing first (0 tokens)
        try {
            Map<String, Object> localResult = tryRegexParse(userId, transcript);
            if (localResult != null) {
                return localResult;
            }
        } catch (Exception e) {
            log.error("Regex Parsing failed, falling back to LLM: {}", e.getMessage());
        }
        
        // Basic sanity check to avoid empty commands
        if (transcript == null || transcript.trim().length() < 2) {
            Map<String, Object> result = new HashMap<>();
            result.put("status", "ERROR");
            result.put("displayMessage", "I couldn't catch that. Please speak a bit louder! 🎙️");
            result.put("voiceMessage", "I couldn't catch that. Please speak louder.");
            return result;
        }

        String normalized = TranscriptNormalizer.normalize(transcript);
        normalized = NumberParser.resolveNumbers(normalized);
        
        String systemPrompt = "Convert user's health log (English/Hinglish) into JSON format.\n" +
                "SCHEMAS:\n" +
                "1. WATER: {liters} (glass=0.25, bottle=1.0)\n" +
                "2. MEAL: {mealType(BREAKFAST|LUNCH|DINNER|SNACK), calories, protein, carbs, fats, foodName} (Estimate macros if unspecified, e.g. roti=90kcal/3g protein, egg=75kcal/6g protein)\n" +
                "3. WORKOUT: {type, durationMinutes(default 30), caloriesBurned}\n" +
                "4. SLEEP: {hours, quality(GOOD|POOR)} (poor if hours < 6)\n" +
                "5. ACTIVITY: {steps, distanceKm} (distanceKm=steps*0.00075)\n" +
                "RULES:\n" +
                "- Never classify steps as MEAL/WORKOUT. Must be ACTIVITY.\n" +
                "- If off-topic/hello, return action: ERROR, displayMessage: \"I couldn't find any habit log in your message. Try saying 'Log 2 glasses of water' or 'Maine 3 roti khayi'! 🎙️\", voiceMessage: \"I couldn't find any habit log in your message.\"\n" +
                "- displayMessage: Same language style as user (Hinglish/English). Emojis allowed.\n" +
                "- voiceMessage: Same style, Latin/English characters only (no Devanagari).\n" +
                "Format: {\"action\":\"WATER|MEAL|WORKOUT|SLEEP|ACTIVITY|ERROR\",\"displayMessage\":\"\",\"voiceMessage\":\"\",...keys}\n" +
                "USER: " + transcript;

        String aiResponse = groqService.getResponse(systemPrompt, "llama-3.1-8b-instant", 150);
        Map<String, Object> result = new HashMap<>();

        try {
            aiResponse = aiResponse.replace("```json", "").replace("```", "").trim();
            
            // Handle cases where the LLM surrounds JSON with text
            if (!aiResponse.startsWith("{")) {
                int braceStart = aiResponse.indexOf('{');
                int braceEnd = aiResponse.lastIndexOf('}');
                if (braceStart != -1 && braceEnd != -1 && braceEnd > braceStart) {
                    aiResponse = aiResponse.substring(braceStart, braceEnd + 1);
                }
            }
            
            JsonNode root = objectMapper.readTree(aiResponse);
            String action = root.path("action").asText("ERROR");
            String displayMsg = root.path("displayMessage").asText();
            String voiceMsg = root.path("voiceMessage").asText();

            // 1. Cross-validate action with heuristic keywords to prevent misclassification
            String heuristicAction = heuristicClassify(normalized);
            if (heuristicAction != null && !heuristicAction.equals(action)) {
                // If it is steps/activity but classified as MEAL or WORKOUT, override immediately
                if ("ACTIVITY".equals(heuristicAction) && ("MEAL".equals(action) || "WORKOUT".equals(action) || "ERROR".equals(action))) {
                    log.warn("Safeguard override: LLM misclassified ACTIVITY as {}. Overriding with Heuristic Parser.", action);
                    Map<String, Object> heuristicResult = tryHeuristicParse(userId, transcript);
                    if (heuristicResult != null) {
                        return heuristicResult;
                    }
                }
            }

            if ("ERROR".equals(action)) {
                Map<String, Object> fallbackResult = tryHeuristicParse(userId, transcript);
                if (fallbackResult != null) {
                    log.info("LLM returned ERROR, but Heuristic Parse succeeded!");
                    return fallbackResult;
                }
            }

            // Default Fallbacks
            if (displayMsg.isEmpty()) displayMsg = "Logged your " + action.toLowerCase() + "! 🛡️⚡";
            if (voiceMsg.isEmpty()) voiceMsg = "Logged your " + action.toLowerCase();

            switch (action) {
                case "WATER":
                    WaterIntakeDto waterDto = new WaterIntakeDto();
                    double liters = root.path("liters").asDouble(0.25);
                    if (liters <= 0.0) liters = 0.25;
                    
                    boolean explicitlyLiters = transcript.toLowerCase().contains("liter") || 
                                               transcript.toLowerCase().contains("litre") || 
                                               transcript.toLowerCase().contains(" l ") || 
                                               transcript.toLowerCase().endsWith(" l") || 
                                               transcript.toLowerCase().contains(" l.");
                    
                    if (!explicitlyLiters && liters > 10.0) {
                        liters = liters / 1000.0;
                        displayMsg = String.format("Logged %.2fL of water! Hydrated raho! 💧", liters);
                        voiceMsg = String.format("Logged %.2f liters of water.", liters);
                    }
                    
                    waterDto.setLiters(liters);
                    waterDto.setNotes("Logged via Voice Log");
                    com.wellnest.app.model.WaterIntake waterEntity = trackerService.createWaterForUser(userId, waterDto);
                    result.put("createdId", waterEntity.getId());
                    result.put("createdType", "WATER");
                    break;

                case "MEAL":
                    MealDto mealDto = new MealDto();
                    String mealTypeStr = root.path("mealType").asText("SNACK").toUpperCase();
                    if (!java.util.List.of("BREAKFAST", "LUNCH", "DINNER", "SNACK").contains(mealTypeStr)) {
                        mealTypeStr = "SNACK";
                    }
                    int calories = root.path("calories").asInt(200);
                    if (calories < 0) calories = 200;
                    
                    mealDto.setMealType(mealTypeStr);
                    mealDto.setCalories(calories);
                    mealDto.setProtein(Math.max(0, root.path("protein").asInt(0)));
                    mealDto.setCarbs(Math.max(0, root.path("carbs").asInt(0)));
                    mealDto.setFats(Math.max(0, root.path("fats").asInt(0)));
                    mealDto.setNotes(root.path("foodName").asText("Meal") + " (Voice Log)");
                    com.wellnest.app.model.Meal mealEntity = trackerService.createMealForUser(userId, mealDto);
                    result.put("createdId", mealEntity.getId());
                    result.put("createdType", "MEAL");
                    break;

                case "WORKOUT":
                    WorkoutDto workoutDto = new WorkoutDto();
                    workoutDto.setType(root.path("type").asText("General"));
                    int duration = root.path("durationMinutes").asInt(30);
                    if (duration < 1) duration = 30;
                    
                    int caloriesBurned = root.path("caloriesBurned").asInt(duration * 8);
                    if (caloriesBurned < 0) caloriesBurned = 0;
                    
                    workoutDto.setDurationMinutes(duration);
                    workoutDto.setCaloriesBurned(caloriesBurned);
                    workoutDto.setNotes("Logged via Voice Log");
                    com.wellnest.app.model.Workout workoutEntity = trackerService.createWorkoutForUser(userId, workoutDto);
                    result.put("createdId", workoutEntity.getId());
                    result.put("createdType", "WORKOUT");
                    break;

                case "SLEEP":
                    SleepLogDto sleepDto = new SleepLogDto();
                    double hours = root.path("hours").asDouble(8.0);
                    if (hours < 0.5) hours = 0.5;
                    sleepDto.setHours(hours);
                    
                    String quality = root.path("quality").asText("GOOD").toUpperCase();
                    if (!java.util.List.of("GOOD", "POOR", "FAIR", "EXCELLENT").contains(quality)) {
                        quality = "GOOD";
                    }
                    sleepDto.setQuality(quality);
                    sleepDto.setNotes("Logged via Voice Log");
                    com.wellnest.app.model.SleepLog sleepEntity = trackerService.createSleepForUser(userId, sleepDto);
                    result.put("createdId", sleepEntity.getId());
                    result.put("createdType", "SLEEP");
                    break;

                case "ACTIVITY":
                    DailyActivityDto activityDto = new DailyActivityDto();
                    int steps = root.path("steps").asInt(0);
                    if (steps < 0) steps = 0;
                    double distanceKm = root.path("distanceKm").asDouble(steps * 0.00075);
                    if (distanceKm < 0.0) distanceKm = steps * 0.00075;
                    
                    activityDto.setSteps(steps);
                    activityDto.setDistanceKm(distanceKm);
                    activityDto.setIsSync(false); // Manual voice entry is additive
                    com.wellnest.app.model.DailyActivity activityEntity = trackerService.logDailyActivity(userId, activityDto);
                    result.put("createdId", activityEntity.getId());
                    result.put("createdType", "ACTIVITY");
                    break;

                default:
                    result.put("status", "ERROR");
                    result.put("displayMessage", displayMsg.isEmpty() ? "I couldn't quite catch that. Try saying 'Log 500ml water'. 🎙️" : displayMsg);
                    result.put("voiceMessage", voiceMsg.isEmpty() ? "I couldn't quite catch that. Try saying Log 500ml water." : voiceMsg);
                    return result;
            }

            result.put("status", "SUCCESS");
            result.put("displayMessage", displayMsg);
            result.put("voiceMessage", voiceMsg);

        } catch (Exception e) {
            log.error("Failed to parse AI Voice Command: {}", e.getMessage());
            
            String friendlyMsg;
            if (e instanceof IllegalArgumentException) {
                friendlyMsg = e.getMessage();
            } else {
                friendlyMsg = "I couldn't process that command. Try saying: 'Log 2 glasses of water' or 'I ran for 30 minutes'! 🎙️";
                // Try heuristic parse fallback before returning ERROR
                try {
                    Map<String, Object> fallbackResult = tryHeuristicParse(userId, transcript);
                    if (fallbackResult != null) {
                        log.info("LLM failed, but Heuristic Parse succeeded!");
                        return fallbackResult;
                    }
                } catch (Exception ex) {
                    log.error("Heuristic fallback failed: {}", ex.getMessage());
                    if (ex instanceof IllegalArgumentException) {
                        friendlyMsg = ex.getMessage();
                    }
                }
            }

            result.put("status", "ERROR");
            result.put("displayMessage", friendlyMsg);
            result.put("voiceMessage", friendlyMsg);
        }

        return result;
    }

    private Map<String, Object> tryRegexParse(Long userId, String transcript) {
        if (transcript == null || transcript.trim().isEmpty()) {
            return null;
        }

        String normalized = TranscriptNormalizer.normalize(transcript);
        normalized = NumberParser.resolveNumbers(normalized);

        // 1. WATER LOGS
        if ((normalized.contains("water") || normalized.contains("paani") || normalized.contains("pani") || 
            normalized.contains("glass") || normalized.contains("bottle") || normalized.contains("ml"))
            && !(normalized.contains("milk") || normalized.contains("doodh") || normalized.contains("juice") || 
                 normalized.contains("chai") || normalized.contains("tea") || normalized.contains("coffee") || 
                 normalized.contains("shake") || normalized.contains("lassi"))) {
            
            Double value = extractFirstNumber(normalized);
            if (value == null) {
                value = 1.0; // Default to 1 unit
            }

            double liters = 0.25; // default
            if (normalized.contains("ml")) {
                liters = value * 0.001;
            } else if (normalized.contains("glass")) {
                liters = value * 0.25;
            } else if (normalized.contains("liter") || normalized.contains("litre") || normalized.contains(" l ") || normalized.endsWith(" l")) {
                liters = value;
            } else if (normalized.contains("bottle")) {
                liters = value * 1.0;
            } else {
                if (value >= 50) {
                    liters = value * 0.001;
                } else {
                    liters = value * 0.25;
                }
            }
            
            boolean explicitlyLiters = normalized.contains("liter") || normalized.contains("litre") || 
                                       normalized.contains(" l ") || normalized.endsWith(" l") || normalized.contains(" l.");
            
            if (explicitlyLiters && (liters < 0.05 || liters > 2.0)) {
                Map<String, Object> result = new HashMap<>();
                result.put("status", "ERROR");
                result.put("displayMessage", "Invalid Quantity: Water logged at once must be between 0.05L (50ml) and 2.0L.");
                result.put("voiceMessage", "Water logged at once must be between 50ml and 2 liters.");
                return result;
            }

            if (liters > 0.0 && liters <= 10.0) {
                WaterIntakeDto waterDto = new WaterIntakeDto();
                waterDto.setLiters(liters);
                waterDto.setNotes("Logged via Voice Log");
                com.wellnest.app.model.WaterIntake waterEntity = trackerService.createWaterForUser(userId, waterDto);
                
                Map<String, Object> result = new HashMap<>();
                result.put("status", "SUCCESS");
                result.put("action", "WATER");
                result.put("createdId", waterEntity.getId());
                result.put("createdType", "WATER");
                result.put("displayMessage", String.format("Logged %.2fL of water! Hydrated raho! 💧", liters));
                result.put("voiceMessage", String.format("Logged %.2f liters of water. Keep hydrating.", liters));
                log.info("Regex Match SUCCESS: logged water {}L for user {}", liters, userId);
                return result;
            }
        }

        // 2. STEPS / ACTIVITY LOGS
        if (normalized.contains("step") || normalized.contains("kadam") || 
            normalized.contains("km") || normalized.contains("kilometer") || normalized.contains("kilometre") ||
            ((normalized.contains("chala") || normalized.contains("chle") || normalized.contains("chale") || 
              normalized.contains("chali") || normalized.contains("chla") || normalized.contains("walked") || 
              normalized.contains("walk"))
             && !(normalized.contains("minute") || normalized.contains("minutes") || normalized.contains("min") || 
                  normalized.contains("mins") || normalized.contains("hour") || normalized.contains("hours") || 
                  normalized.contains("ghante") || normalized.contains("ghanta") || normalized.contains("hr") || 
                  normalized.contains("hrs")))) {
            
            Double value = extractFirstNumber(normalized);
            if (value == null) {
                value = (normalized.contains("km") || normalized.contains("kilometer") || normalized.contains("kilometre")) ? 1.0 : 1000.0;
            }

            int steps = 0;
            double distanceKm = 0.0;
            
            if (normalized.contains("km") || normalized.contains("kilometer") || normalized.contains("kilometre")) {
                distanceKm = value;
                steps = (int) Math.round(distanceKm / 0.00075);
            } else {
                steps = value.intValue();
                distanceKm = steps * 0.00075;
            }
            
            if (steps < 1 || steps > 50000) {
                Map<String, Object> result = new HashMap<>();
                result.put("status", "ERROR");
                result.put("displayMessage", "Invalid Steps: Steps logged manually must be between 1 and 50,000 steps.");
                result.put("voiceMessage", "Steps logged manually must be between 1 and 50,000 steps.");
                return result;
            }
            
            DailyActivityDto activityDto = new DailyActivityDto();
            activityDto.setSteps(steps);
            activityDto.setDistanceKm(distanceKm);
            activityDto.setIsSync(false);
            com.wellnest.app.model.DailyActivity activityEntity = trackerService.logDailyActivity(userId, activityDto);
            
            Map<String, Object> result = new HashMap<>();
            result.put("status", "SUCCESS");
            result.put("action", "ACTIVITY");
            result.put("createdId", activityEntity.getId());
            result.put("createdType", "ACTIVITY");
            result.put("displayMessage", String.format("Logged %.2f km (%d steps)! Kadam badhate raho, fit raho! 🏃‍♂️", distanceKm, steps));
            result.put("voiceMessage", String.format("Logged %.2f kilometers.", distanceKm));
            log.info("Regex Match SUCCESS: logged activity steps {} distance {} for user {}", steps, distanceKm, userId);
            return result;
        }

        // 3. SLEEP LOGS
        if (normalized.contains("sleep") || normalized.contains("soya") || normalized.contains("neend") || 
            normalized.contains("soye") || normalized.contains("soyi") || normalized.contains("slept") || 
            normalized.contains("sleeping")) {
            
            DurationParser.QuantityResult durationRes = DurationParser.parse(normalized, transcript);
            double hours = 8.0; // Default 8 hours
            if (durationRes.hasDuration) {
                hours = durationRes.getAsHours();
            }

            if (hours < 3.0 || hours > 18.0) {
                Map<String, Object> result = new HashMap<>();
                result.put("status", "ERROR");
                result.put("displayMessage", "Invalid Duration: Sleep duration must be between 3 and 18 hours.");
                result.put("voiceMessage", "Sleep duration must be between 3 and 18 hours.");
                return result;
            }
            
            String quality = "GOOD";
            if (hours < 6.0 || normalized.contains("poor") || normalized.contains("bad") || normalized.contains("disturbed") || 
                normalized.contains("kharab") || normalized.contains("bekar") || normalized.contains("gandi")) {
                quality = "POOR";
            }
            
            SleepLogDto sleepDto = new SleepLogDto();
            sleepDto.setHours(hours);
            sleepDto.setQuality(quality);
            sleepDto.setNotes("Logged via Voice Log");
            com.wellnest.app.model.SleepLog sleepEntity = trackerService.createSleepForUser(userId, sleepDto);
            
            Map<String, Object> result = new HashMap<>();
            result.put("status", "SUCCESS");
            result.put("action", "SLEEP");
            result.put("createdId", sleepEntity.getId());
            result.put("createdType", "SLEEP");
            result.put("displayMessage", String.format("Logged %.1f hours of sleep! Quality was %s. 💤", hours, quality.toLowerCase()));
            result.put("voiceMessage", String.format("Logged %.1f hours of sleep. Quality was %s.", hours, quality.toLowerCase()));
            log.info("Regex Match SUCCESS: logged sleep {} hours for user {}", hours, userId);
            return result;
        }

        // 4. WORKOUT LOGS
        if (normalized.contains("workout") || normalized.contains("gym") || normalized.contains("run") || 
            normalized.contains("yoga") || normalized.contains("cardio") || normalized.contains("hiit") || 
            normalized.contains("strength") || normalized.contains("boxing") || normalized.contains("cycling") ||
            normalized.contains("swimming") || normalized.contains("stretch") || normalized.contains("stretching") ||
            normalized.contains("exercise") || normalized.contains("excersise") || normalized.contains("kasrat") || 
            normalized.contains("training") || normalized.contains("cycle") || normalized.contains("walk") ||
            normalized.contains("walking") || normalized.contains("running") || normalized.contains("bhaga") || 
            normalized.contains("bhage") || normalized.contains("dauda") || normalized.contains("daude") ||
            normalized.contains("worked") || normalized.contains("work out") || normalized.contains("work ")) {
            
            DurationParser.QuantityResult durationRes = DurationParser.parse(normalized, transcript);
            int duration = 30; // Default 30 minutes
            if (durationRes.hasDuration) {
                duration = (int) Math.round(durationRes.getAsMinutes());
            }
            
            if (duration < 5 || duration > 180) {
                Map<String, Object> result = new HashMap<>();
                result.put("status", "ERROR");
                result.put("displayMessage", "Invalid Duration: Workout duration must be between 5 and 180 minutes (3 hours).");
                result.put("voiceMessage", "Workout duration must be between 5 and 180 minutes.");
                return result;
            }
            
            String type = "cardio";
            double met = 7.0;
            
            if (normalized.contains("run") || normalized.contains("running") || normalized.contains("bhaga") || normalized.contains("bhage") || normalized.contains("dauda") || normalized.contains("daude")) {
                type = "running";
                met = 9.8;
            } else if (normalized.contains("gym") || normalized.contains("strength")) {
                type = "strength";
                met = 5.0;
            } else if (normalized.contains("yoga") || normalized.contains("pilates")) {
                type = "yoga";
                met = 3.0;
            } else if (normalized.contains("hiit") || normalized.contains("crossfit")) {
                type = "hiit";
                met = 10.0;
            } else if (normalized.contains("boxing")) {
                type = "boxing";
                met = 9.5;
            } else if (normalized.contains("cycling") || normalized.contains("cycle")) {
                type = "cycling";
                met = 7.5;
            } else if (normalized.contains("swimming") || normalized.contains("swim")) {
                type = "swimming";
                met = 8.0;
            } else if (normalized.contains("stretch") || normalized.contains("stretching") || normalized.contains("flexibility")) {
                type = "stretching";
                met = 2.0;
            } else if (normalized.contains("walk") || normalized.contains("walking")) {
                type = "walking";
                met = 3.5;
            } else if (normalized.contains("exercise") || normalized.contains("excersise") || normalized.contains("kasrat") || 
                       normalized.contains("workout") || normalized.contains("training") ||
                       normalized.contains("work out") || normalized.contains("worked") || normalized.contains("work ")) {
                type = "workout";
                met = 6.0;
            }
            
            Double userWeight = 70.0;
            try {
                com.wellnest.app.model.User user = userRepository.findById(userId).orElse(null);
                if (user != null && user.getWeightKg() != null) {
                    userWeight = user.getWeightKg();
                }
            } catch (Exception e) {
                log.error("Failed to load user weight for regex workout calorie estimation", e);
            }
            
            int caloriesBurned = (int) Math.round(met * userWeight * (duration / 60.0));
            
            WorkoutDto workoutDto = new WorkoutDto();
            workoutDto.setType(type);
            workoutDto.setDurationMinutes(duration);
            workoutDto.setCaloriesBurned(caloriesBurned);
            workoutDto.setNotes("Logged via Voice Log");
            com.wellnest.app.model.Workout workoutEntity = trackerService.createWorkoutForUser(userId, workoutDto);
            
            Map<String, Object> result = new HashMap<>();
            result.put("status", "SUCCESS");
            result.put("action", "WORKOUT");
            result.put("createdId", workoutEntity.getId());
            result.put("createdType", "WORKOUT");
            result.put("displayMessage", String.format("Logged %d mins of %s (%d kcal)! Raw performance! 🔥⚡", duration, type, caloriesBurned));
            result.put("voiceMessage", String.format("Logged %d minutes of %s. Good job.", duration, type));
            log.info("Regex Match SUCCESS: logged workout {} ({} mins) for user {}", type, duration, userId);
            return result;
        }

        // 5. MEAL LOGS (Simple presets & custom calorie extraction)
        if (normalized.contains("shake") || normalized.contains("egg") || normalized.contains("anda") || 
            normalized.contains("ande") || normalized.contains("andey") || 
            normalized.contains("apple") || normalized.contains("seb") || normalized.contains("banana") || 
            normalized.contains("kela") || normalized.contains("roti") || normalized.contains("bread") ||
            normalized.contains("rice") || normalized.contains("chawal") || normalized.contains("dal") ||
            normalized.contains("paneer") || normalized.contains("chicken") || normalized.contains("dahi") ||
            normalized.contains("curd") || normalized.contains("milk") || normalized.contains("doodh") ||
            normalized.contains("salad") || normalized.contains("fruit") || normalized.contains("fruits") ||
            normalized.contains("juice") || normalized.contains("chai") || normalized.contains("tea") ||
            normalized.contains("coffee") || normalized.contains("breakfast") || normalized.contains("lunch") ||
            normalized.contains("dinner") || normalized.contains("snack") || normalized.contains("khana") ||
            normalized.contains("khaya") || normalized.contains("khaaya") || normalized.contains("khayi") ||
            normalized.contains("khai") || normalized.contains("meal") || normalized.contains("nashta")) {
            
            Double caloriesExplicit = null;
            Double quantity = null;
            
            if (normalized.contains("calorie") || normalized.contains("kcal") || normalized.contains("cal")) {
                caloriesExplicit = extractFirstNumber(normalized);
            } else {
                quantity = extractFirstNumber(normalized);
            }
            if (quantity == null) quantity = 1.0; 
            
            int calories = 0;
            int protein = 0;
            int carbs = 0;
            int fats = 0;
            String foodName = "Meal";
            String mealType = "SNACK";
            
            String qtyStr = (quantity % 1 == 0) ? String.format("%.0f", quantity) : String.format("%.1f", quantity);
            
            if (normalized.contains("shake") || normalized.contains("whey")) {
                calories = (int) (120 * quantity);
                protein = (int) (24 * quantity);
                carbs = (int) (3 * quantity);
                fats = (int) (1.5 * quantity);
                foodName = qtyStr + " Protein Shake";
            } else if (normalized.contains("egg") || normalized.contains("anda") || 
                       normalized.contains("ande") || normalized.contains("andey")) {
                calories = (int) (75 * quantity);
                protein = (int) (6 * quantity);
                carbs = 0;
                fats = (int) (5 * quantity);
                foodName = qtyStr + " Boiled Egg";
            } else if (normalized.contains("apple") || normalized.contains("seb")) {
                calories = (int) (95 * quantity);
                protein = 0;
                carbs = (int) (25 * quantity);
                fats = 0;
                foodName = qtyStr + " Apple";
            } else if (normalized.contains("banana") || normalized.contains("kela")) {
                calories = (int) (105 * quantity);
                protein = (int) (1 * quantity);
                carbs = (int) (27 * quantity);
                fats = 0;
                foodName = qtyStr + " Banana";
            } else if (normalized.contains("roti")) {
                calories = (int) (90 * quantity);
                protein = (int) (3 * quantity);
                carbs = (int) (18 * quantity);
                fats = (int) (1 * quantity);
                foodName = qtyStr + " Roti";
            } else if (normalized.contains("bread")) {
                calories = (int) (80 * quantity);
                protein = (int) (3 * quantity);
                carbs = (int) (15 * quantity);
                fats = (int) (1 * quantity);
                foodName = qtyStr + " Bread Slice";
            } else if (normalized.contains("rice") || normalized.contains("chawal")) {
                calories = (int) (200 * quantity);
                protein = (int) (4 * quantity);
                carbs = (int) (44 * quantity);
                fats = (int) (0.5 * quantity);
                foodName = qtyStr + " Bowl of Rice";
            } else if (normalized.contains("dal")) {
                calories = (int) (150 * quantity);
                protein = (int) (8 * quantity);
                carbs = (int) (20 * quantity);
                fats = (int) (2 * quantity);
                foodName = qtyStr + " Bowl of Dal";
            } else if (normalized.contains("paneer")) {
                calories = (int) (250 * quantity);
                protein = (int) (18 * quantity);
                carbs = (int) (4 * quantity);
                fats = (int) (20 * quantity);
                foodName = qtyStr + " Plate of Paneer";
            } else if (normalized.contains("chicken")) {
                calories = (int) (220 * quantity);
                protein = (int) (30 * quantity);
                carbs = 0;
                fats = (int) (10 * quantity);
                foodName = qtyStr + " Chicken Portion";
            } else if (normalized.contains("dahi") || normalized.contains("curd")) {
                calories = (int) (100 * quantity);
                protein = (int) (5 * quantity);
                carbs = (int) (6 * quantity);
                fats = (int) (4 * quantity);
                foodName = qtyStr + " Cup of Dahi";
            } else if (normalized.contains("milk") || normalized.contains("doodh")) {
                calories = (int) (120 * quantity);
                protein = (int) (6 * quantity);
                carbs = (int) (9 * quantity);
                fats = (int) (6 * quantity);
                foodName = qtyStr + " Glass of Milk";
            } else if (normalized.contains("salad")) {
                calories = (int) (50 * quantity);
                protein = (int) (1 * quantity);
                carbs = (int) (10 * quantity);
                fats = 0;
                foodName = qtyStr + " Bowl of Salad";
            } else if (normalized.contains("fruit") || normalized.contains("fruits")) {
                calories = (int) (80 * quantity);
                protein = (int) (1 * quantity);
                carbs = (int) (20 * quantity);
                fats = 0;
                foodName = qtyStr + " Fruit";
            } else if (normalized.contains("juice")) {
                calories = (int) (120 * quantity);
                protein = (int) (1 * quantity);
                carbs = (int) (28 * quantity);
                fats = 0;
                foodName = qtyStr + " Glass of Juice";
            } else if (normalized.contains("chai") || normalized.contains("tea")) {
                calories = (int) (90 * quantity);
                protein = (int) (2 * quantity);
                carbs = (int) (15 * quantity);
                fats = (int) (3 * quantity);
                foodName = qtyStr + " Cup of Chai";
            } else if (normalized.contains("coffee")) {
                calories = (int) (110 * quantity);
                protein = (int) (2 * quantity);
                carbs = (int) (18 * quantity);
                fats = (int) (3 * quantity);
                foodName = qtyStr + " Cup of Coffee";
            } else if (normalized.contains("breakfast") || normalized.contains("nashta")) {
                mealType = "BREAKFAST";
                calories = 350;
                protein = 12;
                carbs = 45;
                fats = 10;
                foodName = "Breakfast";
            } else if (normalized.contains("lunch")) {
                mealType = "LUNCH";
                calories = 500;
                protein = 20;
                carbs = 65;
                fats = 15;
                foodName = "Lunch";
            } else if (normalized.contains("dinner")) {
                mealType = "DINNER";
                calories = 500;
                protein = 20;
                carbs = 65;
                fats = 15;
                foodName = "Dinner";
            } else if (normalized.contains("snack")) {
                mealType = "SNACK";
                calories = 200;
                protein = 5;
                carbs = 25;
                fats = 6;
                foodName = "Snack";
            } else {
                mealType = "SNACK";
                calories = 400;
                protein = 15;
                carbs = 50;
                fats = 12;
                foodName = "Meal";
            }
            
            if (caloriesExplicit != null && caloriesExplicit > 0) {
                calories = caloriesExplicit.intValue();
                protein = calories / 20;
                carbs = calories / 10;
                fats = calories / 40;
            }

            if (calories > 0) {
                if (calories < 10 || calories > 3000) {
                    Map<String, Object> result = new HashMap<>();
                    result.put("status", "ERROR");
                    result.put("displayMessage", "Invalid Calories: Calories per meal must be between 10 and 3000 kcal.");
                    result.put("voiceMessage", "Calories per meal must be between 10 and 3000 kilocalories.");
                    return result;
                }
                
                MealDto mealDto = new MealDto();
                mealDto.setMealType(mealType);
                mealDto.setCalories(calories);
                mealDto.setProtein(protein);
                mealDto.setCarbs(carbs);
                mealDto.setFats(fats);
                mealDto.setNotes(foodName + " (Voice Log)");
                com.wellnest.app.model.Meal mealEntity = trackerService.createMealForUser(userId, mealDto);
                
                Map<String, Object> result = new HashMap<>();
                result.put("status", "SUCCESS");
                result.put("action", "MEAL");
                result.put("createdId", mealEntity.getId());
                result.put("createdType", "MEAL");
                result.put("displayMessage", String.format("Logged %s (%d kcal, %dg Protein)! Swasth khao! 🥗", foodName, calories, protein));
                result.put("voiceMessage", String.format("Logged %s. %d calories and %d grams of protein.", foodName, calories, protein));
                log.info("Regex Match SUCCESS: logged meal {} for user {}", foodName, userId);
                return result;
            }
        }

        return null;
    }

    private Double extractFirstNumber(String text) {
        Pattern p = Pattern.compile("(\\d+(\\.\\d+)?)");
        Matcher m = p.matcher(text);
        if (m.find()) {
            try {
                return Double.parseDouble(m.group(1));
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    private boolean isWellnessRelated(String text) {
        if (text == null || text.trim().isEmpty()) return false;
        String normalized = text.toLowerCase();
        
        String[] keywords = {
            // Workout & Physical Activities
            "workout", "work-out", "gym", "run", "running", "walk", "walking", "walked", "yoga", "exercise", "excersise", "cardio", "hiit", 
            "strength", "boxing", "cycling", "cycle", "swimming", "swim", "stretching", "stretch", "pilates", "dauda", "doda", "bhaga", "bhage", 
            "worked", "work out", "work ",
            "kasrat", "training", "steps", "step", "kadam", "chala", "distance", "km", "kiya", "kia", "ki", "kar", "kara", "karna",

            // Water & Drinks
            "water", "paani", "pani", "glass", "gilaas", "gilas", "liter", "litre", "ml", "bottle", "botal", "cup", "drink", 
            "piya", "peeya", "peea", "piye", "piyi", "pi", "pee", "peena", "drank", "drinking", "chai", "coffee", "juice",
            
            // Meals & Foods
            "food", "meal", "khaya", "khana", "khaaya", "khae", "khaye", "khayi", "khai", "khao", "khayein", "eat", "ate", "eating", "eaten", "had", "had", "took", "take",
            "breakfast", "lunch", "dinner", "snack", "snacks", "roti", "rotiyan", "rotis", "rice", "chawal", "chicken", "egg", "eggs", "anda", "ande", "andey", 
            "shake", "protein", "whey", "apple", "apples", "seb", "banana", "bananas", "kela", "milk", "doodh", "dahi", "paneer", "curd", "calories", "kcal",
            
            // Workout & Physical Activities
            "workout", "work-out", "gym", "run", "running", "walk", "walking", "walked", "yoga", "exercise", "excersise", "cardio", "hiit", 
            "strength", "boxing", "cycling", "cycle", "swimming", "swim", "stretching", "stretch", "pilates", "dauda", "doda", "bhaga", "bhage", 
            "worked", "work out", "work ",
            "kasrat", "training", "steps", "step", "kadam", "chala", "distance", "km", "kiya", "kia", "ki", "kar", "kara", "karna",
            
            // Sleep & Rest
            "sleep", "slept", "sleeping", "soya", "soye", "soyi", "neend", "hour", "hours", "hr", "hrs", "ghante", "ghanta",
            
            // Weight & Stats
            "weight", "vazan", "vajan"
        };
        
        for (String keyword : keywords) {
            if (normalized.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private String heuristicClassify(String normalized) {
        if (normalized.contains("step") || normalized.contains("kadam") || 
            normalized.contains("km") || normalized.contains("kilometer") || normalized.contains("kilometre") ||
            ((normalized.contains("chala") || normalized.contains("chle") || normalized.contains("chale") || 
              normalized.contains("chali") || normalized.contains("chla") || normalized.contains("walked") || 
              normalized.contains("walk"))
             && !(normalized.contains("minute") || normalized.contains("minutes") || normalized.contains("min") || 
                  normalized.contains("mins") || normalized.contains("hour") || normalized.contains("hours") || 
                  normalized.contains("ghante") || normalized.contains("ghanta") || normalized.contains("hr") || 
                  normalized.contains("hrs")))) {
            return "ACTIVITY";
        }
        if ((normalized.contains("water") || normalized.contains("paani") || 
            normalized.contains("gilaas") || normalized.contains("glass") || 
            normalized.contains("botal") || normalized.contains("bottle") || 
            normalized.contains("ml"))
            && !(normalized.contains("milk") || normalized.contains("doodh") || normalized.contains("juice") || 
                 normalized.contains("chai") || normalized.contains("tea") || normalized.contains("coffee") || 
                 normalized.contains("shake") || normalized.contains("lassi"))) {
            return "WATER";
        }
        if (normalized.contains("sleep") || normalized.contains("soya") || 
            normalized.contains("neend") || normalized.contains("soye") ||
            normalized.contains("soyi") || normalized.contains("slept") || 
            normalized.contains("sleeping")) {
            return "SLEEP";
        }
        if (normalized.contains("workout") || normalized.contains("gym") || 
            normalized.contains("yoga") || normalized.contains("cardio") || 
            normalized.contains("hiit") || normalized.contains("stretching") ||
            normalized.contains("exercise") || normalized.contains("excersise") || 
            normalized.contains("kasrat") || normalized.contains("training") ||
            normalized.contains("worked") || normalized.contains("work out") || normalized.contains("work ") ||
            (normalized.contains("walk") && (normalized.contains("minute") || normalized.contains("min") || 
                                              normalized.contains("hour") || normalized.contains("ghante") || 
                                              normalized.contains("ghanta")))) {
            return "WORKOUT";
        }
        if (normalized.contains("roti") || normalized.contains("egg") || 
            normalized.contains("anda") || normalized.contains("ande") || 
            normalized.contains("bread") || normalized.contains("breakfast") || 
            normalized.contains("lunch") || normalized.contains("dinner") || 
            normalized.contains("snack") || normalized.contains("khaya") || 
            normalized.contains("khayi") || normalized.contains("khaye") ||
            normalized.contains("milk") || normalized.contains("doodh") ||
            normalized.contains("juice") || normalized.contains("shake")) {
            return "MEAL";
        }
        return null;
    }

    private Map<String, Object> tryHeuristicParse(Long userId, String transcript) {
        String normalized = TranscriptNormalizer.normalize(transcript);
        normalized = NumberParser.resolveNumbers(normalized);
        
        String action = heuristicClassify(normalized);
        if (action == null) return null;
        
        Double value = extractFirstNumber(normalized);
        DurationParser.QuantityResult durationRes = DurationParser.parse(normalized, transcript);
        
        Map<String, Object> result = new HashMap<>();
        result.put("status", "SUCCESS");
        result.put("action", action);
        
        switch (action) {
            case "WATER":
                double liters = 0.25;
                if (value != null) {
                    if (normalized.contains("ml")) liters = value * 0.001;
                    else if (normalized.contains("liter") || normalized.contains("litre") || normalized.contains(" l ") || normalized.endsWith(" l") || normalized.contains(" l.")) liters = value;
                    else if (normalized.contains("bottle")) liters = value * 1.0;
                    else liters = value * 0.25;
                }
                
                boolean explicitlyLiters = normalized.contains("liter") || normalized.contains("litre") || 
                                           normalized.contains(" l ") || normalized.endsWith(" l") || normalized.contains(" l.");
                
                if (!explicitlyLiters && liters > 10.0) {
                    liters = liters / 1000.0;
                }
                
                if (liters < 0.05 || liters > 2.0) {
                    result.put("status", "ERROR");
                    result.put("displayMessage", "Invalid Quantity: Water logged at once must be between 0.05L (50ml) and 2.0L.");
                    result.put("voiceMessage", "Water logged at once must be between 50ml and 2 liters.");
                    return result;
                }
                
                WaterIntakeDto waterDto = new WaterIntakeDto();
                waterDto.setLiters(liters);
                waterDto.setNotes("Logged via Voice (Heuristic Fallback)");
                com.wellnest.app.model.WaterIntake waterEntity = trackerService.createWaterForUser(userId, waterDto);
                result.put("createdId", waterEntity.getId());
                result.put("createdType", "WATER");
                result.put("displayMessage", String.format("Logged %.2fL of water! Hydrated raho! 💧 (Fallback)", liters));
                result.put("voiceMessage", String.format("Logged %.2f liters of water.", liters));
                return result;
                
            case "ACTIVITY":
                int steps = 0;
                double distanceKm = 0.0;
                if (value != null && value > 0.0) {
                    if (normalized.contains("km") || normalized.contains("kilometer") || normalized.contains("kilometre")) {
                        distanceKm = value;
                        steps = (int) Math.round(distanceKm / 0.00075);
                    } else {
                        steps = value.intValue();
                        distanceKm = steps * 0.00075;
                    }
                } else {
                    steps = 1000;
                    distanceKm = 0.75;
                }
                
                if (steps < 1 || steps > 50000) {
                    result.put("status", "ERROR");
                    result.put("displayMessage", "Invalid Steps: Steps logged manually must be between 1 and 50,000 steps.");
                    result.put("voiceMessage", "Steps logged manually must be between 1 and 50,000 steps.");
                    return result;
                }
                
                DailyActivityDto activityDto = new DailyActivityDto();
                activityDto.setSteps(steps);
                activityDto.setDistanceKm(distanceKm);
                activityDto.setIsSync(false);
                com.wellnest.app.model.DailyActivity activityEntity = trackerService.logDailyActivity(userId, activityDto);
                result.put("createdId", activityEntity.getId());
                result.put("createdType", "ACTIVITY");
                result.put("displayMessage", String.format("Logged %.2f km (%d steps)! Kadam badhate raho! 🏃‍♂️ (Fallback)", distanceKm, steps));
                result.put("voiceMessage", String.format("Logged %.2f kilometers.", distanceKm));
                return result;
                
            case "SLEEP":
                double hours = durationRes.hasDuration ? durationRes.getAsHours() : 8.0;
                if (hours < 3.0 || hours > 18.0) {
                    result.put("status", "ERROR");
                    result.put("displayMessage", "Invalid Duration: Sleep duration must be between 3 and 18 hours.");
                    result.put("voiceMessage", "Sleep duration must be between 3 and 18 hours.");
                    return result;
                }
                
                String quality = "GOOD";
                if (hours < 6.0) {
                    quality = "POOR";
                }
                
                SleepLogDto sleepDto = new SleepLogDto();
                sleepDto.setHours(hours);
                sleepDto.setQuality(quality);
                sleepDto.setNotes("Logged via Voice (Heuristic Fallback)");
                com.wellnest.app.model.SleepLog sleepEntity = trackerService.createSleepForUser(userId, sleepDto);
                result.put("createdId", sleepEntity.getId());
                result.put("createdType", "SLEEP");
                result.put("displayMessage", String.format("Logged %.1f hours of sleep! Quality was marked %s. 💤 (Fallback)", hours, quality.toLowerCase()));
                result.put("voiceMessage", String.format("Logged %.1f hours of sleep.", hours));
                return result;
                
            case "WORKOUT":
                int duration = durationRes.hasDuration ? (int) Math.round(durationRes.getAsMinutes()) : 30;
                if (duration < 5 || duration > 180) {
                    result.put("status", "ERROR");
                    result.put("displayMessage", "Invalid Duration: Workout duration must be between 5 and 180 minutes (3 hours).");
                    result.put("voiceMessage", "Workout duration must be between 5 and 180 minutes.");
                    return result;
                }
                
                int caloriesBurned = duration * 8;
                
                WorkoutDto workoutDto = new WorkoutDto();
                workoutDto.setType("General");
                workoutDto.setDurationMinutes(duration);
                workoutDto.setCaloriesBurned(caloriesBurned);
                workoutDto.setNotes("Logged via Voice (Heuristic Fallback)");
                com.wellnest.app.model.Workout workoutEntity = trackerService.createWorkoutForUser(userId, workoutDto);
                result.put("createdId", workoutEntity.getId());
                result.put("createdType", "WORKOUT");
                result.put("displayMessage", String.format("Logged %d mins of workout (%d kcal)! Keep sweating! 🔥 (Fallback)", duration, caloriesBurned));
                result.put("voiceMessage", String.format("Logged %d minutes of workout.", duration));
                return result;
                
            case "MEAL":
                int mealCals = 250;
                String foodName = "Meal";
                if (normalized.contains("roti")) {
                    int qty = value != null ? value.intValue() : 1;
                    mealCals = qty * 90;
                    foodName = qty + " Roti";
                } else if (normalized.contains("egg") || normalized.contains("anda") || normalized.contains("ande")) {
                    int qty = value != null ? value.intValue() : 1;
                    mealCals = qty * 75;
                    foodName = qty + " Egg";
                } else if (normalized.contains("shake")) {
                    mealCals = 150;
                    foodName = "Protein Shake";
                }
                
                if (mealCals < 10 || mealCals > 3000) {
                    result.put("status", "ERROR");
                    result.put("displayMessage", "Invalid Calories: Calories per meal must be between 10 and 3000 kcal.");
                    result.put("voiceMessage", "Calories per meal must be between 10 and 3000 kilocalories.");
                    return result;
                }
                
                MealDto mealDto = new MealDto();
                mealDto.setMealType("SNACK");
                mealDto.setCalories(mealCals);
                mealDto.setProtein(mealCals / 20);
                mealDto.setCarbs(mealCals / 10);
                mealDto.setFats(mealCals / 40);
                mealDto.setNotes(foodName + " (Heuristic Fallback)");
                com.wellnest.app.model.Meal mealEntity = trackerService.createMealForUser(userId, mealDto);
                result.put("createdId", mealEntity.getId());
                result.put("createdType", "MEAL");
                result.put("displayMessage", String.format("Logged %s (%d kcal)! Swasth khao! 🥗 (Fallback)", foodName, mealCals));
                result.put("voiceMessage", String.format("Logged %s.", foodName));
                return result;
        }
        return null;
    }
}
