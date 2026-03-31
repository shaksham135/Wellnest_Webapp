package com.wellnest.app.repository;

import com.wellnest.app.model.MentalState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface MentalStateRepository extends JpaRepository<MentalState, Long> {
    List<MentalState> findByUserIdOrderByPerformedAtDesc(Long userId);
    List<MentalState> findByUserIdAndPerformedAtBetween(Long userId, Instant start, Instant end);
}
