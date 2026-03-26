package com.wellnest.app.repository;

import com.wellnest.app.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUser_IdOrderByCreatedAtDesc(Long userId);
    
    boolean existsByUser_IdAndTitleAndCreatedAtAfter(Long userId, String title, java.time.LocalDateTime createdAt);
    boolean existsByUser_IdAndTypeAndCreatedAtAfter(Long userId, String type, java.time.Instant createdAt);

    long countByUser_IdAndIsReadFalse(Long userId);

    void deleteByUser_Id(Long userId);
}
