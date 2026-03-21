package com.wellnest.app.service;

import com.wellnest.app.dto.DailyActivityDto;
import com.wellnest.app.model.User;

public interface DailyActivityService {
    void syncActivity(User user, DailyActivityDto dto);
}
