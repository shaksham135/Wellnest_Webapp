package com.wellnest.app.repository;

import com.wellnest.app.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUser_IdOrderByCreatedAtDesc(Long userId);

    long countByUser_IdAndIsReadFalse(Long userId);
}
