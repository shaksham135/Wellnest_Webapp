package com.wellnest.app.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

@Service
public class GroqService {

    @Value("${groq.api.key}")
    private String groqApiKey;

    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
    // Using Llama 3.3 for latest features and stability
    private static final String MODEL = "llama-3.3-70b-versatile";

    private final ObjectMapper objectMapper = new ObjectMapper();

    public String getResponse(String prompt) {
        try {
            RestTemplate restTemplate = new RestTemplate();

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

            // Execute Request
            ResponseEntity<String> response = restTemplate.exchange(
                    GROQ_API_URL,
                    HttpMethod.POST,
                    entity,
                    String.class);

            // Parse Response
            JsonNode jsonResponse = objectMapper.readTree(response.getBody());
            return jsonResponse.path("choices")
                    .get(0)
                    .path("message")
                    .path("content")
                    .asText();

        } catch (Exception e) {
            e.printStackTrace();
            return "I'm having trouble connecting to my brain right now. Please try again later. (Error: "
                    + e.getMessage() + ")";
        }
    }
}
