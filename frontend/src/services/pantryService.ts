import axios from "axios";
import { API_BASE_URL } from "./apiConfig";
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

export type PantryItem = {
  _id: string;
  name: string;
  unit: "kg" | "g" | "l" | "ml" | "pcs" | "dozen" | "packet" | string;
  qty: number;
  tags?: string[];
};

const auth = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const pantryService = {
  async list(): Promise<PantryItem[]> {
    const res = await axios.get(`${API_BASE_URL}/pantry`, { headers: auth() });
    return res.data;
  },
  async upsert(item: Partial<PantryItem>): Promise<PantryItem> {
    const res = await axios.post(`${API_BASE_URL}/pantry`, item, { headers: auth() });
    return res.data;
  },
  async updateQty(id: string, qty: number): Promise<PantryItem> {
    const res = await axios.put(`${API_BASE_URL}/pantry/${id}`, { qty }, { headers: auth() });
    return res.data;
  },
  async delete(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/pantry/${id}`, { headers: auth() });
  },
};

export default pantryService;
