package com.wellnest.app.service;

import com.wellnest.app.model.Notification;
import com.wellnest.app.model.User;
import com.wellnest.app.repository.NotificationRepository;
import com.wellnest.app.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public void createNotification(Long userId, String title, String message, String type) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Notification notification = new Notification(user, title, message, type);
        notificationRepository.save(notification);
    }

    public List<Notification> getUserNotifications(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return notificationRepository.findByUser_IdOrderByCreatedAtDesc(user.getId());
    }

    public void markAsRead(Long notificationId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        n.setRead(true);
        notificationRepository.save(n);
    }

    public void markAllAsRead(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Notification> list = notificationRepository.findByUser_IdOrderByCreatedAtDesc(user.getId());
        list.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(list);
    }
}
