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

        String aiResponse = groqService.getResponse(promptBuilder.toString());

        return ResponseEntity.ok(Map.of("response", aiResponse));
    }
}
