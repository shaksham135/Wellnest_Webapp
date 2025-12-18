package com.wellnest.app.repository;

import com.wellnest.app.model.SleepLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface SleepLogRepository extends JpaRepository<SleepLog, Long> {
        List<SleepLog> findByUserIdOrderBySleepDateDesc(Long userId);

    List<SleepLog> findByUserIdAndSleepDateBetween(Long userId, LocalDate startDate, LocalDate endDate);
}
