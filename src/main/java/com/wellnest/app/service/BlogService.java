package com.wellnest.app.service;

import com.wellnest.app.dto.BlogPostDto;
import com.wellnest.app.dto.BlogPostResponse;
import com.wellnest.app.dto.CommentDto;
import com.wellnest.app.dto.CommentResponse;
import com.wellnest.app.model.BlogComment;
import com.wellnest.app.model.BlogPost;
import com.wellnest.app.model.User;
import com.wellnest.app.repository.BlogCommentRepository;
import com.wellnest.app.repository.BlogPostRepository;
import com.wellnest.app.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class BlogService {

    private final BlogPostRepository blogPostRepository;
    private final BlogCommentRepository blogCommentRepository;
    private final UserRepository userRepository;

    public BlogService(BlogPostRepository blogPostRepository,
            BlogCommentRepository blogCommentRepository,
            UserRepository userRepository) {
        this.blogPostRepository = blogPostRepository;
        this.blogCommentRepository = blogCommentRepository;
        this.userRepository = userRepository;
    }

    // Initialize default blog posts if database is empty
    @PostConstruct
    @Transactional
    public void initializeDefaultPosts() {
        if (blogPostRepository.count() == 0) {
            BlogPost post1 = new BlogPost(
                    "Top 10 Superfoods for a Healthy Heart",
                    "Discover the power of berries, nuts, and leafy greens in maintaining cardiovascular health.",
                    "Cardiovascular health is crucial for a long life. Incorporating superfoods like blueberries, kale, and almonds can significantly reduce the risk of heart disease...",
                    "Dr. Sarah Smith",
                    "Admin",
                    "Nutrition",
                    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2053&auto=format&fit=crop");
            post1.setLikes(124);

            BlogPost post2 = new BlogPost(
                    "5-Minute Morning Yoga Routine",
                    "Start your day with energy and focus using these simple yoga poses.",
                    "Yoga is not just about flexibility; it is about mindfulness. These 5 poses will help you wake up your body and mind...",
                    "Mike Ross",
                    "Trainer",
                    "Fitness",
                    "https://images.unsplash.com/photo-1544367563-121955377568?q=80&w=2000&auto=format&fit=crop");
            post2.setLikes(89);

            BlogPost post3 = new BlogPost(
                    "The Importance of Mental Breaks",
                    "Why taking time off is essential for productivity and mental well-being.",
                    "Burnout is real. In this fast-paced world, taking mental breaks is not a luxury, it is a necessity...",
                    "Emily Blunt",
                    "Verified User",
                    "Mental Wellness",
                    "https://images.unsplash.com/photo-1493612276216-9c59019558f7?q=80&w=2000&auto=format&fit=crop");
            post3.setLikes(215);

            blogPostRepository.save(post1);
            blogPostRepository.save(post2);
            blogPostRepository.save(post3);
        }
    }

    public List<BlogPostResponse> getAllPosts(String userEmail) {
        User user = userEmail != null ? userRepository.findByEmail(userEmail).orElse(null) : null;
        return blogPostRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(post -> toResponse(post, user))
                .collect(Collectors.toList());
    }

    public List<BlogPostResponse> getPostsByCategory(String category, String userEmail) {
        if (category == null || category.equalsIgnoreCase("All")) {
            return getAllPosts(userEmail);
        }
        User user = userEmail != null ? userRepository.findByEmail(userEmail).orElse(null) : null;
        return blogPostRepository.findByCategoryOrderByCreatedAtDesc(category)
                .stream()
                .map(post -> toResponse(post, user))
                .collect(Collectors.toList());
    }

    public Optional<BlogPostResponse> getPostById(Long id, String userEmail) {
        User user = userEmail != null ? userRepository.findByEmail(userEmail).orElse(null) : null;
        return blogPostRepository.findById(id).map(post -> toResponse(post, user));
    }

    @Transactional
    public BlogPostResponse createPost(BlogPostDto dto, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElse(null);

        BlogPost post = new BlogPost();
        post.setTitle(dto.getTitle());
        post.setExcerpt(dto.getExcerpt());
        post.setContent(dto.getContent());
        post.setCategory(dto.getCategory());
        post.setImage(dto.getImage());
        post.setLikes(0);

        if (user != null) {
            post.setUser(user);
            // Prioritize user's actual name from DB over DTO placeholder
            post.setAuthor(user.getName() != null && !user.getName().isEmpty() ? user.getName() : dto.getAuthor());

            // Set role based on user role
            String userRole = user.getRole();
            if ("ROLE_TRAINER".equals(userRole)) {
                post.setRole("Trainer");
            } else if ("ROLE_ADMIN".equals(userRole)) {
                post.setRole("Admin");
            } else {
                post.setRole("User");
            }
        } else {
            post.setAuthor(dto.getAuthor() != null ? dto.getAuthor() : "Anonymous");
            post.setRole("User");
        }

        BlogPost saved = blogPostRepository.save(post);
        return toResponse(saved, user);
    }

    @Transactional
    public Optional<BlogPostResponse> updatePost(Long id, BlogPostDto dto) {
        return blogPostRepository.findById(id).map(post -> {
            if (dto.getTitle() != null)
                post.setTitle(dto.getTitle());
            if (dto.getExcerpt() != null)
                post.setExcerpt(dto.getExcerpt());
            if (dto.getContent() != null)
                post.setContent(dto.getContent());
            if (dto.getCategory() != null)
                post.setCategory(dto.getCategory());
            if (dto.getImage() != null)
                post.setImage(dto.getImage());
            return toResponse(blogPostRepository.save(post), null);
        });
    }

    @Transactional
    public void deletePost(Long id, String userEmail) {
        BlogPost post = blogPostRepository.findById(id).orElseThrow(() -> new RuntimeException("Post not found"));
        User user = userRepository.findByEmail(userEmail).orElseThrow(() -> new RuntimeException("User not found"));

        // Ownership check
        if (post.getUser() == null || !post.getUser().getId().equals(user.getId())) {
            if (!"ROLE_ADMIN".equals(user.getRole())) {
                throw new RuntimeException("Permission denied");
            }
        }

        blogCommentRepository.deleteByPostId(id);
        blogPostRepository.deleteById(id);
    }

    @Transactional
    public Optional<BlogPostResponse> toggleLike(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow(() -> new RuntimeException("User not found"));

        return blogPostRepository.findById(id).map(post -> {
            if (post.getLikedBy().contains(user)) {
                post.getLikedBy().remove(user);
            } else {
                post.getLikedBy().add(user);
            }
            post.setLikes(post.getLikedBy().size());
            return toResponse(blogPostRepository.save(post), user);
        });
    }

    @Transactional
    public void deleteComment(Long commentId, String userEmail) {
        BlogComment comment = blogCommentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isCommentOwner = comment.getUser() != null && comment.getUser().getId().equals(user.getId());
        boolean isPostOwner = comment.getPost().getUser() != null
                && comment.getPost().getUser().getId().equals(user.getId());

        if (!isCommentOwner && !isPostOwner && !"ROLE_ADMIN".equals(user.getRole())) {
            throw new RuntimeException("Permission denied");
        }

        blogCommentRepository.deleteById(commentId);
    }

    @Transactional
    public List<CommentResponse> addComment(Long postId, CommentDto dto, String userEmail) {
        BlogPost post = blogPostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        User user = userRepository.findByEmail(userEmail).orElse(null);

        BlogComment comment = new BlogComment();
        comment.setText(dto.getText());
        comment.setPost(post);

        if (user != null) {
            comment.setUser(user);
            // Prioritize user's actual name from DB
            comment.setUserName(
                    user.getName() != null && !user.getName().isEmpty() ? user.getName() : dto.getUserName());
        } else {
            comment.setUserName(dto.getUserName() != null ? dto.getUserName() : "Anonymous");
        }

        blogCommentRepository.save(comment);

        return getComments(postId);
    }

    public List<CommentResponse> getComments(Long postId) {
        return blogCommentRepository.findByPostIdOrderByCreatedAtAsc(postId)
                .stream()
                .map(c -> new CommentResponse(c.getId(), c.getText(), c.getUserName(), c.getCreatedAt(),
                        c.getUser() != null ? c.getUser().getId() : null))
                .collect(Collectors.toList());
    }

    private BlogPostResponse toResponse(BlogPost post, User currentUser) {
        BlogPostResponse response = new BlogPostResponse(
                post.getId(),
                post.getTitle(),
                post.getExcerpt(),
                post.getContent(),
                post.getAuthor(),
                post.getRole(),
                post.getCategory(),
                post.getImage(),
                post.getLikes(),
                post.getCreatedAt());

        if (post.getUser() != null) {
            response.setAuthorId(post.getUser().getId());
        }

        if (currentUser != null) {
            response.setIsLiked(post.getLikedBy().contains(currentUser));
        } else {
            response.setIsLiked(false);
        }

        response.setComments(getComments(post.getId()));
        return response;
    }
}
