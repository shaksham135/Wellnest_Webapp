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
        User user = userEmail != null ? userRepository.findByEmail(userEmail).orElse(null) : null;
        
        if (category != null && category.equalsIgnoreCase("Trending")) {
            return blogPostRepository.findAll()
                .stream()
                .map(post -> toResponse(post, user))
                .sorted((a, b) -> {
                    int scoreA = (a.getLikes() * 2) + a.getComments().size();
                    int scoreB = (b.getLikes() * 2) + b.getComments().size();
                    return scoreB - scoreA;
                })
                .collect(Collectors.toList());
        }

        if (category == null || category.equalsIgnoreCase("All")) {
            return getAllPosts(userEmail);
        }
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
        System.out.println("Creating post for user: " + userEmail);
        User user = userRepository.findByEmail(userEmail).orElse(null);

        if (user == null) {
            throw new RuntimeException("User must be logged in.");
        }

        // Logic check: Articles vs Community Posts
        // Logic check: Articles vs Community Posts
        if (dto.isCommunity()) {
            // Community Post: strictly for Users
            // Req: "this option should not be able for trainer and admin"
            String userRole = user.getRole();
            if ("ROLE_ADMIN".equals(userRole) || "ROLE_TRAINER".equals(userRole)) {
                throw new RuntimeException(
                        "Admins and Trainers serve as moderators and cannot create community posts.");
            }

        } else {
            // Article: Strict Validation
            String userRole = user.getRole();
            boolean isExpert = "ROLE_ADMIN".equals(userRole) || "ROLE_TRAINER".equals(userRole) || user.isVerified();

            if (!isExpert) {
                throw new RuntimeException("Only Admins, Trainers, and Verified Users can publish articles.");
            }
        }

        BlogPost post = new BlogPost();
        post.setTitle(dto.getTitle());
        post.setExcerpt(dto.getExcerpt());
        post.setContent(dto.getContent());
        post.setCategory(dto.getCategory());
        post.setImage(dto.getImage());
        post.setLikes(0);

        post.setUser(user);

        // Set Author Name
        if ("ROLE_ADMIN".equals(user.getRole())) {
            post.setAuthor("Admin");
        } else {
            post.setAuthor(user.getName() != null && !user.getName().isEmpty() ? user.getName() : "Anonymous");
        }

        // Set role based on logic
        if (dto.isCommunity()) {
            post.setRole("User"); // Forces it to appear in Community Feed
        } else {
            // Article Roles
            String userRole = user.getRole();
            if ("ROLE_TRAINER".equals(userRole)) {
                post.setRole("Trainer");
            } else if ("ROLE_ADMIN".equals(userRole)) {
                post.setRole("Admin");
            } else if (user.isVerified()) {
                post.setRole("Verified User");
            } else {
                post.setRole("User"); // Should not happen due to check above, but fallback
            }
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

    @org.springframework.beans.factory.annotation.Value("${admin.username:admin123@gmail.com}")
    private String adminUsername;

    @Transactional
    public void deletePost(Long id, String userEmail) {
        BlogPost post = blogPostRepository.findById(id).orElseThrow(() -> new RuntimeException("Post not found"));

        // Super Admin Bypass (from properties)
        if (userEmail != null && userEmail.equals(adminUsername)) {
            System.out.println("Super Admin deleting post: " + id);
            // Allow delete
            // Clear likes to prevent Foreign Key constraint violations
            post.getLikedBy().clear();
            blogPostRepository.saveAndFlush(post); // Apply clearing of join table
            blogCommentRepository.deleteByPostId(id);
            blogPostRepository.delete(post);
            return;
        }

        User user = userRepository.findByEmail(userEmail).orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user is Admin (loose check for "ADMIN" in role)
        String userRole = user.getRole();
        boolean isAdmin = userRole != null && userRole.toUpperCase().contains("ADMIN");

        System.out.println("Delete Post Request: PostID=" + id + ", User=" + user.getEmail() + ", Role=" + userRole
                + ", Admin=" + isAdmin);

        // Ownership check: If not owner and not admin, deny
        if (post.getUser() == null || !post.getUser().getId().equals(user.getId())) {
            if (!isAdmin) {
                System.out.println("Permission denied: Not Owner and Not Admin");
                throw new RuntimeException("Permission denied: Not Owner and Not Admin");
            }
        }

        // Clear likes to prevent Foreign Key constraint violations
        post.getLikedBy().clear();
        blogPostRepository.saveAndFlush(post); // Apply clearing of join table

        blogCommentRepository.deleteByPostId(id);
        blogPostRepository.delete(post);
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

        // Super Admin Bypass (from properties)
        if (userEmail != null && userEmail.equals(adminUsername)) {
            blogCommentRepository.deleteById(commentId);
            return;
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String userRole = user.getRole();
        boolean isAdmin = userRole != null && userRole.toUpperCase().contains("ADMIN");

        boolean isCommentOwner = comment.getUser() != null && comment.getUser().getId().equals(user.getId());

        // Check post ownership (handle null user for default posts)
        boolean isPostOwner = comment.getPost().getUser() != null
                && comment.getPost().getUser().getId().equals(user.getId());

        if (!isCommentOwner && !isPostOwner && !isAdmin) {
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
            response.setIsAuthorPremium(post.getUser().isPremium());
            response.setIsAuthorVerified(post.getUser().isVerified());
        }

        if (currentUser != null) {
            response.setIsLiked(post.getLikedBy().contains(currentUser));
        } else {
            response.setIsLiked(false);
        }

        response.setComments(getComments(post.getId()));
        return response;
    }

    @Transactional
    public void cleanupUserContent(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();

        // 1. Remove Likes from all posts
        List<BlogPost> likedPosts = blogPostRepository.findByLikedByContaining(user);
        for (BlogPost p : likedPosts) {
            p.getLikedBy().remove(user);
            p.setLikes(p.getLikedBy().size());
            blogPostRepository.save(p);
        }

        // 2. Delete Comments by User
        blogCommentRepository.deleteByUserId(userId);

        // 3. Delete Posts by User
        List<BlogPost> userPosts = blogPostRepository.findByUserIdOrderByCreatedAtDesc(userId);
        for (BlogPost post : userPosts) {
            // Clear likes on THIS post
            post.getLikedBy().clear();
            blogPostRepository.saveAndFlush(post);

            // Delete comments on THIS post
            blogCommentRepository.deleteByPostId(post.getId());

            // Delete post
            blogPostRepository.delete(post);
        }
    }
}
