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
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;

import javax.annotation.PostConstruct;
import java.util.Collections;

@Service
@Slf4j
public class GroqService {

    @Value("${groq.api.key:}")
    private String groqApiKey;

    @Value("${groq.model.heavy:llama-3.3-70b-versatile}")
    private String heavyModel;

    @Value("${groq.model.fast:llama-3.1-8b-instant}")
    private String fastModel;

    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final SystemSettingsService systemSettingsService;

    private RestTemplate fastRestTemplate;
    private RestTemplate heavyRestTemplate;

    public GroqService(SystemSettingsService systemSettingsService) {
        this.systemSettingsService = systemSettingsService;
    }

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

        // Initialize RestTemplate with custom request factories to support connection pooling and timeouts
        org.springframework.http.client.SimpleClientHttpRequestFactory fastFactory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        fastFactory.setConnectTimeout(5000);  // 5 seconds
        fastFactory.setReadTimeout(15000);    // 15 seconds (Whisper/voice commands are fast)
        this.fastRestTemplate = new RestTemplate(fastFactory);

        org.springframework.http.client.SimpleClientHttpRequestFactory heavyFactory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        heavyFactory.setConnectTimeout(10000); // 10 seconds
        heavyFactory.setReadTimeout(50000);   // 50 seconds (Weekly reports are complex)
        this.heavyRestTemplate = new RestTemplate(heavyFactory);
    }

    public String generateNotification(String role, String name, String context) {
        String systemPrompt = "You are an elite AI health and wellness coach (personality: High-Energy, Professional Athlete Coach). " +
                "Generate a short, hyper-personalized push notification (max 120 chars) for a " + role + " named " + name + ". " +
                "STRATEGY: Use the provided context to create a 'hook'. If logs are missing, mention the performance gap. If streaks exist, celebrate them. " +
                "NEVER be boring. NEVER use generic templates. " +
                "CONTEXT: " + context + ". ";
        return getResponse(systemPrompt, fastModel, 40);
    }

    public String transcribeAudio(MultipartFile audio) {
        if (!systemSettingsService.isAiEnabled()) {
            log.warn("Global AI is DISABLED. Skipping Groq Whisper.");
            return "AI Systems are currently resting. Please try again later.";
        }

        log.info("Sending Voice Scan to Groq Whisper...");
        try {
            RestTemplate restTemplate = this.fastRestTemplate;
            
            // Multi-part Form Headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.set("Authorization", "Bearer " + groqApiKey);

            // Multi-part Body
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("model", "whisper-large-v3");
            body.add("prompt", "Wellnest fitness tracker voice log. Mixture of English, Hindi and Hinglish. e.g. 'Maine 2 glass paani piya', '1 hour gym workout done', '6 hours of sleep quality poor', 'Log 500ml water', 'Lunch me 3 roti khayi'. Keep spelling natural.");
            
            // Wrap MultipartFile for RestTemplate
            Resource resource = new ByteArrayResource(audio.getBytes()) {
                @Override
                public String getFilename() { return audio.getOriginalFilename(); }
            };
            body.add("file", resource);

            HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    "https://api.groq.com/openai/v1/audio/transcriptions",
                    HttpMethod.POST,
                    entity,
                    String.class);

            JsonNode jsonResponse = objectMapper.readTree(response.getBody());
            String text = jsonResponse.path("text").asText();
            
            log.info("Whisper Transcription Successful: {}", text);
            return text;

        } catch (Exception e) {
            log.error("Groq Whisper failed: {}", e.getMessage());
            return "Unable to transcribe voice scan. (AI Sync error)";
        }
    }

    public String getResponse(String prompt) {
        return getResponse(prompt, heavyModel);
    }

    public String getResponse(String prompt, String modelName) {
        return getResponse(prompt, modelName, null);
    }

    public String getResponse(String prompt, String modelName, Integer maxTokens) {
        if (!systemSettingsService.isAiEnabled()) {
            log.warn("Global AI is DISABLED. Skipping Groq Completions.");
            return "I'm focusing on your stats, let's keep the momentum high today! (AI Server Maintenance)";
        }

        log.info("Sending prompt to Groq API (Model: {})...", modelName);
        try {
            // Determine RestTemplate based on request complexity (heavy vs fast)
            RestTemplate restTemplate = (modelName != null && modelName.equals(heavyModel)) 
                    ? this.heavyRestTemplate 
                    : this.fastRestTemplate;

            // Headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + groqApiKey);

            // Request Body (OpenAI format)
            ObjectNode rootNode = objectMapper.createObjectNode();
            rootNode.put("model", modelName);
            
            // Speed up parsing queries by forcing JSON Mode and 0.1 temperature
            if (prompt.toLowerCase().contains("json")) {
                rootNode.put("temperature", 0.1);
                ObjectNode responseFormatNode = rootNode.putObject("response_format");
                responseFormatNode.put("type", "json_object");
            } else {
                rootNode.put("temperature", 0.7);
            }

            if (maxTokens != null) {
                rootNode.put("max_tokens", maxTokens);
            }

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
            
            // Track Tokens
            long tokensUsed = jsonResponse.path("usage").path("total_tokens").asLong(0);
            if (tokensUsed > 0) {
                systemSettingsService.addTokens(tokensUsed);
            }
            
            log.info("Groq Generation Successful. Tokens used: {}", tokensUsed);
            return out;

        } catch (Exception e) {
            log.error("Groq API Error: {}", e.getMessage());
            return "I'm focusing on your stats, let's keep the momentum high today! (AI Sync delayed)";
        }
    }
}
