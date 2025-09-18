import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

const base = API_BASE_URL.replace(/\/$/, ""); // trim trailing slash
const API = `${base}/nutritionix`;

const nutritionixService = {
  async analyze(payload: { query: string }) {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const res = await axios.post(`${API}/analyze`, payload, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    return res.data;
  },
};

export default nutritionixService;