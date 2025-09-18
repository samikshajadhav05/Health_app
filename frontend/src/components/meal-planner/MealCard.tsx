// src/components/meal-planner/MealCard.tsx
import React from 'react';

// It's good practice to move these types to a central types.ts file
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
interface MealCardData {
  name: string;
  macros: { calories: number; carbs: number; protein: number; fibre: number };
}

interface MealCardProps {
  title: string;
  mealType: MealType;
  cardData: MealCardData;
  onGenerate: (mealType: MealType) => void;
  onManual: (mealType: MealType) => void;
  onLog: () => void;
  onBack: (mealType: MealType) => void;
}

const Button: React.FC<{ onClick: () => void; text: string; className?: string; gradient?: boolean }> = ({ onClick, text, className = "", gradient = true }) => (
    <button
      onClick={onClick}
      className={`relative w-full py-2.5 rounded-2xl font-semibold ring-1 ring-white/60 shadow-md hover:shadow-xl hover:brightness-[1.08] active:brightness-95 transition ${
        gradient ? "bg-gradient-to-r from-[#FDE68A] via-[#FBCFE8] to-[#DDD6FE]" : "bg-gray-300 hover:bg-gray-400 text-[#3B0764]"
      } ${className}`}
    >
      <span className="drop-shadow-[0_1px_0_rgba(255,255,255,0.7)] text-[#3B0764]">
        {text}
      </span>
      {gradient && <span className="pointer-events-none absolute inset-0 rounded-2xl bg-white/10" />}
    </button>
  );

const MealCard: React.FC<MealCardProps> = ({ title, mealType, cardData, onGenerate, onManual, onLog, onBack }) => {
  const { name, macros } = cardData;

  return (
    <div className="group [perspective:1200px]">
      <div
        className="relative h-full flex flex-col rounded-[28px] p-6 bg-white/25 backdrop-blur-xl border border-white/60
                   shadow-[0_8px_30px_rgba(0,0,0,0.08)] transform-gpu transition-all duration-300
                   group-hover:-translate-y-2 group-hover:scale-[1.015] group-hover:shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
      >
        <h2 className="text-center font-semibold text-[#6B21A8] text-lg mb-6">{title}</h2>

        {name === "—" ? (
          <div className="space-y-4">
            <Button onClick={() => onGenerate(mealType)} text="Generate from pantry" />
            <Button onClick={() => onManual(mealType)} text="Manually enter meal" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/50 rounded-2xl p-4 border border-white/70">
                <h3 className="font-semibold text-[#3B0764] mb-2">Meal</h3>
                <p className="text-[#3B0764] text-sm">{name}</p>
              </div>
              <div className="bg-white/50 rounded-2xl p-4 border border-white/70">
                <h3 className="font-semibold text-[#3B0764] mb-2">Macros</h3>
                <p className="text-[#3B0764] text-sm">Calories: {macros.calories} kcal</p>
                <p className="text-[#3B0764] text-sm">Carbs: {macros.carbs} g</p>
                <p className="text-[#3B0764] text-sm">Protein: {macros.protein} g</p>
                <p className="text-[#3B0764] text-sm">Fibre: {macros.fibre} g</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={onLog} text={`Log as today’s ${title}`} className="flex-1" />
              <button
                onClick={() => onBack(mealType)}
                className="flex-1 py-2.5 rounded-2xl font-semibold bg-gray-300 hover:bg-gray-400 text-black shadow-md transition"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealCard;