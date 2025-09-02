import axios from "axios";

// Mirrors your other services (e.g., dailyLogService)
// const API_BASE_URL =
//   (import.meta as any)?.env?.VITE_API_BASE_URL || "http://localhost:5001/api";

  import { API_BASE_URL } from "./apiConfig";

// Types (kept minimal but aligned with the page)
export type DualRange = { min?: number; max?: number };
export type MacroRange = DualRange;

export type WorkoutGoal = {
  type?: "walking" | "running" | "cycling" | "gym" | string;
  mode?: "time" | "calories";
  target?: number; // minutes if mode=time, kcal if mode=calories
};

export type NonWeightGoals = {
  sleepHours?: DualRange;
  waterLiters?: DualRange;
};

export type StreakGoals = {
  stepsDaysPerWeekMin?: number;
  caloriesWithinGoalDaysPerWeekMin?: number;
};

export type Goals = {
  steps?: DualRange;
  workout?: WorkoutGoal;
  macros?: {
    calories?: MacroRange;
    protein?: MacroRange;
    carbs?: MacroRange;
    fat?: MacroRange;
    fiber?: MacroRange;
  };
  currentWeight?: number;
  goalWeight?: number;
  targetDate?: string | null;
  nonWeight?: NonWeightGoals;
  streaks?: StreakGoals;

  // legacy (ignore on UI, kept for compatibility)
  stepsTarget?: number;
  workoutType?: string;
  workoutDuration?: number;
  streak?: number;
};

export type UpdateGoalsPayload = Partial<Goals>;

const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const goalsService = {
  async getGoals(): Promise<Goals> {
    const res = await axios.get(`${API_BASE_URL}/goals`, {
      headers: { ...authHeader() },
    });
    return res.data;
  },

  async updateGoals(data: UpdateGoalsPayload): Promise<Goals> {
    const res = await axios.put(`${API_BASE_URL}/goals`, data, {
      headers: { "Content-Type": "application/json", ...authHeader() },
    });
    return res.data;
  },
};

export default goalsService;
