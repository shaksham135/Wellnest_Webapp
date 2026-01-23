package com.wellnest.app.dto;

import lombok.Data;
import java.util.List;

@Data
public class LeaderboardResponse {
    private List<LeaderboardEntry> topUsers;
    private LeaderboardEntry currentUserEntry;

    public LeaderboardResponse(List<LeaderboardEntry> topUsers, LeaderboardEntry currentUserEntry) {
        this.topUsers = topUsers;
        this.currentUserEntry = currentUserEntry;
    }
}
