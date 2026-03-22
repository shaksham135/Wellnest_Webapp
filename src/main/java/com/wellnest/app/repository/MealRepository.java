package com.wellnest.app.repository;

import com.wellnest.app.model.Meal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;

public interface MealRepository extends JpaRepository<Meal, Long> {
    List<Meal> findByUserIdOrderByLoggedAtDesc(Long userId);

    List<Meal> findByUserIdAndLoggedAtBetween(Long userId, Instant start, Instant end);

    List<Meal> findByLoggedAtBetween(Instant start, Instant end);

    void deleteByUserId(Long userId);
}
