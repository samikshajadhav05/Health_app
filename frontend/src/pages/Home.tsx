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

const Home: React.FC = () => {
  // State for each input field
  const [weight, setWeight] = useState("");
  const [measuredAt, setMeasuredAt] = useState("");
  const [activityType, setActivityType] = useState("");
  const [steps, setSteps] = useState("");
  const [duration, setDuration] = useState("");
  const [meals, setMeals] = useState({
    breakfast: "",
    lunch: "",
    snacks: "",
    dinner: "",
  });
  const [macros, setMacros] = useState<Macros | null>(null);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch today's log on component mount
  useEffect(() => {
    const fetchTodayLog = async () => {
      try {
        const today = getToday();
        const logs = await dailyLogService.getLogs();
        const todayLog = logs.find((l: any) => l.date === today);

        if (todayLog) {
          // Pre-fill fields if data for today exists
          if (todayLog.weight) {
            setWeight(String(todayLog.weight.value || ""));
            setMeasuredAt(todayLog.weight.measuredAt || "");
          }
          if (todayLog.activity) {
            setActivityType(todayLog.activity.type || "");
            setSteps(String(todayLog.activity.steps || ""));
            setDuration(String(todayLog.activity.duration || ""));
          }
           if (todayLog.meals) {
            setMeals(todayLog.meals)
          }
          if (todayLog.macros) {
            setMacros(todayLog.macros);
          }
        }
      } catch (err) {
        setError("Could not load today's data.");
      } finally {
        setLoading(false);
      }
    };
    fetchTodayLog();
  }, []);

  // --- Event Handlers ---

  const handleLogWeight = async () => {
    if (!weight || !measuredAt) {
      alert("Please enter both weight and when it was measured.");
      return;
    }
    try {
      await dailyLogService.logWeight({
        weight: Number(weight),
        measuredAt,
      });
      alert("Weight logged successfully!");
    } catch (err) {
      alert("Failed to log weight. Please try again.");
    }
  };

  const handleLogActivity = async () => {
    if (!activityType) {
      alert("Please select an activity type.");
      return;
    }
    try {
      await dailyLogService.logActivity({
        type: activityType,
        steps: Number(steps) || 0,
        duration: Number(duration) || 0,
      });
      alert("Activity logged successfully!");
    } catch (err) {
      alert("Failed to log activity. Please try again.");
    }
  };

  const handleCalculateMacros = async () => {
    try {
        const filledMeals = Object.fromEntries(
            Object.entries(meals).filter(([, value]) => value.trim() !== '')
        );

        if (Object.keys(filledMeals).length === 0) {
            alert("Please enter at least one meal to calculate macros.");
            return;
        }

      const result = await dailyLogService.calculateMacros(filledMeals);
      setMacros(result.macros);
      alert("Macros calculated successfully!");
    } catch (err) {
      alert("Failed to calculate macros. Please try again.");
    }
  };

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  // Your existing JSX structure with functional handlers
  return (
    <div className="min-h-screen bg-lightblue text-darkblue p-6">
      <Navbar />
      {error && <div className="max-w-4xl mx-auto mt-4 bg-red-100 text-red-700 p-3 rounded-lg text-center">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-10">
        {/* Today’s Weight Section */}
        <div className="bg-white p-6 rounded-[30px] shadow-md">
          <h2 className="text-blue text-center font-bold text-xl mb-6">
            Today's Weight
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
                 {/* Adding active state for buttons */}
                <button onClick={() => setMeasuredAt("morning")} className={`p-2 rounded-full ${measuredAt === 'morning' ? 'bg-yellow-200 ring-2 ring-yellow-400' : ''}`}>
                  <img src={day} alt="Morning" />
                </button>
                <button onClick={() => setMeasuredAt("evening")} className={`p-2 rounded-full ${measuredAt === 'evening' ? 'bg-orange-200 ring-2 ring-orange-400' : ''}`}>
                  <img src={evening} alt="Evening" />
                </button>
                <button onClick={() => setMeasuredAt("night")} className={`p-2 rounded-full ${measuredAt === 'night' ? 'bg-blue-200 ring-2 ring-blue-400' : ''}`}>
                  <img src={night} alt="Night" />
                </button>
              </div>
            </div>
            <button
              onClick={handleLogWeight}
              className="w-full bg-orange hover:bg-yellow text-white py-2 px-4 rounded-[30px] font-medium transition-colors duration-200"
            >
              Log Weight
            </button>
          </div>
        </div>

        {/* Activity Section */}
        <div className="bg-white p-6 rounded-[30px] shadow-md">
          <h2 className="text-blue text-center font-bold text-xl mb-6">
            Activity
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
              onClick={handleLogActivity}
              className="w-full bg-orange hover:bg-yellow text-white py-2 px-4 rounded-[30px] font-medium transition-colors duration-200"
            >
              Log Activity
            </button>
          </div>
        </div>

        {/* Meals Section */}
        <div className="bg-white p-6 rounded-[30px] shadow-md">
          <h2 className="text-blue text-center font-bold text-xl mb-6">
            Meals
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
            onClick={handleCalculateMacros}
            className="w-full bg-orange hover:bg-yellow text-white py-2 px-4 rounded-[30px] font-medium transition-colors duration-200"
          >
            Calculate Macros
          </button>
        </div>

        {/* Macros Section */}
        <div className="bg-white p-6 rounded-[30px] shadow-md">
          <h2 className="text-blue text-center font-bold text-xl mb-6">Macros</h2>
          <div className="overflow-x-auto">
            {macros ? (
              <table className="w-full">
                <tbody className="divide-y divide-lightblue">
                  <tr><td className="py-2">Calories: {macros.calories.toFixed(0)}</td></tr>
                  <tr><td className="py-2">Protein: {macros.protein.toFixed(1)} g</td></tr>
                  <tr><td className="py-2">Carbs: {macros.carbs.toFixed(1)} g</td></tr>
                  <tr><td className="py-2">Fat: {macros.fat.toFixed(1)} g</td></tr>
                  <tr><td className="py-2">Fiber: {macros.fiber.toFixed(1)} g</td></tr>
                </tbody>
              </table>
            ) : (
                <p className="text-center text-gray-500">Calculate macros to see your daily summary.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
