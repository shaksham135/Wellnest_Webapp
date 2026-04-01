package com.wellnest.app.model;

import jakarta.persistence.*;

@Entity
@Table(name = "system_settings")
public class SystemSettings {
    @Id
    private Long id = 1L; // Singleton pattern for configuration

    @Column(name = "ai_enabled", nullable = false)
    private boolean aiEnabled = true;

    @Column(name = "total_tokens_used", nullable = false)
    private long totalTokensUsed = 0;

    public SystemSettings() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public boolean isAiEnabled() {
        return aiEnabled;
    }

    public void setAiEnabled(boolean aiEnabled) {
        this.aiEnabled = aiEnabled;
    }

    public long getTotalTokensUsed() {
        return totalTokensUsed;
    }

    public void setTotalTokensUsed(long totalTokensUsed) {
        this.totalTokensUsed = totalTokensUsed;
    }
}
