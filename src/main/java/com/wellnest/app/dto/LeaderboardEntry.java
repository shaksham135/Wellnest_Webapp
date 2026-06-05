package com.wellnest.app.dto;

import lombok.Data;

@Data
public class LeaderboardEntry {
    private String userName;
    private Double score; // e.g. total minutes or calories
    private int rank;
    private int level;
    private String league;
    private boolean hasPremiumBadge;

    public LeaderboardEntry(String userName, Double score) {
        this.userName = userName;
        this.score = score;
    }
}
