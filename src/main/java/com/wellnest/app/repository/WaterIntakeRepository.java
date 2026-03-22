package com.wellnest.app.repository;

import com.wellnest.app.model.WaterIntake;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

public interface WaterIntakeRepository extends JpaRepository<WaterIntake, Long> {

    List<WaterIntake> findByUserIdOrderByLoggedAtDesc(Long userId);

    List<WaterIntake> findByUserIdAndLoggedAtBetween(Long userId, Instant start, Instant end);

    List<WaterIntake> findByLoggedAtBetween(Instant start, Instant end);

    void deleteByUserId(Long userId);
}
