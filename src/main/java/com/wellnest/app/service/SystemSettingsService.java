package com.wellnest.app.service;

import com.wellnest.app.model.SystemSettings;
import com.wellnest.app.repository.SystemSettingsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class SystemSettingsService {
    private final SystemSettingsRepository repository;
    private static final Logger logger = LoggerFactory.getLogger(SystemSettingsService.class);

    public SystemSettingsService(SystemSettingsRepository repository) {
        this.repository = repository;
    }

    public SystemSettings getSettings() {
        return repository.findById(1L).orElseGet(() -> {
            SystemSettings s = new SystemSettings();
            s.setId(1L);
            s.setAiEnabled(true);
            s.setTotalTokensUsed(0L);
            return repository.save(s);
        });
    }

    public boolean isAiEnabled() {
        return getSettings().isAiEnabled();
    }

    public void setAiEnabled(boolean enabled) {
        SystemSettings s = getSettings();
        if (s.isAiEnabled() != enabled) {
            s.setAiEnabled(enabled);
            repository.save(s);
            logger.warn("GLOBAL AI STATE CHANGED: " + (enabled ? "ENABLED" : "DISABLED"));
        }
    }

    public void addTokens(long tokens) {
        SystemSettings s = getSettings();
        s.setTotalTokensUsed(s.getTotalTokensUsed() + tokens);
        repository.save(s);
        logger.debug("Added " + tokens + " AI tokens to global tracker.");
    }
}
