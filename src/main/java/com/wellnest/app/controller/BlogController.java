package com.wellnest.app.controller;

import com.wellnest.app.dto.BlogPostDto;
import com.wellnest.app.dto.BlogPostResponse;
import com.wellnest.app.dto.CommentDto;
import com.wellnest.app.dto.CommentResponse;
import com.wellnest.app.service.BlogService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/blog")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true", methods = { RequestMethod.GET,
        RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS })
public class BlogController {

    private final BlogService blogService;

    public BlogController(BlogService blogService) {
        this.blogService = blogService;
    }

    // GET /api/blog/posts - Get all blog posts (optionally filtered by category)
    @GetMapping("/posts")
    public ResponseEntity<List<BlogPostResponse>> getPosts(
            @RequestParam(required = false) String category, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        List<BlogPostResponse> posts = blogService.getPostsByCategory(category, email);
        return ResponseEntity.ok(posts);
    }

    // GET /api/blog/posts/{id} - Get a single blog post by ID
    @GetMapping("/posts/{id}")
    public ResponseEntity<BlogPostResponse> getPostById(@PathVariable Long id, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        return blogService.getPostById(id, email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/blog/posts - Create a new blog post (requires authentication)
    @PostMapping("/posts")
    public ResponseEntity<BlogPostResponse> createPost(
            @RequestBody BlogPostDto dto,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        BlogPostResponse created = blogService.createPost(dto, email);
        return ResponseEntity.ok(created);
    }

    // PUT /api/blog/posts/{id} - Update a blog post
    @PutMapping("/posts/{id}")
    public ResponseEntity<BlogPostResponse> updatePost(
            @PathVariable Long id,
            @RequestBody BlogPostDto dto) {
        return blogService.updatePost(id, dto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE /api/blog/posts/{id} - Delete a blog post
    @DeleteMapping("/posts/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        try {
            blogService.deletePost(id, email);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).build();
        }
    }

    // POST /api/blog/posts/{id}/like - Toggle like on a post
    @PostMapping("/posts/{id}/like")
    public ResponseEntity<BlogPostResponse> toggleLike(@PathVariable Long id, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        if (email == null)
            return ResponseEntity.status(401).build();
        return blogService.toggleLike(id, email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // GET /api/blog/posts/{id}/comments - Get comments for a post
    @GetMapping("/posts/{id}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long id) {
        List<CommentResponse> comments = blogService.getComments(id);
        return ResponseEntity.ok(comments);
    }

    // POST /api/blog/posts/{id}/comments - Add a comment to a post
    @PostMapping("/posts/{id}/comments")
    public ResponseEntity<List<CommentResponse>> addComment(
            @PathVariable Long id,
            @RequestBody CommentDto dto,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        List<CommentResponse> comments = blogService.addComment(id, dto, email);
        return ResponseEntity.ok(comments);
    }

    // DELETE /api/blog/comments/{id} - Delete a comment
    @DeleteMapping("/comments/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        if (email == null)
            return ResponseEntity.status(401).build();
        try {
            blogService.deleteComment(id, email);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).build();
        }
    }
}
