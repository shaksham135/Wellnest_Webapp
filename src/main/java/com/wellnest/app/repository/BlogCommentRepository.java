package com.wellnest.app.repository;

import com.wellnest.app.model.BlogComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlogCommentRepository extends JpaRepository<BlogComment, Long> {

    List<BlogComment> findByPostIdOrderByCreatedAtAsc(Long postId);

    void deleteByPostId(Long postId);

    void deleteByUserId(Long userId);
}
