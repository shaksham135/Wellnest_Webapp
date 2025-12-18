package com.wellnest.app.repository;

import com.wellnest.app.model.WeightLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface WeightLogRepository extends JpaRepository<WeightLog, Long> {
    List<WeightLog> findByUserIdAndLogDateBetween(Long userId, LocalDate startDate, LocalDate endDate);
    List<WeightLog> findByUserIdOrderByLogDateAsc(Long userId);
}
