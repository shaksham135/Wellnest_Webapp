package com.wellnest.app.service;

import com.wellnest.app.dto.ChatMessageDto;
import com.wellnest.app.dto.ConnectionResponseDto;
import com.wellnest.app.model.ChatMessage;
import com.wellnest.app.model.Trainer;
import com.wellnest.app.model.TrainerClient;
import com.wellnest.app.model.User;
import com.wellnest.app.repository.ChatMessageRepository;
import com.wellnest.app.repository.TrainerClientRepository;
import com.wellnest.app.repository.TrainerRepository;
import com.wellnest.app.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TrainerInteractionService {

        private final TrainerClientRepository trainerClientRepository;
        private final ChatMessageRepository chatMessageRepository;
        private final TrainerRepository trainerRepository;
        private final UserRepository userRepository;

        public TrainerInteractionService(TrainerClientRepository trainerClientRepository,
                        ChatMessageRepository chatMessageRepository,
                        TrainerRepository trainerRepository,
                        UserRepository userRepository) {
                this.trainerClientRepository = trainerClientRepository;
                this.chatMessageRepository = chatMessageRepository;
                this.trainerRepository = trainerRepository;
                this.userRepository = userRepository;
        }

        public void requestConnection(Long trainerId, String userEmail, String message) {
                User user = userRepository.findByEmail(userEmail)
                                .orElseThrow(() -> new RuntimeException("User not found"));
                Trainer trainer = trainerRepository.findById(trainerId)
                                .orElseThrow(() -> new RuntimeException("Trainer not found"));

                var existingRequest = trainerClientRepository.findByTrainerIdAndClientId(trainerId, user.getId());

                if (existingRequest.isPresent()) {
                        TrainerClient req = existingRequest.get();
                        if ("REJECTED".equals(req.getStatus())) {
                                req.setStatus("PENDING");
                                req.setInitialMessage(message);
                                trainerClientRepository.save(req);
                                return;
                        }
                        throw new RuntimeException("Request already exists");
                }

                TrainerClient request = new TrainerClient(trainer, user, "PENDING", message);
                trainerClientRepository.save(request);
        }

        public List<ConnectionResponseDto> getTrainerRequests(String trainerUserEmail) {
                User user = userRepository.findByEmail(trainerUserEmail)
                                .orElseThrow(() -> new RuntimeException("User not found"));
                Trainer trainer = trainerRepository.findByUserId(user.getId())
                                .orElseThrow(() -> new RuntimeException("Trainer profile not found for this user"));

                return trainerClientRepository.findByTrainerId(trainer.getId()).stream()
                                .map(this::mapToConnectionResponse)
                                .collect(Collectors.toList());
        }

        // New: Get requests for a regular client (User) to see their status
        public List<ConnectionResponseDto> getClientRequests(String userEmail) {
                User user = userRepository.findByEmail(userEmail)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                return trainerClientRepository.findByClientId(user.getId()).stream()
                                .map(this::mapToConnectionResponse)
                                .collect(Collectors.toList());
        }

        public void respondToRequest(Long requestId, String status) {
                TrainerClient request = trainerClientRepository.findById(requestId)
                                .orElseThrow(() -> new RuntimeException("Request not found"));
                request.setStatus(status);
                trainerClientRepository.save(request);
        }

        public void sendMessage(String senderEmail, Long receiverId, String content) {
                User sender = userRepository.findByEmail(senderEmail)
                                .orElseThrow(() -> new RuntimeException("User not found"));
                User receiver = userRepository.findById(receiverId)
                                .orElseThrow(() -> new RuntimeException("Receiver not found"));

                ChatMessage message = new ChatMessage(sender, receiver, content);
                chatMessageRepository.save(message);
        }

        public List<ChatMessageDto> getChatHistory(String userEmail, Long otherUserId) {
                User currentUser = userRepository.findByEmail(userEmail)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                // Find messages where (sender=callee and receiver=other) OR (sender=other and
                // receiver=callee)
                return chatMessageRepository.findBySenderIdAndReceiverIdOrSenderIdAndReceiverIdOrderByTimestampAsc(
                                currentUser.getId(), otherUserId, otherUserId, currentUser.getId())
                                .stream()
                                .map(msg -> {
                                        ChatMessageDto dto = new ChatMessageDto();
                                        dto.setContent(msg.getContent());
                                        dto.setSenderId(msg.getSender().getId());
                                        dto.setReceiverId(msg.getReceiver().getId());
                                        dto.setSenderName(msg.getSender().getName());
                                        dto.setTimestamp(msg.getTimestamp());
                                        return dto;
                                })
                                .collect(Collectors.toList());
        }

        public com.wellnest.app.dto.ClientProfileDto getClientProfile(Long clientId) {
                User client = userRepository.findById(clientId)
                                .orElseThrow(() -> new RuntimeException("Client not found"));
                return new com.wellnest.app.dto.ClientProfileDto(client.getId(), client.getName(), client.getEmail(),
                                client.getAge(), client.getHeightCm(), client.getWeightKg(), client.getFitnessGoal());
        }

        private ConnectionResponseDto mapToConnectionResponse(TrainerClient tc) {
                ConnectionResponseDto dto = new ConnectionResponseDto();
                dto.setId(tc.getId());
                dto.setTrainerId(tc.getTrainer().getId());
                dto.setTrainerName(tc.getTrainer().getName());
                dto.setClientId(tc.getClient().getId());
                dto.setClientName(tc.getClient().getName());
                dto.setStatus(tc.getStatus());
                dto.setInitialMessage(tc.getInitialMessage());
                dto.setCreatedAt(tc.getCreatedAt());
                return dto;
        }
}
