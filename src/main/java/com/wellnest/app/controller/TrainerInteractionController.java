package com.wellnest.app.controller;

import com.wellnest.app.dto.ChatMessageDto;
import com.wellnest.app.dto.ConnectionRequestDto;
import com.wellnest.app.dto.ConnectionResponseDto;
import com.wellnest.app.service.TrainerInteractionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trainer-interactions")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class TrainerInteractionController {

    private final TrainerInteractionService service;

    public TrainerInteractionController(TrainerInteractionService service) {
        this.service = service;
    }

    // Client requests connection to Trainer
    @PostMapping("/connect/{trainerId}")
    public ResponseEntity<String> requestConnection(
            @PathVariable Long trainerId,
            @RequestBody ConnectionRequestDto requestDto,
            @AuthenticationPrincipal UserDetails userDetails) {
        service.requestConnection(trainerId, userDetails.getUsername(), requestDto.getInitialMessage());
        return ResponseEntity.ok("Connection requested successfully");
    }

    // Trainer gets their requests (Active, Pending, etc)
    @GetMapping("/requests")
    public ResponseEntity<List<ConnectionResponseDto>> getRequestsForTrainer(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(service.getTrainerRequests(userDetails.getUsername()));
    }

    // Client gets their requests (to see status)
    @GetMapping("/client-requests")
    public ResponseEntity<List<ConnectionResponseDto>> getRequestsForClient(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(service.getClientRequests(userDetails.getUsername()));
    }

    // Trainer responds (Accept/Reject)
    @PutMapping("/requests/{requestId}")
    public ResponseEntity<String> respondToRequest(
            @PathVariable Long requestId,
            @RequestParam String status) {
        service.respondToRequest(requestId, status);
        return ResponseEntity.ok("Request updated");
    }

    // Send Message
    @PostMapping("/chat/send/{receiverId}")
    public ResponseEntity<String> sendMessage(
            @PathVariable Long receiverId,
            @RequestBody ConnectionRequestDto messageDto, // Reusing DTO for simple string content
            @AuthenticationPrincipal UserDetails userDetails) {
        service.sendMessage(userDetails.getUsername(), receiverId, messageDto.getInitialMessage());
        return ResponseEntity.ok("Message sent");
    }

    // Get Chat History with a specific user
    @GetMapping("/chat/{otherUserId}")
    public ResponseEntity<List<ChatMessageDto>> getChatHistory(
            @PathVariable Long otherUserId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(service.getChatHistory(userDetails.getUsername(), otherUserId));
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<com.wellnest.app.dto.ClientProfileDto> getClientDetails(@PathVariable Long clientId) {
        return ResponseEntity.ok(service.getClientProfile(clientId));
    }
}
