package com.wellnest.app.repository;

import com.wellnest.app.model.DailyActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyActivityRepository extends JpaRepository<DailyActivity, Long> {
    Optional<DailyActivity> findByUserIdAndDate(Long userId, LocalDate date);
    List<DailyActivity> findByUserIdAndDateBetweenOrderByDateAsc(Long userId, LocalDate startDate, LocalDate endDate);
}
