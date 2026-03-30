import apiClient from './apiClient';

export const getDailyBriefing = async (date) => {
  return await apiClient.get('/assistant/briefing', { params: { date } });
};
