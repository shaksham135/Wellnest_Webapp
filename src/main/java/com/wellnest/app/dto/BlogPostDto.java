package com.wellnest.app.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BlogPostDto {
    private String title;
    private String excerpt;
    private String content;
    private String author;
    private String category;
    private String image;
    private boolean isCommunity = false;

    public BlogPostDto() {
    }

    public BlogPostDto(String title, String excerpt, String content, String author, String category, String image) {
        this.title = title;
        this.excerpt = excerpt;
        this.content = content;
        this.author = author;
        this.category = category;
        this.image = image;
    }
}
