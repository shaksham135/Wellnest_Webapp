package com.wellnest.app.repository;

import com.wellnest.app.model.BlogPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlogPostRepository extends JpaRepository<BlogPost, Long> {

    List<BlogPost> findAllByOrderByCreatedAtDesc();

    List<BlogPost> findByCategoryOrderByCreatedAtDesc(String category);

    List<BlogPost> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<BlogPost> findByAuthorContainingIgnoreCaseOrderByCreatedAtDesc(String author);

    List<BlogPost> findByLikedByContaining(com.wellnest.app.model.User user);
}
