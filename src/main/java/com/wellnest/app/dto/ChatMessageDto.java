package com.wellnest.app.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ChatMessageDto {
    private String content;
    private Long senderId; // For receiving
    private Long receiverId; // For sending
    private String senderName;
    private LocalDateTime timestamp;
}
