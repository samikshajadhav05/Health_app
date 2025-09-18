// src/components/meal-planner/DailyTotals.tsx
import React from 'react';

interface Totals {
  calories: number;
  carbs: number;
  protein: number;
  fibre: number;
}

interface DailyTotalsProps {
  totals: Totals;
}

const DailyTotals: React.FC<DailyTotalsProps> = ({ totals }) => {
  return (
    <div className="mt-6 bg-white/50 rounded-2xl p-4 text-[#3B0764] border border-white/70">
      <h3 className="font-semibold mb-2">Daily Totals</h3>
      <p>Calories: {totals.calories} kcal</p>
      <p>Carbs: {totals.carbs} g</p>
      <p>Protein: {totals.protein} g</p>
      <p>Fibre: {totals.fibre} g</p>
    </div>
  );
};

export default DailyTotals;