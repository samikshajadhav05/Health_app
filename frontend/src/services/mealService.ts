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
   * Fetches all individual meal entries logged for the current user for today.
   * This is used to pre-fill the meal input boxes on the Home page when it loads.
   */
  async getTodaysMeals(): Promise<any[]> {
    const url = `${MEALS_URL}/today`;
    const res = await axios.get(url, { headers: { ...authHeaders() } });
    return res.data;
  },
};

export default mealService;