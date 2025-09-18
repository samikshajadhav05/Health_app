// frontend/src/components/WeightLogger.tsx
import React from 'react';
import day from '../assets/day.svg';
import evening from '../assets/evening.svg';
import night from '../assets/night.svg';

// A simple component for the "Logged" badge
const LoggedBadge = ({ text }: { text: string }) => (
  <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100/80 text-green-800 border border-white/60">
    <span aria-hidden>✓</span> {text}
  </span>
);

interface WeightLoggerProps {
  weight: string;
  setWeight: (value: string) => void;
  measuredAt: string;
  setMeasuredAt: (value: string) => void;
  logWeight: () => void;
  loadingWeight: boolean;
  weightLogged: { value: number; measuredAt: string } | null;
}

const WeightLogger: React.FC<WeightLoggerProps> = ({
  weight,
  setWeight,
  measuredAt,
  setMeasuredAt,
  logWeight,
  loadingWeight,
  weightLogged,
}) => {
  return (
    <div className="group [perspective:1200px]">
      <div className="relative h-full flex flex-col rounded-[28px] p-6 bg-white/25 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.08)] transform-gpu transition-all duration-300 group-hover:-translate-y-2 group-hover:scale-[1.015] group-hover:shadow-[0_24px_60px_rgba(0,0,0,0.18)] [backface-visibility:hidden]">
        {loadingWeight && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FDE68A] via-[#FBCFE8] to-[#DDD6FE] animate-pulse rounded-t-[28px]" />
        )}
        <h2 className="text-center font-semibold text-[#6B21A8] text-lg mb-6">
          Today&apos;s Weight
          {weightLogged && <LoggedBadge text={`Logged: ${weightLogged.value}kg (${weightLogged.measuredAt})`} />}
        </h2>
        <div className="space-y-4">
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full p-3 rounded-2xl bg-white/50 border border-white/70 placeholder-[#6B7280] text-center focus:outline-none focus:ring-2 focus:ring-[#FDE68A]"
            placeholder="Enter weight"
          />
          <div>
            <label className="block text-[#6B21A8] mb-2 text-center mt-2">Measured When?</label>
            <div className="flex justify-center gap-6">
              <button onClick={() => setMeasuredAt("morning")} className={`rounded-xl p-1 hover:scale-[1.03] transition ${measuredAt === "morning" ? "ring-2 ring-[#FDE68A]" : ""}`}>
                <img src={day} alt="Morning" />
              </button>
              <button onClick={() => setMeasuredAt("evening")} className={`rounded-xl p-1 hover:scale-[1.03] transition ${measuredAt === "evening" ? "ring-2 ring-[#FDE68A]" : ""}`}>
                <img src={evening} alt="Evening" />
              </button>
              <button onClick={() => setMeasuredAt("night")} className={`rounded-xl p-1 hover:scale-[1.03] transition ${measuredAt === "night" ? "ring-2 ring-[#FDE68A]" : ""}`}>
                <img src={night} alt="Night" />
              </button>
            </div>
          </div>
          <button onClick={logWeight} className="relative w-full py-2.5 rounded-2xl font-semibold bg-gradient-to-r from-[#FDE68A] via-[#FBCFE8] to-[#DDD6FE] ring-1 ring-white/60 shadow-md hover:shadow-xl hover:brightness-[1.08] active:brightness-95 transition">
            <span className="text-[#3B0764] drop-shadow-[0_1px_0_rgba(255,255,255,0.7)]">
              {loadingWeight ? "Logging..." : "Log Weight"}
            </span>
            <span className="pointer-events-none absolute inset-0 rounded-2xl bg-white/10" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeightLogger;