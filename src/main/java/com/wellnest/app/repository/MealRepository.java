package com.wellnest.app.repository;

import com.wellnest.app.model.Meal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface MealRepository extends JpaRepository<Meal, Long> {
        List<Meal> findByUserIdOrderByLoggedAtDesc(Long userId);

    List<Meal> findByUserIdAndLoggedAtBetween(Long userId, LocalDateTime startDateTime, LocalDateTime endDateTime);
}
