package com.wellnest.app.repository;

import com.wellnest.app.model.DailyBriefing;
import com.wellnest.app.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface DailyBriefingRepository extends JpaRepository<DailyBriefing, Long> {
    Optional<DailyBriefing> findByUserAndDate(User user, LocalDate date);
    void deleteByUser(User user);
}
