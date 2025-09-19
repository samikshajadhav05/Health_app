// frontend/src/pages/MealPlanner.tsx
import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { dailyLogService } from "../services/dailyLogService";
import { mealService } from "../services/mealService";
import { pantryService } from "../services/pantryService";
import type { PantryItem } from "../services/pantryService";

// Re-use the same components from the Home page
import MealInput from "../components/MealInput";
import MacrosDisplay from "../components/MacrosDisplay";
import Pantry from "../components/meal-planner/Pantry"; // The new, simplified pantry

type Macros = {
  calories: number; protein: number; carbs: number; fat: number; fiber: number;
};

const MealPlanner: React.FC = () => {
  const [meals, setMeals] = useState({ breakfast: "", lunch: "", snacks: "", dinner: "" });
  const [macros, setMacros] = useState<Macros>({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  
  const [loadingMacros, setLoadingMacros] = useState(false);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  // --- Data Fetching ---
  const fetchTodaysData = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      
      const [logs, todaysMeals, inStock, toBuy] = await Promise.all([
        dailyLogService.getLogs(),
        mealService.getTodaysMeals(),
        pantryService.list("in_stock"),
        pantryService.list("to_buy"),
      ]);

      const todayLog = (logs || []).find((l: any) => l.date && l.date.startsWith(today));
      if (todayLog && todayLog.totals) {
        setMacros(todayLog.totals);
      }
      
      if (todaysMeals && todaysMeals.length > 0) {
        const mealInputs = { breakfast: "", lunch: "", snacks: "", dinner: "" };
        todaysMeals.forEach(meal => {
          if (meal.meal_type && mealInputs.hasOwnProperty(meal.meal_type)) {
            mealInputs[meal.meal_type as keyof typeof mealInputs] = meal.description;
          }
        });
        setMeals(mealInputs);
      }
      
      setPantryItems([...(inStock || []), ...(toBuy || [])]);

    } catch (err) {
      console.error("Error loading today's data:", err);
    }
  };

  useEffect(() => {
    fetchTodaysData();
  }, []);

  // --- Logic ---
  const handleCalculateMacros = async () => {
    setLoadingMacros(true);
    try {
      const preparedMeals: { [key: string]: string } = {};
      (Object.keys(meals) as Array<keyof typeof meals>).forEach((k) => {
        if (meals[k].trim()) preparedMeals[k] = meals[k].trim();
      });

      if (Object.keys(preparedMeals).length === 0) {
          setLoadingMacros(false);
          return;
      };

      const data = await dailyLogService.calculateMacros(preparedMeals);
      if (data?.totals) setMacros(data.totals);

    } catch (err) {
      console.error("Error calculating macros:", err);
    } finally {
      setLoadingMacros(false);
    }
  };

  const handleSuggestMeals = async () => {
    setLoadingSuggestion(true);
    try {
      const suggestedMeals = await mealService.suggestTodaysMeals(); 
      setMeals({
        breakfast: suggestedMeals.breakfast || "",
        lunch: suggestedMeals.lunch || "",
        dinner: suggestedMeals.dinner || "",
        snacks: "",
      });
      // After suggesting, refresh the pantry list to see any new "to_buy" items
      fetchTodaysData();
    } catch (err) {
      console.error("Error suggesting meals:", err);
      alert("Could not get meal suggestions. Please try again.");
    } finally {
      setLoadingSuggestion(false);
    }
  };
  
  // --- PANTRY HANDLERS (UPDATED) ---
  const handleAddItem = async (name: string, status: 'in_stock' | 'to_buy') => {
    try {
      await pantryService.add({ name, status });
      fetchTodaysData(); // Re-fetch all data to refresh the list
    } catch (err) {
      alert("Could not add the item. It might already be on your list.");
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await pantryService.delete(id);
      fetchTodaysData(); // Re-fetch all data to refresh the list
    } catch (err) {
      alert("Could not delete the item.");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#FDE68A] via-[#FBCFE8] to-[#DDD6FE]">
      <div className="bg-transparent text-darkblue p-6">
        <Navbar />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
          
          <div className="flex flex-col gap-6">
            <div className="group [perspective:1200px]">
              <div className="h-full flex flex-col rounded-[28px] p-6 bg-white/25 backdrop-blur-xl border border-white/60 shadow-lg">
                <h1 className="text-2xl font-semibold mb-4 text-center text-[#3B0764]">Log or Plan Today's Meals</h1>
                
                <MealInput 
                  meals={meals} 
                  setMeals={setMeals} 
                  calculateMacros={handleCalculateMacros} 
                  loadingMacros={loadingMacros} 
                  mealsLogged={false}
                />

                <button 
                  onClick={handleSuggestMeals}
                  disabled={loadingSuggestion}
                  className="relative w-full mt-4 py-2.5 rounded-2xl font-semibold bg-gradient-to-r from-[#86EFAC] to-[#16A34A] text-white ring-1 ring-white/60 shadow-md hover:shadow-xl hover:brightness-105 active:brightness-95 transition disabled:opacity-60"
                >
                  {loadingSuggestion ? "Thinking..." : "✨ Suggest Meals for Today"}
                </button>
              </div>
            </div>

            <MacrosDisplay 
              macros={macros} 
              loadingMacros={loadingMacros} 
            />
          </div>

          {/* Pass the new delete handler to the Pantry component */}
          <Pantry 
            items={pantryItems} 
            onAddItem={handleAddItem} 
            onDeleteItem={handleDeleteItem} 
          />

        </div>
      </div>
    </div>
  );
};

export default MealPlanner;

