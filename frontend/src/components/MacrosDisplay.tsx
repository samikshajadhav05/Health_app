// frontend/src/components/MacrosDisplay.tsx
import React from 'react';

interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface MacrosDisplayProps {
  macros: Macros;
  loadingMacros: boolean;
}

const MacrosDisplay: React.FC<MacrosDisplayProps> = ({ macros, loadingMacros }) => {
  return (
    <div className="group [perspective:1200px]">
      <div className="relative h-full flex flex-col rounded-[28px] p-6 bg-white/25 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.08)] transform-gpu transition-all duration-300 group-hover:-translate-y-2 group-hover:scale-[1.015] group-hover:shadow-[0_24px_60px_rgba(0,0,0,0.18)] [backface-visibility:hidden]">
        {loadingMacros && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FBCFE8] via-[#FDE68A] to-[#DDD6FE] animate-pulse rounded-t-[28px]" />
        )}
        <h2 className="text-center font-semibold text-[#6B21A8] text-lg mb-4">Macros</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-[#1F2937]">
            <tbody className="divide-y divide-white/60">
              <tr><td className="py-2">Calories: <span className="font-medium">{macros.calories}</span></td></tr>
              <tr><td className="py-2">Protein: <span className="font-medium">{macros.protein} g</span></td></tr>
              <tr><td className="py-2">Carbs: <span className="font-medium">{macros.carbs} g</span></td></tr>
              <tr><td className="py-2">Fat: <span className="font-medium">{macros.fat} g</span></td></tr>
              <tr><td className="py-2">Fiber: <span className="font-medium">{macros.fiber} g</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MacrosDisplay;