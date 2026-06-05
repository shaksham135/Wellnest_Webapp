package com.wellnest.app.repository;

import com.wellnest.app.model.UserActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface UserActivityLogRepository extends JpaRepository<UserActivityLog, Long> {
    boolean existsByUserIdAndActiveDate(Long userId, LocalDate activeDate);
    long countByActiveDate(LocalDate activeDate);
    List<UserActivityLog> findByUserId(Long userId);
}
