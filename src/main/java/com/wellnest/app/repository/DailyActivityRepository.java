package com.wellnest.app.repository;

import com.wellnest.app.model.DailyActivity;
import com.wellnest.app.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyActivityRepository extends JpaRepository<DailyActivity, Long> {
    Optional<DailyActivity> findByUserIdAndDate(Long userId, LocalDate date);
    List<DailyActivity> findByUserId(Long userId);
    
    // For Reports (Ascending)
    List<DailyActivity> findByUserIdAndDateBetweenOrderByDateAsc(Long userId, LocalDate startDate, LocalDate endDate);
    List<DailyActivity> findByUserAndDateBetweenOrderByDateAsc(User user, LocalDate startDate, LocalDate endDate);

    // For Trackers (Descending)
    List<DailyActivity> findByUserIdAndDateBetweenOrderByDateDesc(Long userId, LocalDate startDate, LocalDate endDate);
    List<DailyActivity> findByUserAndDateBetweenOrderByDateDesc(User user, LocalDate startDate, LocalDate endDate);
}
