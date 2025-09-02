import axios from "axios";
import { resolveApiBase } from "./_apibase";

const API_BASE = resolveApiBase();
/** Try both common paths */
const MEALS_PATHS = [`${API_BASE}/meals`, `${API_BASE}/meal-templates`];

export type Macros = {
  calories: number;
  protein: number;
  carbs: number;
  fat?: number;
  fiber?: number;
  fibre?: number;
};

export type Ingredient = { name: string; qty: number; unit: string };

export type MealTemplate = {
  _id: string;
  name: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  ingredients?: Ingredient[];
  macros?: Macros;
  tags?: string[];
};

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function tryEndpoints<T>(fn: (base: string) => Promise<T>): Promise<T> {
  let lastErr: any;
  for (const base of MEALS_PATHS) {
    try {
      return await fn(base);
    } catch (err: any) {
      lastErr = err;
      const status = err?.response?.status;
      if (status && status !== 404) throw err;
    }
  }
  throw lastErr;
}

const mealService = {
  async list(): Promise<MealTemplate[]> {
    return tryEndpoints(async (base) => {
      const res = await axios.get(base, { headers: authHeaders() });
      return res.data;
    });
  },

  async create(tpl: Partial<MealTemplate>): Promise<MealTemplate> {
    return tryEndpoints(async (base) => {
      const res = await axios.post(base, tpl, {
        headers: { "Content-Type": "application/json", ...authHeaders() },
      });
      return res.data;
    });
  },
};

export default mealService;
export { mealService };