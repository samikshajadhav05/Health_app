import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";

import pantryService from "../services/pantryService";
import mealService from "../services/mealService";
import mealPlanService from "../services/mealPlanService";

// ---------- Local types matching your UI ----------
interface GroceryItem {
  id: string;
  name: string;
  category: string;
  unit: string;       // e.g., kg, g, l, ml, pcs, dozen, packet
  selected: boolean;  // true = available; false = finished/out (to buy)
}

interface Meal {
  name: string;
  items: string[];
}

interface MacroInfo {
  calories: number;
  carbs: number;
  protein: number;
  fibre: number;
}

interface NewItem {
  name: string;
  qty: string;
  category: string;
  unit: string;
  toBuy: boolean;     // add directly to "To buy" (qty=0)
}

// ---------- Helpers ----------
const todayISO = () => new Date().toISOString().slice(0, 10);

const mondayOf = (iso: string) => {
  const d = new Date(iso);
  const day = d.getDay(); // 0 Sun … 6 Sat
  const diff = (day === 0 ? -6 : 1) - day; // go to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

const ALLOWED_UNITS = ["kg", "g", "l", "ml", "pcs", "dozen", "packet"] as const;
type AllowedUnit = (typeof ALLOWED_UNITS)[number];

const normalizeUnit = (u: string): AllowedUnit => {
  const low = (u || "").toLowerCase();
  return (ALLOWED_UNITS as readonly string[]).includes(low) ? (low as AllowedUnit) : "pcs";
};

const MealPlannerApp: React.FC = () => {
  // ---- pantry / grocery UI state
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [showToBuy, setShowToBuy] = useState<boolean>(false); // ✅ dedicated To-buy view toggle
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newItem, setNewItem] = useState<NewItem>({
    name: "",
    qty: "",
    category: "Fresh Produce",
    unit: "kg",
    toBuy: false,
  });

  // ---- plan/templates/macros state
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(mondayOf(todayISO()));
  const [plan, setPlan] = useState<{
    _id?: string;
    weekStart: string;
    meals: {
      date: string;
      mealType: "breakfast" | "lunch" | "dinner" | "snack";
      templateId?: string | null;
      name: string;
    }[];
    grocery: {
      name: string;
      unit: string;
      qtyNeeded: number;
      have: number;
      purchased?: boolean;
    }[];
  } | null>(null);
  const [templates, setTemplates] = useState<
    { _id: string; name: string; mealType: "breakfast" | "lunch" | "dinner" | "snack"; macros?: any }[]
  >([]);
  const [macros, setMacros] = useState<MacroInfo>({ calories: 0, carbs: 0, protein: 0, fibre: 0 });

  const units = ALLOWED_UNITS.slice();
  // Note: removed "To buy" from categories (it is now a separate view toggle)
  const categories = ["Fresh Produce", "Dairy", "Grains & Pulses", "Drinks & Snacks", "Misc", "All"];

  // ---------- Load pantry + templates + plan (for the current week) ----------
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // Pantry -> map to your UI structure
        const pantry = await pantryService.list(); // [{_id,name,unit,qty,tags}]
        const mapped: GroceryItem[] = (pantry || []).map((p: any) => ({
          id: String(p._id),
          name: p.name,
          category: (p.tags && p.tags[0]) || "Misc",
          unit: p.unit || "pcs",
          selected: (p.qty ?? 0) > 0, // true means we have stock
        }));
        setGroceryItems(mapped);

        // Meal templates (used for macros)
        const tpls = await mealService.list(); // [{_id,name,mealType,macros}]
        setTemplates(tpls || []);

        // Weekly plan
        const mp = await mealPlanService.get(weekStart);
        setPlan(mp);
      } catch (e) {
        console.error("MealPlanner load failed:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [weekStart]);

  // ---------- Filtered grocery list based on view ----------
  // RULE:
  // - showToBuy = true  => only out-of-stock items (!selected), irrespective of category
  // - showToBuy = false => only in-stock items; if "All" show all in-stock, else filter by category
  const filteredItems = useMemo(() => {
    if (showToBuy) return groceryItems.filter((i) => !i.selected);
    if (activeCategory === "All") return groceryItems.filter((i) => i.selected);
    return groceryItems.filter((i) => i.selected && i.category === activeCategory);
  }, [groceryItems, activeCategory, showToBuy]);

  // ---------- Toggle pantry item availability (finished/out vs available) ----------
  const toggleItem = async (id: string) => {
    // optimistic UI
    setGroceryItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, selected: !i.selected } : i))
    );

    try {
      const item = groceryItems.find((i) => i.id === id);
      const goingToSelected = item ? !item.selected : true; // true = will be "available"
      await pantryService.updateQty(id, goingToSelected ? 1 : 0);
    } catch (e) {
      console.error("Failed to update pantry qty", e);
    }
  };

  // ---------- Add new pantry item (modal) ----------
  const handleAddItem = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You're not signed in. Please sign in again and try adding the item.");
      return;
    }

    const name = newItem.name.trim();
    if (!name) {
      alert("Please enter an item name.");
      return;
    }

    // If "Add to To buy" is checked => qty=0 (out of stock). Otherwise default to 1 if blank.
    const raw = (newItem.qty ?? "").toString().trim();
    const qtyParsed = newItem.toBuy ? 0 : raw === "" ? 1 : Number(raw);
    const qtyNum = Number.isFinite(qtyParsed) && qtyParsed >= 0 ? qtyParsed : newItem.toBuy ? 0 : 1;

    const unitToSend = normalizeUnit(newItem.unit);

    try {
      const created = await pantryService.upsert({
        name,
        unit: unitToSend,
        qty: qtyNum,
        tags: [newItem.category],
      });

      setGroceryItems((prev) => [
        ...prev,
        {
          id: String(created._id),
          name: created.name,
          category: newItem.category,
          unit: unitToSend,
          selected: (created.qty ?? 0) > 0, // true => available
        },
      ]);

      // If they added a To buy item, switch to the To-buy view so they see it immediately
      if (newItem.toBuy) {
        setShowToBuy(true);
      }

      setNewItem({ name: "", qty: "", category: "Fresh Produce", unit: "kg", toBuy: false });
      setShowAddModal(false);
    } catch (err: any) {
      console.error("Add pantry item failed:", err?.response?.data || err);
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        (status === 401
          ? "Unauthorized. Please sign in again."
          : status === 404
          ? "API route not found. Make sure /api/pantry is mounted."
          : "Couldn't add item. Please try again.");
      alert(`Couldn't add item${status ? ` (HTTP ${status})` : ""}: ${msg}`);
    }
  };

  // ---------- Generate/Regenerate plan for the week ----------
  const ensurePlan = async () => {
    try {
      setLoading(true);
      const mp = await mealPlanService.generate(weekStart);
      setPlan(mp);
    } catch (e) {
      console.error("Generate plan failed:", e);
      alert("Couldn't generate plan. Make sure the backend meal plan routes are mounted and you're signed in.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Today’s planned meals (names for Lunch/Dinner cards) ----------
  const today = todayISO();
  const todayMeals = useMemo(() => {
    const out: Record<"breakfast" | "lunch" | "dinner" | "snack", Meal> = {
      breakfast: { name: "", items: [] },
      lunch: { name: "", items: [] },
      dinner: { name: "", items: [] },
      snack: { name: "", items: [] },
    };
    if (!plan) return out;
    const byType: any = {};
    (plan.meals || [])
      .filter((m) => m.date === today)
      .forEach((m) => (byType[m.mealType] = m));

    (["breakfast", "lunch", "dinner", "snack"] as const).forEach((type) => {
      const slot = byType[type];
      if (!slot) return;
      out[type] = { name: slot.name || "", items: [] };
    });
    return out;
  }, [plan]);

  // ---------- Calculate macros for TODAY’s planned meals ----------
  const calculateTodayMacros = () => {
    if (!plan) return;
    const templateMap = new Map(templates.map((t) => [t._id, t]));
    const todayRows = (plan.meals || []).filter((m) => m.date === today);

    const totals = todayRows.reduce(
      (acc, m) => {
        if (m.templateId && templateMap.has(m.templateId)) {
          const t: any = templateMap.get(m.templateId);
          const mm = t?.macros || {};
          acc.calories += Number(mm.calories || 0);
          acc.carbs += Number(mm.carbs || 0);
          acc.protein += Number(mm.protein || 0);
          acc.fibre += Number(mm.fiber || mm.fibre || 0);
        }
        return acc;
      },
      { calories: 0, carbs: 0, protein: 0, fibre: 0 }
    );

    setMacros({
      calories: Math.round(totals.calories),
      carbs: Math.round(totals.carbs),
      protein: Math.round(totals.protein),
      fibre: Math.round(totals.fibre),
    });
  };

  // ---------- Loading skeleton ----------
  if (loading) {
    return (
      <div className="min-h-screen bg-lightblue  p-6">
        <Navbar />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          <div className="lg:col-span-2">
            <div className="bg-white backdrop-blur-md rounded-3xl p-8 h-72 animate-pulse" />
          </div>
          <div className="bg-white backdrop-blur-md rounded-3xl p-6 h-72 animate-pulse" />
        </div>
      </div>
    );
  }

  // ---------- Your exact UI (unchanged layout/colors) ----------
  return (
    <div className="min-h-screen bg-lightblue  p-6">
      <Navbar />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Meal Planner Section */}
        <div className="lg:col-span-2">
          <div className="bg-white backdrop-blur-md rounded-3xl p-8">
            {/* 2x2 Grid Layout: Breakfast-Lunch on top, Snacks-Dinner on bottom */}
            <div className="grid grid-cols-2 gap-6">
              {/* Breakfast Section */}
              <div className="bg-white border border-[#84BCDA] rounded-2xl p-6">
                <h2 className="text-2xl font-semibold text-blue-800 text-center mb-4">Breakfast</h2>
                <div className="space-y-4">
                  <button
                    className="w-full bg-orange-400 hover:bg-orange-500 text-white font-medium py-3 px-6 rounded-xl transition-colors"
                    onClick={ensurePlan}
                  >
                    Generate meals based on available groceries
                  </button>
                  <button className="w-full bg-orange-400 hover:bg-orange-500 text-white font-medium py-3 px-6 rounded-xl transition-colors">
                    Manually enter meal
                  </button>
                </div>
              </div>

              {/* Lunch Section */}
              <div className="bg-white border border-[#84BCDA]  rounded-2xl p-6">
                <h2 className="text-2xl font-semibold text-blue-800 text-center mb-4">Lunch</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-lightblue rounded-xl p-4">
                    <h3 className="font-semibold text-white mb-2">Meal</h3>
                    <p className="text-white text-sm mb-2">{todayMeals.lunch.name || "—"}</p>
                  </div>
                  <div className="bg-lightblue rounded-xl p-4">
                    <h3 className="font-semibold text-white mb-2">Macros</h3>
                    <p className="text-white text-sm">Calories: {macros.calories} kcal</p>
                    <p className="text-white text-sm">Carbs: {macros.carbs}g</p>
                    <p className="text-white text-sm">Protein: {macros.protein}g</p>
                    <p className="text-white text-sm">Fibre: {macros.fibre}g</p>
                  </div>
                </div>
              </div>

              {/* Snacks Section */}
              <div className="bg-white border border-[#84BCDA]  rounded-2xl p-6">
                <h2 className="text-2xl font-semibold text-blue-800 text-center mb-4">Snacks</h2>
                <div className="bg-lightblue rounded-xl p-8 mb-4">
                  <p className="text-white text-center text-lg">Enter Meal</p>
                </div>
                <div className="text-center">
                  <button
                    className="bg-orange-400 hover:bg-orange-500 text-white font-medium py-3 px-8 rounded-xl transition-colors"
                    onClick={calculateTodayMacros}
                  >
                    Calculate Macros
                  </button>
                </div>
              </div>

              {/* Dinner Section */}
              <div className="bg-white border border-[#84BCDA]  rounded-2xl p-6">
                <h2 className="text-2xl font-semibold text-blue-800 text-center mb-4">Dinner</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-lightblue rounded-xl p-4">
                    <h3 className="font-semibold text-white mb-2">Meal</h3>
                    <p className="text-white text-sm mb-2">{todayMeals.dinner.name || "—"}</p>
                  </div>
                  <div className="bg-lightblue rounded-xl p-4">
                    <h3 className="font-semibold text-white mb-2">Macros</h3>
                    <p className="text-white text-sm">Calories: {macros.calories} kcal</p>
                    <p className="text-white text-sm">Carbs: {macros.carbs}g</p>
                    <p className="text-white text-sm">Protein: {macros.protein}g</p>
                    <p className="text-white text-sm">Fibre: {macros.fibre}g</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Groceries Section */}
        <div className="lg:col-span-1">
          <div className="bg-white backdrop-blur-md rounded-3xl p-6">
            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-orange-400 hover:bg-orange-500 text-white font-medium py-2 px-4 rounded-xl transition-colors"
              >
                Add Items
              </button>
              <button
                className={`${
                  showToBuy ? "bg-blue-500 text-white" : "bg-orange-400 hover:bg-orange-500 text-white"
                } font-medium py-2 px-4 rounded-xl transition-colors`}
                onClick={() => setShowToBuy((v) => !v)} // ✅ dedicated To-buy toggle
                title="View items to buy"
              >
                {showToBuy ? "Viewing: To buy" : "To buy"}
              </button>
            </div>

            {/* Category Filters (disabled while in To-buy view) */}
            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setShowToBuy(false); // leaving To-buy view
                    setActiveCategory(category);
                  }}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                    !showToBuy && activeCategory === category
                      ? "bg-blue-500 text-white"
                      : "bg-blue-200 text-blue-800 hover:bg-blue-300"
                  } ${showToBuy ? "opacity-60 cursor-not-allowed" : ""}`}
                  disabled={showToBuy}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Grocery Items */}
            <div className="grid grid-cols-2 gap-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  // click anywhere on the row to toggle (and thus move between views)
                  onClick={() => toggleItem(item.id)}
                  className="flex items-center space-x-3 p-2 hover:bg-white rounded-lg transition-colors cursor-pointer select-none"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // avoid double toggle when clicking the circle
                      toggleItem(item.id);
                    }}
                    className={`w-5 h-5 rounded-full border-2 transition-colors ${
                      item.selected ? "bg-blue border-blue-500" : "border-blue-300 hover:border-blue-400"
                    }`}
                    title={item.selected ? "Have it" : "Finished / Out"}
                    aria-pressed={!item.selected}
                  >
                    {item.selected && <div className="w-full h-full rounded-full bg-blue-500"></div>}
                  </button>
                  {/* selected=true (available) => normal; false => strike-through (only visible in To-buy view) */}
                  <span className={`text-sm ${item.selected ? "text-blue" : "text-blue-300 line-through"}`}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Item Modal Overlay */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-blue mb-6 text-center">Add New Item</h2>

            <div className="space-y-4">
              {/* Item Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter item name"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  type="text"
                  value={newItem.qty}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, qty: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Enter quantity${newItem.toBuy ? " (ignored when 'To buy' is checked)" : " (blank = 1)"}`}
                  disabled={newItem.toBuy}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Fresh Produce">Fresh Produce</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Grains & Pulses">Grains & Pulses</option>
                  <option value="Drinks & Snacks">Drinks & Snacks</option>
                  <option value="Misc">Misc</option>
                </select>
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                <select
                  value={newItem.unit}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, unit: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add directly to "To buy" */}
              <div className="flex items-center gap-2">
                <input
                  id="toBuy"
                  type="checkbox"
                  checked={newItem.toBuy}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, toBuy: e.target.checked }))}
                />
                <label htmlFor="toBuy" className="text-sm text-gray-700">
                  Add to <span className="font-medium">To buy</span> (mark as out of stock)
                </label>
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                className="flex-1 bg-orange-400 hover:bg-orange-500 text-white font-medium py-2 px-4 rounded-xl transition-colors"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlannerApp;