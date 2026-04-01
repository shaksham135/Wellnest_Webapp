import apiClient from './apiClient';

export const getAllUsers = async () => {
    return await apiClient.get('/admin/users');
};

export const deleteUser = async (id) => {
    return await apiClient.delete(`/admin/users/${id}`);
};

export const toggleUserVerification = async (id) => {
    return await apiClient.put(`/admin/users/${id}/verify`);
};

export const toggleUserPremium = async (id) => {
    return await apiClient.put(`/admin/users/${id}/premium`);
};

export const toggleUserSuspension = async (id) => {
    return await apiClient.put(`/admin/users/${id}/suspend`);
};

export const getAllTrainers = async () => {
    return await apiClient.get('/admin/trainers');
};

export const deleteTrainer = async (id) => {
    return await apiClient.delete(`/admin/trainers/${id}`);
};

export const getPendingVerifications = async () => {
    return await apiClient.get('/admin/trainers/pending-verifications');
};

export const verifyTrainer = async (id) => {
    return await apiClient.put(`/admin/trainers/${id}/verify`);
};

export const rejectTrainerVerification = async (id) => {
    return await apiClient.put(`/admin/trainers/${id}/reject`);
};

export const broadcastNotification = async (title, message, type = 'INFO') => {
    return await apiClient.post('/admin/notifications/broadcast', { title, message, type });
};

export const getSystemMetrics = async () => {
    return await apiClient.get('/admin/metrics');
};

export const toggleGlobalAi = async (enabled) => {
    return await apiClient.put(`/admin/settings/ai?enabled=${enabled}`);
};
