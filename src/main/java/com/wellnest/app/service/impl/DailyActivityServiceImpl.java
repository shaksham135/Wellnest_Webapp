package com.wellnest.app.service.impl;

import com.wellnest.app.dto.DailyActivityDto;
import com.wellnest.app.model.DailyActivity;
import com.wellnest.app.model.User;
import com.wellnest.app.repository.DailyActivityRepository;
import com.wellnest.app.service.DailyActivityService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class DailyActivityServiceImpl implements DailyActivityService {

    private final DailyActivityRepository dailyActivityRepository;

    public DailyActivityServiceImpl(DailyActivityRepository dailyActivityRepository) {
        this.dailyActivityRepository = dailyActivityRepository;
    }

    @Override
    @Transactional
    public void syncActivity(User user, DailyActivityDto dto) {
        // Trust the local date from the user's phone if provided
        LocalDate targetDate = (dto.getDate() != null) ? dto.getDate() : LocalDate.now();
        
        DailyActivity activity = dailyActivityRepository.findByUserIdAndDate(user.getId(), targetDate)
                .orElse(new DailyActivity(user, targetDate, 0, 0, 0.0));

        // Use the sync values from mobile (these are cumulative for the day usually)
        if (dto.getSteps() != null) activity.setSteps(dto.getSteps());
        if (dto.getActiveCalories() != null) activity.setActiveCalories(dto.getActiveCalories());
        if (dto.getDistanceKm() != null) activity.setDistanceKm(dto.getDistanceKm());

        dailyActivityRepository.save(activity);
    }
}
