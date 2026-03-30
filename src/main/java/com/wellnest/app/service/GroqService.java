package com.wellnest.app.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.annotation.PostConstruct;

@Service
@Slf4j
public class GroqService {

    @Value("${groq.api.key:}")
    private String groqApiKey;

    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
    // Standard model for stability
    private static final String MODEL = "llama-3.3-70b-versatile";

    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostConstruct
    public void init() {
        // Fallback to environment variable if @Value is empty (handles Render capitalization)
        if (groqApiKey == null || groqApiKey.isEmpty()) {
            groqApiKey = System.getenv("GROQ_API_KEY");
            if (groqApiKey != null && !groqApiKey.isEmpty()) {
                log.info("Groq API Key loaded from environment variable GROQ_API_KEY.");
            } else {
                log.error("GROQ_API_KEY is missing! AI features will not work.");
            }
        }
    }

    public String generateNotification(String role, String name, String context) {
        String systemPrompt = "You are an elite AI health and wellness coach for the Wellnest app. " +
                "Generate a short, hyper-personalized notification (max 120 chars) for a " + role + " named " + name + ". " +
                "Use the following real-time tracker data to provide a specific, actionable nudge or encouragement: " + context + ". ";
        return getResponse(systemPrompt);
    }

    public String getResponse(String prompt) {
        log.info("Sending prompt to Groq API...");
        try {
            // Using SimpleClientHttpRequestFactory for modern timeout control
            org.springframework.http.client.SimpleClientHttpRequestFactory factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(10000); // 10 seconds
            factory.setReadTimeout(35000);  // 35 seconds (Generative AI is slow)
            
            RestTemplate restTemplate = new RestTemplate(factory);

            // Headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + groqApiKey);

            // Request Body (OpenAI format)
            ObjectNode rootNode = objectMapper.createObjectNode();
            rootNode.put("model", MODEL);
            rootNode.put("temperature", 0.7);

            ArrayNode messages = rootNode.putArray("messages");
            ObjectNode message = messages.addObject();
            message.put("role", "user");
            message.put("content", prompt);

            HttpEntity<String> entity = new HttpEntity<>(rootNode.toString(), headers);

            log.info("Executing Groq Request...");
            ResponseEntity<String> response = restTemplate.exchange(
                    GROQ_API_URL,
                    HttpMethod.POST,
                    entity,
                    String.class);

            // Parse Response
            JsonNode jsonResponse = objectMapper.readTree(response.getBody());
            String out = jsonResponse.path("choices")
                    .get(0)
                    .path("message")
                    .path("content")
                    .asText();
            
            log.info("Groq Generation Successful.");
            return out;

        } catch (Exception e) {
            log.error("Groq API Error: {}", e.getMessage());
            return "I'm focusing on your stats, let's keep the momentum high today! (AI Sync delayed)";
        }
    }
}
