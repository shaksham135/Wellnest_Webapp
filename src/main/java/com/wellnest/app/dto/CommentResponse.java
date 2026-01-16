package com.wellnest.app.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CommentResponse {
    private Long id;
    private String text;
    private String user;
    private String date;
    private Long userId;

    public CommentResponse() {
    }

    public CommentResponse(Long id, String text, String userName, LocalDateTime createdAt, Long userId) {
        this.id = id;
        this.text = text;
        this.user = userName;
        this.date = createdAt != null ? createdAt.toLocalDate().toString() : null;
        this.userId = userId;
    }
}
