// frontend/services/aiMealService.ts
import axios from "axios";
import { API_BASE_URL } from "./apiConfig"; // ✅ Use the same config as mealPlanService

console.log("🔍 aiMealService API_BASE_URL:", API_BASE_URL);

const aiMealService = {
  async suggest(payload: {
    mealType: "breakfast" | "lunch" | "dinner" | "snack";
    pantry: { name: string; unit?: string }[];
    targets?: any;
  }) {
    const url = `${API_BASE_URL}/ai/meal-suggest`;
    
    // 🐛 DEBUG: Log the URL being constructed
    console.log("🔍 AI Service API_BASE_URL:", API_BASE_URL);
    console.log("🔍 AI Service Final URL:", url);
    
    const res = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        ...(localStorage.getItem("token")
          ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
          : {}),
      },
    });
    return res.data;
  },
};

export default aiMealService;