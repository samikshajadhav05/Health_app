// frontend/src/services/authService.ts
import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

export const authService = {
  register: async (data: any) => {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, data);
    // CORRECTED: Look for 'access_token'
    if (response.data?.access_token) {
      localStorage.setItem("token", response.data.access_token);
    }
    return response.data;
  },

  login: async (data: any) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, data);
    // CORRECTED: Look for 'access_token'
    if (response.data?.access_token) {
      localStorage.setItem("token", response.data.access_token);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("token");
  },

  getToken: () => {
    return localStorage.getItem("token");
  },
};