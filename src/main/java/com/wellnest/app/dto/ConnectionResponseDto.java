package com.wellnest.app.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ConnectionResponseDto {
    private Long id;
    private Long trainerId;
    private String trainerName;
    private Long clientId;
    private String clientName;
    private String status;
    private String initialMessage;
    private LocalDateTime createdAt;
}
