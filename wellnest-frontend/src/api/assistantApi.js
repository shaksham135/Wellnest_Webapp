import apiClient from './apiClient';

export const getDailyBriefing = async (date) => {
  return await apiClient.get('/assistant/briefing', { params: { date } });
};

export const getEnergyForecast = async () => {
  return await apiClient.get('/analytics/energy-forecast');
};
