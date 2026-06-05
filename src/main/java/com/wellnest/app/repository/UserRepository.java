package com.wellnest.app.repository;

import com.wellnest.app.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User , Long> {
    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);

    Optional<User> findByResetToken(String resetToken);

    @org.springframework.data.jpa.repository.Query("SELECT u.id FROM User u WHERE u.role != 'ROLE_ADMIN' OR u.role IS NULL")
    java.util.List<Long> findNonAdminIds();

    @org.springframework.data.jpa.repository.Query("SELECT u.id FROM User u WHERE u.role = 'ROLE_ADMIN'")
    java.util.List<Long> findAdminIds();

    java.util.List<User> findByIsPremiumTrue();

    java.util.List<User> findByRole(String role);
}
