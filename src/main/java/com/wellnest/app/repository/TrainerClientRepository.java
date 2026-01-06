package com.wellnest.app.repository;

import com.wellnest.app.model.TrainerClient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrainerClientRepository extends JpaRepository<TrainerClient, Long> {
    List<TrainerClient> findByTrainerId(Long trainerId);

    List<TrainerClient> findByClientId(Long clientId);

    Optional<TrainerClient> findByTrainerIdAndClientId(Long trainerId, Long clientId);
}
