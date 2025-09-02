// frontend/services/dailyLogService.ts
import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

export type MealsPayload = {
  breakfast?: string;
  lunch?: string;
  snacks?: string;
  dinner?: string;
};

export const dailyLogService = {
  logWeight: async (data: { weight: number; measuredAt: string }) => {
    const token = localStorage.getItem("token");
    const res = await axios.post(`${API_BASE_URL}/daily-log/weight`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  logActivity: async (data: { type: string; steps: number; duration: number }) => {
    const token = localStorage.getItem("token");
    const res = await axios.post(`${API_BASE_URL}/daily-log/activity`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  calculateMacros: async (meals: MealsPayload) => {
    const token = localStorage.getItem("token");
    const res = await axios.post(
      `${API_BASE_URL}/daily-log/calculate-macros`,
      { meals },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data; // expect { macros: {...} }
  },

  getLogs: async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${API_BASE_URL}/daily-log`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
};
