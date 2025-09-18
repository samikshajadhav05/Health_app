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
    const res = await axios.get(`${API_BASE_URL}/meal-plans/${weekStart}`, {
      headers: auth(),
    });
    return res.data;
  },

  // Generate a fresh plan (server decides content)
  async generate(weekStart: string): Promise<MealPlan> {
    const res = await axios.post(
      `${API_BASE_URL}/meal-plans/generate`,
      { weekStart },
      { headers: { ...auth(), "Content-Type": "application/json" } }
    );
    return res.data;
  },

  // Save or update an existing plan
  async update(plan: MealPlan): Promise<MealPlan> {
    const res = await axios.post(`${API_BASE_URL}/meal-plans`, plan, {
      headers: { ...auth(), "Content-Type": "application/json" },
    });
    return res.data;
  },
};