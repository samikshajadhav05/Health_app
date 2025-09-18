// frontend/src/services/pantryService.ts
import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

// This type now includes the 'status' field to match the backend and component needs.
export type PantryItem = {
  _id: string;
  name: string;
  status: 'in_stock' | 'to_buy';
  // Optional fields that might come from the backend
  unit?: string;
  qty?: number;
  tags?: string[];
};

const auth = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const pantryService = {
  /**
   * Fetches items by status, matching the backend endpoint (`/grocery?status=...`).
   */
  async list(status: 'in_stock' | 'to_buy'): Promise<PantryItem[]> {
    const res = await axios.get(`${API_BASE_URL}/grocery?status=${status}`, { headers: auth() });
    return res.data;
  },

  /**
   * Adds a new item to the grocery list.
   */
  async add(item: { name: string, status: 'in_stock' | 'to_buy' }): Promise<PantryItem> {
    const res = await axios.post(`${API_BASE_URL}/grocery`, item, { headers: auth() });
    return res.data;
  },

  /**
   * Updates the status of an existing item (e.g., from 'in_stock' to 'to_buy').
   */
  async updateStatus(id: string, newStatus: 'in_stock' | 'to_buy'): Promise<PantryItem> {
    const res = await axios.put(`${API_BASE_URL}/grocery/${id}/status?new_status=${newStatus}`, {}, { headers: auth() });
    return res.data;
  },

  /**
   * Deletes an item from the grocery list.
   */
  async delete(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/grocery/${id}`, { headers: auth() });
  },
};

export default pantryService;