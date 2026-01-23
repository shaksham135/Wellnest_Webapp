import apiClient from "./apiClient";

export const getWeeklyLeaderboard = () => {
    return apiClient.get("/leaderboard/weekly");
};
