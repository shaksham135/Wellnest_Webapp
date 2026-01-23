package com.wellnest.app.dto;

import lombok.Data;

@Data
public class LeaderboardEntry {
    private String userName;
    private Double score; // e.g. total minutes or calories
    private int rank;

    public LeaderboardEntry(String userName, Double score) {
        this.userName = userName;
        this.score = score;
    }
}
