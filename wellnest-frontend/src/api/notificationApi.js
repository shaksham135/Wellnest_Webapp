import apiClient from './apiClient';

export const getNotifications = async () => {
    const response = await apiClient.get('/notifications');
    return response.data;
};

export const markAsRead = async (id) => {
    await apiClient.put(`/notifications/${id}/read`);
};

export const markAllAsRead = async () => {
    await apiClient.put('/notifications/read-all');
};
