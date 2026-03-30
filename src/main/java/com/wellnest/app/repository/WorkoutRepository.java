package com.wellnest.app.repository;

import com.wellnest.app.model.Workout;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface WorkoutRepository extends JpaRepository<Workout, Long> {
        List<Workout> findByUserIdOrderByPerformedAtDesc(Long userId);

        List<Workout> findByUserIdAndPerformedAtBetween(Long userId, Instant start,
                        Instant end);

        List<Workout> findByPerformedAtBetween(Instant start, Instant end);

        @org.springframework.data.jpa.repository.Query(value = "SELECT w.user_id, SUM(w.duration_minutes) as totalMinutes FROM workouts w WHERE w.performed_at BETWEEN :start AND :end GROUP BY w.user_id ORDER BY totalMinutes DESC LIMIT 10", nativeQuery = true)
        List<Object[]> findTopUsersByDuration(
                        @org.springframework.data.repository.query.Param("start") java.time.Instant start,
                        @org.springframework.data.repository.query.Param("end") java.time.Instant end);

        void deleteByUserId(Long userId);
}
