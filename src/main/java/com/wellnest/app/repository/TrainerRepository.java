package com.wellnest.app.repository;

import com.wellnest.app.model.Trainer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrainerRepository extends JpaRepository<Trainer, Long> {

    List<Trainer> findAllByOrderByRatingDesc();

    List<Trainer> findByLocation(String location);

    @Query("SELECT t FROM Trainer t WHERE t.location = :location OR t.location = 'Online'")
    List<Trainer> findByLocationOrOnline(@Param("location") String location);

    @Query("SELECT t FROM Trainer t JOIN t.specialties s WHERE LOWER(s) LIKE LOWER(CONCAT('%', :specialty, '%'))")
    List<Trainer> findBySpecialty(@Param("specialty") String specialty);

    @Query("SELECT DISTINCT t FROM Trainer t JOIN t.specialties s " +
            "WHERE (LOWER(s) LIKE LOWER(CONCAT('%', :goal, '%')) OR :goal = 'All') " +
            "AND (t.location = :location OR t.location = 'Online' OR :location = 'Any')")
    List<Trainer> findByGoalAndLocation(@Param("goal") String goal, @Param("location") String location);

    Optional<Trainer> findByUserId(Long userId);

    Optional<Trainer> findByEmail(String email);
}
