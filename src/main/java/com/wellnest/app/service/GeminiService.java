package com.wellnest.app.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String primaryKey;

    @Value("${gemini.api.key.secondary:}")
    private String secondaryKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=";

    private final Map<String, String> responseCache = new java.util.concurrent.ConcurrentHashMap<>();

    // Public method handles caching and failover
    public String getResponse(String prompt) {
        String cacheKey = prompt.trim();
        if (responseCache.containsKey(cacheKey)) {
            System.out.println(
                    "Serving from cache: " + (cacheKey.length() > 20 ? cacheKey.substring(0, 20) + "..." : cacheKey));
            return responseCache.get(cacheKey);
        }

        // Try Primary Key
        try {
            return callGeminiApi(prompt, primaryKey, cacheKey);
        } catch (org.springframework.web.client.HttpClientErrorException.TooManyRequests e) {
            System.err.println("Primary Key Rate Limited! Checking secondary...");

            // Try Secondary Key if available
            if (secondaryKey != null && !secondaryKey.isBlank()) {
                try {
                    return callGeminiApi(prompt, secondaryKey, cacheKey);
                } catch (Exception ex) {
                    System.err.println("Secondary Key also failed: " + ex.getMessage());
                }
            }
            return "I'm receiving too many messages right now and my brain is overloaded! 🤯 Please give me a minute to cool down and try asking again.";

        } catch (Exception e) {
            System.err.println("Gemini API Error: " + e.getMessage());
            return "I apologize, but I am unable to connect to my brain right now. Please try again later.";
        }
    }

    // Helper method for the actual API call
    private String callGeminiApi(String prompt, String currentKey, String cacheKey) {
        String url = GEMINI_API_URL + currentKey;

        // Request Body
        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", List.of(part));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(content));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

        if (response.getBody() != null && response.getBody().containsKey("candidates")) {
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.getBody().get("candidates");
            if (!candidates.isEmpty()) {
                Map<String, Object> firstCandidate = candidates.get(0);
                if (firstCandidate.containsKey("content")) {
                    Map<String, Object> contentMap = (Map<String, Object>) firstCandidate.get("content");
                    if (contentMap.containsKey("parts")) {
                        List<Map<String, Object>> parts = (List<Map<String, Object>>) contentMap.get("parts");
                        if (!parts.isEmpty()) {
                            Map<String, Object> firstPart = parts.get(0);
                            String aiResponse = (String) firstPart.get("text");
                            // Determine whether to cache based on content length or type if needed
                            responseCache.put(cacheKey, aiResponse);
                            return aiResponse;
                        }
                    }
                }
            }
        }
        throw new RuntimeException("Empty response from Gemini");
    }
}
