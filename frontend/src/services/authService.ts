import axios from "axios";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
import { API_BASE_URL } from "./apiConfig";

export const authService = {
  register: async (data: any) => {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, data);
    return response.data;
  },

  login: async (data: any) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, data);
    return response.data;
  },
};