// frontend/services/mealPlanService.ts
import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

export type PlannedMeal = {
  date: string; // YYYY-MM-DD
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  templateId?: string | null;
  name: string;
  macros?: { calories: number; carbs: number; protein: number; fibre: number };
};

export type MealPlan = {
  _id: string;
  weekStart: string;
  meals: PlannedMeal[];
  grocery: {
    name: string;
    unit: string;
    qtyNeeded: number;
    have: number;
    purchased?: boolean;
  }[];
};

const auth = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const mealPlanService = {
  // Fetch a meal plan for a given week
  async get(weekStart: string): Promise<MealPlan | null> {
    const url = `${API_BASE_URL}/meal-plans/${weekStart}`;
    
    // --- DEBUG LOG ---
    console.log(`[DEBUG] Attempting to GET meal plan from URL: ${url}`);

    try {
      const res = await axios.get(url, {
        headers: auth(),
      });
      // --- DEBUG LOG ---
      console.log('[DEBUG] Successfully received response from backend:', res.data);
      return res.data;
    } catch (error) {
      // --- DEBUG LOG ---
      console.error('[DEBUG] Error fetching meal plan:', error);
      throw error; // Re-throw the error so the component can handle it
    }
  },

  // Generate a fresh plan (server decides content)
  async generate(weekStart: string): Promise<MealPlan> {
    const url = `${API_BASE_URL}/meal-plans/generate`;
    console.log(`[DEBUG] Attempting to POST to generate plan at URL: ${url}`);
    const res = await axios.post(
      url,
      { weekStart },
      { headers: { ...auth(), "Content-Type": "application/json" } }
    );
    return res.data;
  },

  // Save or update an existing plan
  async update(plan: MealPlan): Promise<MealPlan> {
    const url = `${API_BASE_URL}/meal-plans`;
    console.log(`[DEBUG] Attempting to POST to update plan at URL: ${url}`);
    const res = await axios.post(url, plan, {
      headers: { ...auth(), "Content-Type": "application/json" },
    });
    return res.data;
  },
};

