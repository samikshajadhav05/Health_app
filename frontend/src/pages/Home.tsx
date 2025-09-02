import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import day from "../assets/day.svg";
import evening from "../assets/evening.svg";
import night from "../assets/night.svg";
import { dailyLogService } from "../services/dailyLogService";

type Macros = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

const getToday = () => new Date().toISOString().slice(0, 10);
const SUBMIT_STATE_KEY = "healthapp_submit_state_date";

const Home: React.FC = () => {
  // ✅ Weight logging
  const [weight, setWeight] = useState("");
  const [measuredAt, setMeasuredAt] = useState("");

  // ✅ Activity logging
  const [activityType, setActivityType] = useState("");
  const [steps, setSteps] = useState("");
  const [duration, setDuration] = useState("");

  // ✅ Meals + Macros
  const [meals, setMeals] = useState({
    breakfast: "",
    lunch: "",
    snacks: "",
    dinner: "",
  });
  const [macros, setMacros] = useState<Macros>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  });

  // ✅ Local loading states (section-specific)
  const [loadingWeight, setLoadingWeight] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [loadingMacros, setLoadingMacros] = useState(false);

  // ✅ “Logged today” flags (UI badges only; inputs remain editable)
  const [weightLogged, setWeightLogged] = useState<null | { value: number; measuredAt: string }>(null);
  const [activityLogged, setActivityLogged] = useState<null | { type: string; steps?: number; duration?: number }>(null);
  const [mealsLogged, setMealsLogged] = useState<boolean>(false);

  // ---- Bootstrap: reset flags if date changed, and pull today's log if present ----
  useEffect(() => {
    const today = getToday();
    const storedDate = localStorage.getItem(SUBMIT_STATE_KEY);

    // If day changed, clear local flags
    if (storedDate !== today) {
      localStorage.setItem(SUBMIT_STATE_KEY, today);
      localStorage.removeItem("weightLogged");
      localStorage.removeItem("activityLogged");
      localStorage.removeItem("mealsLogged");
    } else {
      // restore badges
      const w = localStorage.getItem("weightLogged");
      const a = localStorage.getItem("activityLogged");
      const m = localStorage.getItem("mealsLogged");
      if (w) setWeightLogged(JSON.parse(w));
      if (a) setActivityLogged(JSON.parse(a));
      if (m) setMealsLogged(m === "true");
    }

    // Pull today's log from backend to PREFILL inputs & set badges
    (async () => {
      try {
        const logs = await dailyLogService.getLogs();
        const todayLog = (logs || []).find((l: any) => l.date === today);
        if (todayLog) {
          if (todayLog.weight && typeof todayLog.weight === "object") {
            const saved = { value: todayLog.weight.value, measuredAt: todayLog.weight.measuredAt };
            setWeightLogged(saved);
            localStorage.setItem("weightLogged", JSON.stringify(saved));
            // prefill fields so user can SEE it's logged
            setWeight(String(todayLog.weight.value ?? ""));
            setMeasuredAt(todayLog.weight.measuredAt ?? "");
          }
          if (todayLog.activity && todayLog.activity.type) {
            const saved = {
              type: todayLog.activity.type,
              steps: todayLog.activity.steps || 0,
              duration: todayLog.activity.duration || 0,
            };
            setActivityLogged(saved);
            localStorage.setItem("activityLogged", JSON.stringify(saved));
            // prefill inputs
            setActivityType(saved.type);
            setSteps(String(saved.steps || ""));
            setDuration(String(saved.duration || ""));
          }
          if (todayLog.meals) {
            setMeals({
              breakfast: todayLog.meals.breakfast || "",
              lunch: todayLog.meals.lunch || "",
              snacks: todayLog.meals.snacks || "",
              dinner: todayLog.meals.dinner || "",
            });
          }
          if (todayLog.macros) {
            setMacros({
              calories: todayLog.macros.calories || 0,
              carbs: todayLog.macros.carbs || 0,
              protein: todayLog.macros.protein || 0,
              fat: todayLog.macros.fat || 0,
              fiber: todayLog.macros.fiber || 0,
            });
            setMealsLogged(true);
            localStorage.setItem("mealsLogged", "true");
          }
        } else {
          // no log for today -> clear prefilled inputs
          setWeight("");
          setMeasuredAt("");
          setActivityType("");
          setSteps("");
          setDuration("");
          setMeals({ breakfast: "", lunch: "", snacks: "", dinner: "" });
          setMacros({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
          setWeightLogged(null);
          setActivityLogged(null);
          setMealsLogged(false);
        }
      } catch (err) {
        console.error("Error loading today's log:", err);
      }
    })();
  }, []);

  // ---------------- Weight Logging ----------------
  const logWeight = async () => {
    if (!measuredAt) {
      console.error("Please choose when you measured (morning/evening/night).");
      return;
    }
    try {
      setLoadingWeight(true);
      const res = await dailyLogService.logWeight({
        weight: Number(weight),
        measuredAt,
      });
      // reflect badge (and keep values visible in inputs)
      const val =
        res?.weight?.value ??
        (typeof res?.weight === "object" ? res?.weight?.value : Number(weight));
      const when =
        res?.weight?.measuredAt ??
        (typeof res?.weight === "object" ? res?.weight?.measuredAt : measuredAt);
      const saved = { value: val, measuredAt: when };
      setWeightLogged(saved);
      localStorage.setItem("weightLogged", JSON.stringify(saved));
    } catch (err) {
      console.error("Error logging weight:", err);
    } finally {
      setLoadingWeight(false);
    }
  };

  // ---------------- Activity Logging ----------------
  const logActivity = async () => {
    try {
      setLoadingActivity(true);
      await dailyLogService.logActivity({
        type: activityType,
        steps: Number(steps),
        duration: Number(duration),
      });
      const saved = {
        type: activityType,
        steps: Number(steps) || 0,
        duration: Number(duration) || 0,
      };
      setActivityLogged(saved);
      localStorage.setItem("activityLogged", JSON.stringify(saved));
    } catch (err) {
      console.error("Error logging activity:", err);
    } finally {
      setLoadingActivity(false);
    }
  };

  // ---------------- Macro Calculation ----------------
  const calculateMacros = async () => {
    try {
      setLoadingMacros(true);
      // omit empty strings so backend doesn't overwrite prior meals with blanks
      const preparedMeals: Record<string, string> = {};
      (Object.keys(meals) as Array<keyof typeof meals>).forEach((k) => {
        const val = meals[k];
        if (typeof val === "string" && val.trim().length > 0) {
          preparedMeals[k] = val.trim();
        }
      });

      const data = await dailyLogService.calculateMacros(preparedMeals);
      if (data?.macros) {
        setMacros({
          calories: data.macros.calories || 0,
          carbs: data.macros.carbs || 0,
          protein: data.macros.protein || 0,
          fat: data.macros.fat || 0,
          fiber: data.macros.fiber || 0,
        });
        setMealsLogged(true);
        localStorage.setItem("mealsLogged", "true");
      }
    } catch (err) {
      console.error("Error calculating macros:", err);
    } finally {
      setLoadingMacros(false);
    }
  };

  const LoggedBadge = ({ text }: { text: string }) => (
    <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      <span aria-hidden>✓</span> {text}
    </span>
  );

  return (
    <div className="min-h-screen bg-lightblue text-darkblue p-6">
      <Navbar />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-10">
        {/* ✅ Today’s Weight Section */}
        <div className="bg-white p-6 rounded-[30px] shadow-md relative">
          {/* Inline loading bar for Weight */}
          {loadingWeight && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600 animate-pulse rounded-t-[30px]" />
          )}
          <h2 className="text-blue text-center font-bold text-xl mb-6">
            Today's Weight
            {weightLogged && <LoggedBadge text={`Logged: ${weightLogged.value}kg (${weightLogged.measuredAt})`} />}
          </h2>
          <div className="space-y-4">
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full p-3 rounded-[30px] bg-gradient-to-r from-[#F37748] to-[#ECC30B] focus:outline-none focus:ring-2 focus:ring-white text-center placeholder-white"
              placeholder="Enter weight"
            />
            <div>
              <label className="block text-blue mb-2 text-center mt-6">
                Measured When?
              </label>
              <div className="flex flex-row justify-center gap-4 items-center">
                <button onClick={() => setMeasuredAt("morning")}>
                  <img src={day} alt="Morning" />
                </button>
                <button onClick={() => setMeasuredAt("evening")}>
                  <img src={evening} alt="Evening" />
                </button>
                <button onClick={() => setMeasuredAt("night")}>
                  <img src={night} alt="Night" />
                </button>
              </div>
            </div>
            <button
              onClick={logWeight}
              className="w-full bg-orange hover:bg-yellow text-white py-2 px-4 rounded-[30px] font-medium transition-colors duration-200"
            >
              {loadingWeight ? "Logging..." : "Log Weight"}
            </button>
          </div>
        </div>

        {/* ✅ Activity Section */}
        <div className="bg-white p-6 rounded-[30px] shadow-md relative">
          {/* Inline loading bar for Activity */}
          {loadingActivity && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-pink-500 animate-pulse rounded-t-[30px]" />
          )}
          <h2 className="text-blue text-center font-bold text-xl mb-6">
            Activity
            {activityLogged && (
              <LoggedBadge
                text={`Logged: ${activityLogged.type} (${activityLogged.steps || 0} steps, ${activityLogged.duration || 0} min)`}
              />
            )}
          </h2>
          <div className="space-y-3">
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="w-full p-3 rounded-[30px] bg-gradient-to-r from-[#84BCDA] to-[#F37748] focus:outline-none text-center"
            >
              <option value="">Select Activity</option>
              <option value="walking">Walking</option>
              <option value="running">Running</option>
              <option value="cycling">Cycling</option>
              <option value="gym">Gym</option>
            </select>

            <input
              type="number"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder="Steps"
              className="w-full p-3 rounded-[30px] bg-gradient-to-r from-[#84BCDA] to-[#F37748] text-center placeholder-white"
            />

            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Duration (minutes)"
              className="w-full p-3 rounded-[30px] bg-gradient-to-r from-[#84BCDA] to-[#F37748] text-center placeholder-white"
            />

            <button
              onClick={logActivity}
              className="w-full bg-orange hover:bg-yellow text-white py-2 px-4 rounded-[30px] font-medium transition-colors duration-200"
            >
              {loadingActivity ? "Logging..." : "Log Activity"}
            </button>
          </div>
        </div>

        {/* ✅ Meals Section */}
        <div className="bg-white p-6 rounded-[30px] shadow-md">
          <h2 className="text-blue text-center font-bold text-xl mb-6">
            Meals
            {mealsLogged && <LoggedBadge text="Logged for today" />}
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {Object.keys(meals).map((mealKey) => (
              <div key={mealKey} className="relative">
                <input
                  type="text"
                  value={(meals as any)[mealKey]}
                  onChange={(e) => setMeals({ ...meals, [mealKey]: e.target.value })}
                  className="w-full bg-lightblue hover:bg-midblue text-darkblue hover:text-white py-2 px-4 rounded-[30px] transition-colors duration-200 border-none focus:ring-2 focus:ring-white focus:outline-none text-center placeholder-white"
                  placeholder={`Enter ${mealKey}`}
                />
              </div>
            ))}
          </div>
          <button
            onClick={calculateMacros}
            className="w-full bg-orange hover:bg-yellow text-white py-2 px-4 rounded-[30px] font-medium transition-colors duration-200"
          >
            {loadingMacros ? "Calculating..." : "Calculate Macros"}
          </button>
        </div>

        {/* ✅ Macros Section */}
        <div className="bg-white p-6 rounded-[30px] shadow-md relative">
          {/* Inline loading bar for Macros */}
          {loadingMacros && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-blue-500 animate-pulse rounded-t-[30px]" />
          )}
          <h2 className="text-blue text-center font-bold text-xl mb-6">Macros</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody className="divide-y divide-lightblue">
                <tr>
                  <td className="py-2">Calories: {macros.calories}</td>
                </tr>
                <tr>
                  <td className="py-2">Protein: {macros.protein} g</td>
                </tr>
                <tr>
                  <td className="py-2">Carbs: {macros.carbs} g</td>
                </tr>
                <tr>
                  <td className="py-2">Fat: {macros.fat} g</td>
                </tr>
                <tr>
                  <td className="py-2">Fiber: {macros.fiber} g</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
