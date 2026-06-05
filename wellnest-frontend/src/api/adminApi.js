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

export const getRetentionMetrics = async () => {
    return await apiClient.get('/admin/retention');
};

// ===== BETA PREMIUM MANAGEMENT =====

export const getBetaRequests = async (status = 'ALL') => {
    return await apiClient.get(`/admin/beta-requests?status=${status}`);
};

export const approveBetaRequest = async (id, adminNotes = '') => {
    return await apiClient.post(`/admin/beta-requests/${id}/approve`, { adminNotes });
};

export const rejectBetaRequest = async (id, adminNotes = '') => {
    return await apiClient.post(`/admin/beta-requests/${id}/reject`, { adminNotes });
};

export const grantBetaPremium = async (userId) => {
    return await apiClient.post(`/admin/grant-beta-premium/${userId}`);
};

export const grantLifetime = async (userId) => {
    return await apiClient.post(`/admin/grant-lifetime/${userId}`);
};

export const revokePremium = async (userId) => {
    return await apiClient.post(`/admin/revoke-premium/${userId}`);
};

export const convertToPaid = async (userId) => {
    return await apiClient.post(`/admin/convert-to-paid/${userId}`);
};

export const getBetaStats = async () => {
    return await apiClient.get('/admin/beta-stats');
};

export const getBetaFeedbacks = async () => {
    return await apiClient.get('/admin/feedbacks');
};
