import apiClient from "./apiClient";

// Get current user profile
export const fetchCurrentUser = () => apiClient.get("/users/me");

// Update user profile
export const updateUserProfile = (profileData) => apiClient.put("/users/me/profile", profileData);

// Update user daily targets
export const updateUserTargets = (targetsData) => apiClient.put("/users/targets", targetsData);

// Update FCM Token for Push Notifications
export const updateFcmToken = (token) => apiClient.put("/users/me/fcm-token", { token });

// Toggle Premium Status
export const togglePremium = () => apiClient.post("/users/me/toggle-premium");

// Activate Premium Subscription
export const activateSubscription = (plan) => apiClient.post("/subscription/activate", { plan });

// Purchase item from Coin Shop
export const purchaseShopItem = (itemId) => apiClient.post("/users/shop/purchase", { itemId });

// Seed Demo Data
export const seedDemoData = () => apiClient.post("/users/me/seed-demo-data");
