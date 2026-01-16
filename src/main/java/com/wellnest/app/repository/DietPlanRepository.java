package com.wellnest.app.repository;

import com.wellnest.app.model.DietPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DietPlanRepository extends JpaRepository<DietPlan, Long> {
    Optional<DietPlan> findByTrainerIdAndUserId(Long trainerId, Long userId);
}
