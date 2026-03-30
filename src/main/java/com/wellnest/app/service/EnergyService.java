package com.wellnest.app.service;

import com.wellnest.app.dto.EnergyForecast;
import org.springframework.security.core.Authentication;

public interface EnergyService {
    EnergyForecast getEnergyForecast(Authentication authentication);
}
