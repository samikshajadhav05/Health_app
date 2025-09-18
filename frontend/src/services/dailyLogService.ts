// frontend/services/dailyLogService.ts
import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

// This type definition is complex and not used by the current code, so we can simplify it
export type MealsPayload = {
  [key: string]: string;
};

const auth = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const dailyLogService = {
  logWeight: async (data: { weight: number; measuredAt: string }) => {
    const res = await axios.post(`${API_BASE_URL}/weights`, data, {
      headers: auth(),
    });
    return res.data;
  },

  logActivity: async (data: { type: string; steps: number; duration: number }) => {
    const res = await axios.post(`${API_BASE_URL}/activity`, data, {
      headers: auth(),
    });
    return res.data;
  },

  calculateMacros: async (meals: MealsPayload) => {
    const res = await axios.post(
      `${API_BASE_URL}/daily-log/calculate-macros`,
      { meals }, // Ensure payload is wrapped correctly
      { headers: auth() }
    );
    return res.data;
  },

  getLogs: async () => {
    // Corrected URL to match the backend prefix
    const res = await axios.get(`${API_BASE_URL}/daily-log`, {
      headers: auth(),
    });
    return res.data;
  },
};