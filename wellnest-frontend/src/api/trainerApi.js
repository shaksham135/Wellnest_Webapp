// src/api/trainerApi.js
import apiClient from "./apiClient";

/**
 * Trainer API - connects frontend to Spring Boot backend
 */

// Get all trainers
export const getAllTrainers = () => apiClient.get("/trainers");

// Match trainers based on goal and location filters
export const matchTrainers = (goal = 'All', location = 'Any') => {
    return apiClient.get("/trainers/match", {
        params: { goal, location }
    });
};

// Get a specific trainer by ID
export const getTrainerById = (id) => apiClient.get(`/trainers/${id}`);

// Trainer Interaction API
export const requestConnection = (trainerId, message) =>
    apiClient.post(`/trainer-interactions/connect/${trainerId}`, { initialMessage: message });

export const getClientRequests = () =>
    apiClient.get("/trainer-interactions/client-requests");

export const getTrainerRequests = () =>
    apiClient.get("/trainer-interactions/requests");

export const updateRequestStatus = (requestId, status) =>
    apiClient.put(`/trainer-interactions/requests/${requestId}`, null, { params: { status } });

export const sendMessage = (receiverId, message) =>
    apiClient.post(`/trainer-interactions/chat/send/${receiverId}`, { initialMessage: message });

export const getChatHistory = (otherUserId) =>
    apiClient.get(`/trainer-interactions/chat/${otherUserId}`);

export const getClientDetails = (clientId) => apiClient.get(`/trainer-interactions/client/${clientId}`);

export const getTrainerFilters = () => apiClient.get("/trainers/filters");

export const updateTrainerProfile = (data) => apiClient.put("/trainers/profile", data);

export const rateTrainer = (id, rating) => apiClient.post(`/trainers/${id}/rate`, { rating });

// Diet Plan API
export const saveDietPlan = (data) => apiClient.post("/trainers/diet-plan", data);
export const getDietPlanForClient = (clientId) => apiClient.get(`/trainers/diet-plan/client/${clientId}`);
export const getDietPlanForTrainer = (trainerId) => apiClient.get(`/trainers/diet-plan/trainer/${trainerId}`);

export const getClientAnalytics = (clientId) => apiClient.get(`/analytics/client/${clientId}`);


