package com.wellnest.app.service;

import com.wellnest.app.model.MentalState;
import com.wellnest.app.model.User;
import org.springframework.web.multipart.MultipartFile;
import java.util.Optional;
import java.util.Map;

public interface MentalFitnessService {
    MentalState saveMentalState(User user, int focus, int stress, int mood, String transcription);
    int getDailyReadiness(User user);
    MentalState processVoiceScan(User user, MultipartFile audio);
    Optional<MentalState> getLatestMentalState(User user);
    Map<String, Boolean> getReadinessFactors(User user);
    String getDataQuality(User user);

    // Deprecated legacy method name, to be removed in a future release
    default int getCognitiveReserve(User user) {
        return getDailyReadiness(user);
    }
}
