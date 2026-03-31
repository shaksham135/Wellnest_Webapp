package com.wellnest.app.service;

import com.wellnest.app.model.MentalState;
import com.wellnest.app.model.User;
import java.util.Optional;

public interface MentalFitnessService {
    MentalState saveMentalState(User user, int focus, int stress, int mood, String transcription);
    int getCognitiveReserve(User user);
    MentalState processVoiceScan(User user, String voiceBase64);
    Optional<MentalState> getLatestMentalState(User user);
}
