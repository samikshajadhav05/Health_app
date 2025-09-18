// frontend/src/components/MealInput.tsx
import React from 'react';

const LoggedBadge = ({ text }: { text: string }) => (
    <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100/80 text-green-800 border border-white/60">
      <span aria-hidden>✓</span> {text}
    </span>
);

interface MealInputProps {
  meals: { breakfast: string; lunch: string; snacks: string; dinner: string };
  setMeals: (meals: { breakfast: string; lunch: string; snacks: string; dinner: string }) => void;
  calculateMacros: () => void;
  loadingMacros: boolean;
  mealsLogged: boolean;
}

const MealInput: React.FC<MealInputProps> = ({
  meals,
  setMeals,
  calculateMacros,
  loadingMacros,
  mealsLogged,
}) => {
  return (
    <div className="group [perspective:1200px]">
      <div className="h-full flex flex-col rounded-[28px] p-6 bg-white/25 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.08)] transform-gpu transition-all duration-300 group-hover:-translate-y-2 group-hover:scale-[1.015] group-hover:shadow-[0_24px_60px_rgba(0,0,0,0.18)] [backface-visibility:hidden]">
        <h2 className="text-center font-semibold text-[#6B21A8] text-lg mb-5">
          Meals
          {mealsLogged && <LoggedBadge text="Logged for today" />}
        </h2>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {Object.keys(meals).map((mealKey) => (
            <div key={mealKey} className="relative">
              <input
                type="text"
                value={(meals as any)[mealKey]}
                onChange={(e) => setMeals({ ...meals, [mealKey]: e.target.value })}
                className="w-full bg-white/50 border border-white/70 text-[#1F2937] py-2.5 px-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FBCFE8] text-center placeholder-[#9CA3AF]"
                placeholder={`Enter ${mealKey}`}
              />
            </div>
          ))}
        </div>
        <button onClick={calculateMacros} className="relative w-full py-2.5 rounded-2xl font-semibold bg-gradient-to-r from-[#FBCFE8] via-[#FDE68A] to-[#DDD6FE] ring-1 ring-white/60 shadow-md hover:shadow-xl hover:brightness-[1.08] active:brightness-95 transition">
          <span className="text-[#3B0764] drop-shadow-[0_1px_0_rgba(255,255,255,0.7)]">
            {loadingMacros ? "Calculating..." : "Calculate Macros"}
          </span>
          <span className="pointer-events-none absolute inset-0 rounded-2xl bg-white/10" />
        </button>
      </div>
    </div>
  );
};

export default MealInput;