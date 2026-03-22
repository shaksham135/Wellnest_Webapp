package com.wellnest.app.repository;

import com.wellnest.app.model.SleepLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;

public interface SleepLogRepository extends JpaRepository<SleepLog, Long> {
    List<SleepLog> findByUserIdOrderBySleepDateDesc(Long userId);

    List<SleepLog> findByUserIdAndSleepDateBetween(Long userId, Instant start, Instant end);

    List<SleepLog> findBySleepDateBetween(Instant start, Instant end);

    void deleteByUserId(Long userId);
}
