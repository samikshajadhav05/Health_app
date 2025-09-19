import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

const MEALS_URL = `${API_BASE_URL}/meals`;

const authHeaders = () => {
  try {
    const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return t ? { Authorization: `Bearer ${t}` } : {};
  } catch {
    return {};
  }
};

export const mealService = {
  /**
   * Fetches all individual meal entries logged for today.
   */
  async getTodaysMeals(): Promise<any[]> {
    const url = `${MEALS_URL}/today`;
    const res = await axios.get(url, { headers: { ...authHeaders() } });
    return res.data;
  },

  /**
   * NEW: Asks the backend to suggest meals for today.
   */
  async suggestTodaysMeals(): Promise<{ breakfast: string, lunch: string, dinner: string }> {
    const url = `${MEALS_URL}/suggest-day`;
    const res = await axios.post(url, {}, { headers: { ...authHeaders() } });
    return res.data;
  },
};

export default mealService;
