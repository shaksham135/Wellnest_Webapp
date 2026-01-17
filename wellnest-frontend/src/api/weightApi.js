
import apiClient from "./apiClient";

export const logWeight = (weightKg) => {
  return apiClient.post("/weight-logs", {
    weightKg,
  });
};
