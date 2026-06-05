package com.wellnest.app.repository;

import com.wellnest.app.model.BetaRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BetaRequestRepository extends JpaRepository<BetaRequest, Long> {
    List<BetaRequest> findByStatusOrderByCreatedAtDesc(String status);
    List<BetaRequest> findAllByOrderByCreatedAtDesc();
    Optional<BetaRequest> findByUserIdAndStatus(Long userId, String status);
    boolean existsByUserIdAndStatus(Long userId, String status);
    long countByStatus(String status);
}
