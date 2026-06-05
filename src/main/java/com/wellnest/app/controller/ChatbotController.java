package com.wellnest.app.controller;

import com.wellnest.app.model.User;
import com.wellnest.app.service.GroqService;
import com.wellnest.app.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/chat")
public class ChatbotController {

    @Autowired
    private GroqService groqService;

    @Autowired
    private UserService userService;

    @Autowired
    private com.wellnest.app.repository.WorkoutRepository workoutRepository;

    @Autowired
    private com.wellnest.app.repository.MealRepository mealRepository;

    @PostMapping("/ask")
    public ResponseEntity<?> askChatbot(@RequestBody Map<String, String> request) {
        String query = request.get("query");
        if (query == null || query.isBlank()) {
            return ResponseEntity.badRequest().body("Query is required");
        }

        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("You are Wellnest AI, a friendly and empathetic health assistant. ");

        // Context Check
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            String email = auth.getName();
            Optional<User> userOpt = userService.findByEmail(email);

            if (userOpt.isPresent()) {
                User user = userOpt.get();

                // --- MONETIZATION LOGIC: DAILY LIMIT ---
                java.time.LocalDate today = java.time.LocalDate.now();
                
                // Reset counter if it's a new day
                if (user.getLastChatDate() == null || !user.getLastChatDate().isEqual(today)) {
                    user.setDailyChatCount(0);
                    user.setLastChatDate(today);
                }

                // Check limit for non-premium users
                if (!user.isPremium() && user.getDailyChatCount() >= 10) {
                    return ResponseEntity.status(403).body(Map.of(
                        "error", "Limit Reached",
                        "message", "You've reached your free daily limit of 10 messages. Upgrade to Wellnest Premium for unlimited coaching and 24/7 support!",
                        "limitReached", true
                    ));
                }

                // Increment count for current request
                user.setDailyChatCount(user.getDailyChatCount() + 1);
                userService.save(user); // Persist immediately

                // Smart Context Injection: Only provide full stats if the query relates to the
                // user
                String lowerQuery = query.toLowerCase();
                boolean isPersonalQuery = lowerQuery.matches(
                        ".*\\b(my|me|i|weight|height|bmi|plan|routine|diet|progress|stats|analysis|goal|history|recommend|suggest)\\b.*");

                if (isPersonalQuery) {
                    promptBuilder.append("<UserContext>");
                    promptBuilder.append("Name: ").append(user.getName() != null ? user.getName() : "User")
                            .append(". ");
                    promptBuilder.append("Age: ")
                            .append(user.getAge() != null ? user.getAge() + " years old" : "Not specified")
                            .append(". ");
                    promptBuilder.append("Gender: ")
                            .append(user.getGender() != null ? user.getGender() : "Not specified").append(". ");

                    if (user.getHeightCm() != null) {
                        promptBuilder.append("Height: ").append(user.getHeightCm()).append("cm. ");
                    }
                    if (user.getWeightKg() != null) {
                        promptBuilder.append("Weight: ").append(user.getWeightKg()).append("kg. ");
                    }
                    promptBuilder.append("Fitness Goal: ")
                            .append(user.getFitnessGoal() != null ? user.getFitnessGoal() : "General Health")
                            .append(". ");

                    // Add Recent Workouts
                    var workouts = workoutRepository.findByUserIdOrderByPerformedAtDesc(user.getId());
                    if (!workouts.isEmpty()) {
                        promptBuilder.append("Recent Workouts: ");
                        workouts.stream().limit(3).forEach(w -> promptBuilder.append("[").append(w.getType())
                                .append(", ").append(w.getDurationMinutes()).append("mins, ")
                                .append(w.getCaloriesBurned()).append("kcal], "));
                    }
                    promptBuilder.append("</UserContext> ");
                    promptBuilder.append("INSTRUCTION: Use the <UserContext> to answer the user's personal question.");
                } else {
                    // Minimal Context for General Chat - STRICTLY ANONYMOUS
                    // We knowingly omit the name here to respect the user's desire for a
                    // "fresh/random" feel
                    // unless they explicitly ask for personal help.
                    promptBuilder.append(
                            "INSTRUCTION: The user is asking a general question. Answer it directly and politely as a helpful assistant. Do NOT mention their name, weight, BMI, or personal stats.");
                }

                // Add Recent Meals (Only if Personal)
                if (isPersonalQuery) {
                    var meals = mealRepository.findByUserIdOrderByLoggedAtDesc(user.getId());
                    if (!meals.isEmpty()) {
                        promptBuilder.append("Recent Meals: ");
                        meals.stream().limit(5).forEach(m -> promptBuilder.append("[").append(m.getMealType())
                                .append(": ").append(m.getCalories()).append("kcal], "));
                    }
                }
            } else {
                promptBuilder.append("Answer this general health question. ");
            }
        } else {
            promptBuilder
                    .append("Answer this general health question. Do not provide specific medical prescriptions. ");
            promptBuilder.append(
                    "IMPORTANT: If the user asks about their own personal data (like 'what is my BMI', 'my weight', 'my history'), ");
            promptBuilder.append(
                    "you MUST reply exactly with: 'Please log in to access your personal health data and insights.' ");
        }

        // Strict Guardrail
        promptBuilder.append(
                "IMPORTANT: You must ONLY answer questions related to health, fitness, nutrition, mental wellness, and exercise. ");
        promptBuilder.append(
                "If the question is about anything else (e.g. coding, history, math, politics), politely decline by saying: 'I am Wellnest AI, and I focus exclusively on your health and wellness.' ");

        promptBuilder.append("Question: \"").append(query).append("\"");
        promptBuilder.append("\n\n*** STRICT FORMATTING RULES ***\n");
        promptBuilder.append("- DATA FIRST: If specific data (BMI, Weight) is asked, state it immediately.\n");
        promptBuilder.append("- NO WALLS OF TEXT: Do not use paragraphs longer than 2 sentences.\n");
        promptBuilder.append("- BULLET POINTS REQUIRED: Use bullet points for every piece of advice or list.\n");
        promptBuilder.append("- BOLD KEY TERMS: Use **bold** for metrics, numbers, and key actions.\n");
        promptBuilder.append("- BE CONCISE: Total answer must be short and easy to scan on mobile.\n");

        String aiResponse = groqService.getResponse(promptBuilder.toString(), "llama-3.1-8b-instant", 300);

        return ResponseEntity.ok(Map.of("response", aiResponse));
    }

    @PostMapping("/analyze-meal")
    public ResponseEntity<?> analyzeMeal(@RequestBody Map<String, String> request) {
        String description = request.get("description");
        if (description == null || description.isBlank()) {
            return ResponseEntity.badRequest().body("Description is required");
        }

        // Try local matching first to save API tokens
        String localMatch = tryLocalMealAnalysis(description);
        if (localMatch != null) {
            return ResponseEntity.ok(localMatch);
        }

        String prompt = "Analyze the nutritional content of this meal: \"" + description + "\". " +
                "Return ONLY a valid JSON object with these exact keys: " +
                "{\"calories\": number, \"protein\": number, \"carbs\": number, \"fats\": number}. " +
                "Do not include any other text, markdown blocks, or explanation. " +
                "If you cannot determine the values, provide reasonable estimates based on average portions.";

        try {
            String aiResponse = groqService.getResponse(prompt, "llama-3.1-8b-instant", 40);
            
            // Clean up AI response in case it wraps with ```json ... ```
            String cleanedResponse = aiResponse.replaceAll("(?s).*?\\{(.*)\\}.*", "{$1}").trim();
            
            // Since we need to return it as a JSON object to the frontend, 
            // we'll just proxy the cleaned string if it looks like JSON.
            if (cleanedResponse.startsWith("{") && cleanedResponse.endsWith("}")) {
                return ResponseEntity.ok(cleanedResponse);
            } else {
                return ResponseEntity.status(500).body("AI returned invalid data format");
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body("AI Analysis failed: " + e.getMessage());
        }
    }

    private String tryLocalMealAnalysis(String description) {
        if (description == null) return null;
        String desc = description.toLowerCase().trim();
        
        int quantity = 1;
        java.util.regex.Matcher countMatcher = java.util.regex.Pattern.compile("(\\d+)").matcher(desc);
        if (countMatcher.find()) {
            try {
                quantity = Integer.parseInt(countMatcher.group(1));
            } catch (Exception e) {}
        } else {
            if (desc.contains("one") || desc.contains("ek") || desc.contains(" a ") || desc.startsWith("a ")) {
                quantity = 1;
            } else if (desc.contains("two") || desc.contains("do")) {
                quantity = 2;
            } else if (desc.contains("three") || desc.contains("teen")) {
                quantity = 3;
            } else if (desc.contains("four") || desc.contains("chaar")) {
                quantity = 4;
            }
        }
        
        int cal = 0, prot = 0, carb = 0, fat = 0;
        boolean matched = false;
        
        if (desc.contains("roti") || desc.contains("chapati") || desc.contains("chappati")) {
            cal += 90 * quantity;
            prot += 3 * quantity;
            carb += 18 * quantity;
            fat += 1 * quantity;
            matched = true;
        } else if (desc.contains("egg") || desc.contains("anda") || desc.contains("ande")) {
            cal += 75 * quantity;
            prot += 6 * quantity;
            carb += 0 * quantity;
            fat += 5 * quantity;
            matched = true;
        } else if (desc.contains("chicken") || desc.contains("murga") || desc.contains("murgi")) {
            cal += 165 * quantity;
            prot += 31 * quantity;
            carb += 0 * quantity;
            fat += 4 * quantity;
            matched = true;
        } else if (desc.contains("rice") || desc.contains("chawal") || desc.contains("bhaat")) {
            cal += 200 * quantity;
            prot += 4 * quantity;
            carb += 45 * quantity;
            fat += 0 * quantity;
            matched = true;
        } else if (desc.contains("apple") || desc.contains("seb")) {
            cal += 80 * quantity;
            prot += 0;
            carb += 20 * quantity;
            fat += 0;
            matched = true;
        } else if (desc.contains("banana") || desc.contains("kela")) {
            cal += 105 * quantity;
            prot += 1 * quantity;
            carb += 27 * quantity;
            fat += 0;
            matched = true;
        } else if (desc.contains("milk") || desc.contains("doodh")) {
            cal += 150 * quantity;
            prot += 8 * quantity;
            carb += 12 * quantity;
            fat += 8 * quantity;
            matched = true;
        } else if (desc.contains("curd") || desc.contains("dahi") || desc.contains("yogurt")) {
            cal += 100 * quantity;
            prot += 5 * quantity;
            carb += 6 * quantity;
            fat += 4 * quantity;
            matched = true;
        } else if (desc.contains("oat")) {
            cal += 150 * quantity;
            prot += 5 * quantity;
            carb += 27 * quantity;
            fat += 3 * quantity;
            matched = true;
        } else if (desc.contains("salad")) {
            cal += 40 * quantity;
            prot += 1 * quantity;
            carb += 8 * quantity;
            fat += 0;
            matched = true;
        } else if (desc.contains("paneer")) {
            cal += 265 * quantity;
            prot += 18 * quantity;
            carb += 1 * quantity;
            fat += 20 * quantity;
            matched = true;
        } else if (desc.contains("protein") || desc.contains("whey") || desc.contains("shake")) {
            cal += 120 * quantity;
            prot += 24 * quantity;
            carb += 3 * quantity;
            fat += 1;
            matched = true;
        } else if (desc.contains("tea") || desc.contains("chai")) {
            cal += 90 * quantity;
            prot += 2 * quantity;
            carb += 15 * quantity;
            fat += 3 * quantity;
            matched = true;
        } else if (desc.contains("coffee")) {
            cal += 80 * quantity;
            prot += 2 * quantity;
            carb += 12 * quantity;
            fat += 2 * quantity;
            matched = true;
        }
        
        if (matched) {
            return String.format("{\"calories\":%d,\"protein\":%d,\"carbs\":%d,\"fats\":%d}", cal, prot, carb, fat);
        }
        
        return null;
    }
}
