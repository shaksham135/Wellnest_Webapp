package com.wellnest.app.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class BlogPostResponse {
    private Long id;
    private String title;
    private String excerpt;
    private String content;
    private String author;
    private String role;
    private String category;
    private String image;
    private Integer likes;
    private Boolean isLiked = false;
    private Long authorId;
    private String date;
    private List<CommentResponse> comments = new ArrayList<>();

    public BlogPostResponse() {
    }

    public BlogPostResponse(Long id, String title, String excerpt, String content,
            String author, String role, String category, String image,
            Integer likes, LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.excerpt = excerpt;
        this.content = content;
        this.author = author;
        this.role = role;
        this.category = category;
        this.image = image;
        this.likes = likes;
        this.date = createdAt != null ? createdAt.toLocalDate().toString() : null;
    }
}
