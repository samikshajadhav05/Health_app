// frontend/src/pages/MealPlanner.tsx
import React, { useEffect, useState, useMemo } from "react";
import Navbar from "../components/Navbar";

// Import services and their types
import { pantryService } from "../services/pantryService";
import type { PantryItem } from "../services/pantryService";
import { mealPlanService } from "../services/mealPlanService";
import type { MealPlan, PlannedMeal } from "../services/mealPlanService";
import nutritionixService from "../services/nutritionixService";

// Import all required child components
import Pantry from "../components/meal-planner/Pantry";
import MealCard from "../components/meal-planner/MealCard";
import DailyTotals from "../components/meal-planner/DailyTotals";
import ManualMealModal from "../components/meal-planner/ManualMealModal";

// ---------- LOCAL TYPES ----------
type MealType = "breakfast" | "lunch" | "dinner" | "snack";

interface MealCardData {
  name: string;
  macros: { calories: number; carbs: number; protein: number; fibre: number };
}

// ---------- HELPERS ----------
const todayISO = () => new Date().toISOString().slice(0, 10);
const mondayOf = (iso: string) => {
    const d = new Date(iso);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff)).toISOString().slice(0, 10);
};

// ---------- MAIN COMPONENT ----------
const MealPlanner: React.FC = () => {
  const [groceryItems, setGroceryItems] = useState<PantryItem[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [cards, setCards] = useState<Record<MealType, MealCardData>>({
    breakfast: { name: "—", macros: { calories: 0, carbs: 0, protein: 0, fibre: 0 } },
    lunch: { name: "—", macros: { calories: 0, carbs: 0, protein: 0, fibre: 0 } },
    dinner: { name: "—", macros: { calories: 0, carbs: 0, protein: 0, fibre: 0 } },
    snack: { name: "—", macros: { calories: 0, carbs: 0, protein: 0, fibre: 0 } },
  });

  const [manualModal, setManualModal] = useState<{ open: boolean; mealType: MealType | null }>({
    open: false,
    mealType: null,
  });

  // --- Data Fetching & State Syncing ---
  const fetchGroceries = async () => {
    try {
      const inStock = await pantryService.list("in_stock");
      const toBuy = await pantryService.list("to_buy");
      setGroceryItems([...(inStock || []), ...(toBuy || [])]);
    } catch (err) {
      console.error("Failed to fetch groceries:", err);
    }
  };
  
  const loadInitialData = async () => {
    setIsInitialLoading(true);
    setError(null);
    try {
        await fetchGroceries();
        const planData = await mealPlanService.get(mondayOf(todayISO()));
        setMealPlan(planData);
    } catch (err: any) {
        if (err.response?.status === 404) {
            setMealPlan(null); // Explicitly set to null if no plan is found
        } else {
            console.error("Failed to load initial data:", err);
            setError("Could not load your data.");
        }
    } finally {
        setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const newCards: Record<MealType, MealCardData> = {
        breakfast: { name: "—", macros: { calories: 0, carbs: 0, protein: 0, fibre: 0 } },
        lunch: { name: "—", macros: { calories: 0, carbs: 0, protein: 0, fibre: 0 } },
        dinner: { name: "—", macros: { calories: 0, carbs: 0, protein: 0, fibre: 0 } },
        snack: { name: "—", macros: { calories: 0, carbs: 0, protein: 0, fibre: 0 } },
    };

    if (mealPlan?.meals) {
      const today = todayISO();
      const todayMeals = mealPlan.meals.filter(meal => meal.date === today);
      todayMeals.forEach(meal => {
        if (newCards[meal.mealType as MealType]) {
            newCards[meal.mealType as MealType] = {
                name: meal.name,
                macros: meal.macros || { calories: 0, carbs: 0, protein: 0, fibre: 0 }
            };
        }
      });
    }
    setCards(newCards);
  }, [mealPlan]);

  const handleGeneratePlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mealPlanService.generate(mondayOf(todayISO()));
      setMealPlan(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to generate meal plan.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMeal = async (mealType: MealType, name: string, macros: MealCardData['macros']) => {
    if (!mealPlan) return; // Cannot save a meal if there is no plan shell
    const today = todayISO();
    const otherMeals = mealPlan.meals.filter(m => !(m.date === today && m.mealType === mealType));
    const newMeal: PlannedMeal = { date: today, mealType, name, macros };
    const updatedPlan: MealPlan = { ...mealPlan, meals: [...otherMeals, newMeal] };
    try {
      const savedPlan = await mealPlanService.update(updatedPlan);
      setMealPlan(savedPlan);
    } catch (err) {
      alert("Could not save the meal to your plan.");
    }
  };

  const handleToggleItem = async (id: string, currentStatus: 'in_stock' | 'to_buy') => {
    const newStatus = currentStatus === 'in_stock' ? 'to_buy' : 'in_stock';
    await pantryService.updateStatus(id, newStatus);
    fetchGroceries(); // Re-fetch to update the UI
  };

  const handleAddItem = async (name: string, status: 'in_stock' | 'to_buy') => {
    await pantryService.add({ name, status });
    fetchGroceries(); // Re-fetch to update the UI
  };
  
  const handleSubmitManualMeal = async (text: string) => {
    const { mealType } = manualModal;
    if (!mealType) return;
    try {
        const parsed = await nutritionixService.analyze({ query: text });
        const macros = {
          calories: parsed.macros?.calories || 0,
          carbs: parsed.macros?.carbs || 0,
          protein: parsed.macros?.protein || 0,
          fibre: (parsed.macros?.fibre ?? parsed.macros?.fiber) || 0,
        };
        await handleSaveMeal(mealType, parsed.name || text, macros);
    } catch (err) {
        alert("Could not analyze or save the meal.");
    } finally {
        setManualModal({ open: false, mealType: null });
    }
  };

  const dailyTotals = useMemo(() => {
    return Object.values(cards).reduce(
      (acc, card) => {
        acc.calories += card.macros.calories;
        acc.carbs += card.macros.carbs;
        acc.protein += card.macros.protein;
        acc.fibre += card.macros.fibre;
        return acc;
      }, { calories: 0, carbs: 0, protein: 0, fibre: 0 }
    );
  }, [cards]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#FDE68A] via-[#FBCFE8] to-[#DDD6FE] text-[#3B0764]">
      <div className="p-6">
        <Navbar />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          <div className="relative h-full flex flex-col rounded-[28px] p-6 bg-white/25 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
            <h1 className="text-2xl font-semibold mb-4 text-center">Today's Meals</h1>
            {error && <div className="text-center text-sm text-red-600 bg-white/50 p-3 rounded-xl mb-4">{error}</div>}
            {isInitialLoading ? (
                <div className="flex justify-center items-center h-full"><p>Loading your plan...</p></div>
            ) : mealPlan ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {(["breakfast", "lunch", "snack", "dinner"] as MealType[]).map((type) => (
                            <MealCard
                                key={type}
                                title={type.charAt(0).toUpperCase() + type.slice(1)}
                                mealType={type}
                                cardData={cards[type]}
                                onGenerate={() => alert("Single meal generation coming soon!")}
                                onManual={(mealType) => setManualModal({ open: true, mealType })}
                                onLog={() => alert("Logging feature coming soon!")}
                                onBack={(mealType) => handleSaveMeal(mealType, "—", {calories: 0, carbs: 0, protein: 0, fibre: 0})}
                            />
                        ))}
                    </div>
                    <DailyTotals totals={dailyTotals} />
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full">
                    <p className="text-xl font-semibold mb-4">No meal plan for this week.</p>
                    <button 
                        onClick={handleGeneratePlan} 
                        disabled={loading}
                        className="w-full max-w-xs px-4 py-3 rounded-2xl font-semibold bg-gradient-to-r from-[#FDE68A] via-[#FBCFE8] to-[#DDD6FE] ring-1 ring-white/60 shadow-md hover:shadow-xl hover:brightness-[1.07] active:brightness-95 transition disabled:opacity-60"
                    >
                        {loading ? "Generating..." : "Generate New Plan"}
                    </button>
                </div>
            )}
          </div>
          <Pantry items={groceryItems} onToggleItem={handleToggleItem} onAddItem={handleAddItem} />
        </div>
      </div>
      {manualModal.open && (
        <ManualMealModal 
          onClose={() => setManualModal({ open: false, mealType: null })}
          onSubmit={handleSubmitManualMeal}
        />
      )}
    </div>
  );
};

export default MealPlanner;