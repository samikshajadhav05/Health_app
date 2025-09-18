// frontend/src/pages/Home.tsx
import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { dailyLogService } from "../services/dailyLogService";
import { mealService } from "../services/mealService";

// Import the new components
import WeightLogger from "../components/WeightLogger";
import ActivityLogger from "../components/ActivityLogger";
import MealInput from "../components/MealInput";
import MacrosDisplay from "../components/MacrosDisplay";

type Macros = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

const Home: React.FC = () => {
  // State management remains in the parent component
  const [weight, setWeight] = useState("");
  const [measuredAt, setMeasuredAt] = useState("");
  const [activityType, setActivityType] = useState("");
  const [steps, setSteps] = useState("");
  const [duration, setDuration] = useState("");
  const [meals, setMeals] = useState({ breakfast: "", lunch: "", snacks: "", dinner: "" });
  const [macros, setMacros] = useState<Macros>({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  const [loadingWeight, setLoadingWeight] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [loadingMacros, setLoadingMacros] = useState(false);

  const [weightLogged, setWeightLogged] = useState<null | { value: number; measuredAt: string }>(null);
  const [activityLogged, setActivityLogged] = useState<null | { type: string; steps?: number; duration?: number }>(null);
  const [mealsLogged, setMealsLogged] = useState<boolean>(false);

  // This useEffect hook is now much cleaner
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const loadTodaysData = async () => {
      try {
        const [logs, todaysMeals] = await Promise.all([
          dailyLogService.getLogs(),
          mealService.getTodaysMeals(),
        ]);
        
        const todayLog = (logs || []).find((l: any) => l.date && l.date.startsWith(today));
        if (todayLog && todayLog.totals) {
          setMacros(todayLog.totals);
          setMealsLogged(true);
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
      } catch (err) {
        console.error("Error loading today's data:", err);
      }
    };
    loadTodaysData();
  }, []);

  // All the logic functions remain here
  const logWeight = async () => {
    if (!measuredAt || !weight) return;
    setLoadingWeight(true);
    try {
      const res = await dailyLogService.logWeight({ weight: Number(weight), measuredAt });
      setWeightLogged({ value: res.weight, measuredAt: res.measuredAt });
    } catch (err) {
      console.error("Error logging weight:", err);
    } finally {
      setLoadingWeight(false);
    }
  };

  const logActivity = async () => {
    if (!activityType) return;
    setLoadingActivity(true);
    try {
      const res = await dailyLogService.logActivity({ type: activityType, steps: Number(steps), duration: Number(duration) });
      setActivityLogged({ type: res.type, steps: res.steps, duration: res.duration });
    } catch (err) {
      console.error("Error logging activity:", err);
    } finally {
      setLoadingActivity(false);
    }
  };
  
  const calculateMacros = async () => {
    setLoadingMacros(true);
    try {
      const preparedMeals: { [key: string]: string } = {};
      (Object.keys(meals) as Array<keyof typeof meals>).forEach((k) => {
        if (meals[k].trim()) preparedMeals[k] = meals[k].trim();
      });

      if (Object.keys(preparedMeals).length === 0) {
        setLoadingMacros(false);
        return;
      }

      const data = await dailyLogService.calculateMacros(preparedMeals);
      if (data?.totals) {
        setMacros(data.totals);
        setMealsLogged(true);
      }
    } catch (err) {
      console.error("Error calculating macros:", err);
    } finally {
      setLoadingMacros(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#FDE68A] via-[#FBCFE8] to-[#DDD6FE]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-60" style={{ background: "radial-gradient( circle at 30% 30%, #FDE68A 0%, transparent 60% )" }}/>
        <div className="absolute top-10 right-0 h-96 w-96 rounded-full blur-3xl opacity-60" style={{ background: "radial-gradient( circle at 70% 30%, #DDD6FE 0%, transparent 60% )" }}/>
        <div className="absolute bottom-[-120px] left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full blur-3xl opacity-50" style={{ background: "radial-gradient( circle at 50% 50%, #F5D0FE 0%, transparent 60% )" }}/>
      </div>
      <div className="bg-transparent text-darkblue p-6">
        <Navbar />
        <div className="max-w-4xl mx-auto mt-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Render the new components and pass props to them */}
            <WeightLogger 
              weight={weight} 
              setWeight={setWeight} 
              measuredAt={measuredAt} 
              setMeasuredAt={setMeasuredAt} 
              logWeight={logWeight} 
              loadingWeight={loadingWeight} 
              weightLogged={weightLogged} 
            />
            <ActivityLogger 
              activityType={activityType} 
              setActivityType={setActivityType} 
              steps={steps} 
              setSteps={setSteps} 
              duration={duration} 
              setDuration={setDuration} 
              logActivity={logActivity} 
              loadingActivity={loadingActivity} 
              activityLogged={activityLogged} 
            />
            <MealInput 
              meals={meals} 
              setMeals={setMeals} 
              calculateMacros={calculateMacros} 
              loadingMacros={loadingMacros} 
              mealsLogged={mealsLogged} 
            />
            <MacrosDisplay 
              macros={macros} 
              loadingMacros={loadingMacros} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;