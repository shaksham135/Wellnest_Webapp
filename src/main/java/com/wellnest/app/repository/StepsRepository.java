package com.wellnest.app.repository;

import com.wellnest.app.model.Steps;
import com.wellnest.app.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StepsRepository extends JpaRepository<Steps, Long> {
    
    List<Steps> findByUserOrderByCreatedAtDesc(User user);
    
    @Query("SELECT s FROM Steps s WHERE s.user = :user AND s.createdAt >= :startDate ORDER BY s.createdAt DESC")
    List<Steps> findByUserAndCreatedAtAfterOrderByCreatedAtDesc(
        @Param("user") User user, 
        @Param("startDate") LocalDateTime startDate
    );
    
    @Query("SELECT SUM(s.count) FROM Steps s WHERE s.user = :user AND s.createdAt >= :startDate")
    Long getTotalStepsByUserAndDateRange(
        @Param("user") User user, 
        @Param("startDate") LocalDateTime startDate
    );
    
    @Query("SELECT AVG(s.count) FROM Steps s WHERE s.user = :user AND s.createdAt >= :startDate")
    Double getAverageStepsByUserAndDateRange(
        @Param("user") User user, 
        @Param("startDate") LocalDateTime startDate
    );
}