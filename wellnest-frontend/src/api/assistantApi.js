import apiClient from './apiClient';

export const getDailyBriefing = async () => {
  return await apiClient.get('/assistant/briefing');
};
