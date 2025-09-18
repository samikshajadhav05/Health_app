// frontend/src/components/ActivityLogger.tsx
import React from 'react';

const LoggedBadge = ({ text }: { text: string }) => (
    <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100/80 text-green-800 border border-white/60">
      <span aria-hidden>✓</span> {text}
    </span>
);

interface ActivityLoggerProps {
  activityType: string;
  setActivityType: (value: string) => void;
  steps: string;
  setSteps: (value: string) => void;
  duration: string;
  setDuration: (value: string) => void;
  logActivity: () => void;
  loadingActivity: boolean;
  activityLogged: { type: string; steps?: number; duration?: number } | null;
}

const ActivityLogger: React.FC<ActivityLoggerProps> = ({
  activityType,
  setActivityType,
  steps,
  setSteps,
  duration,
  setDuration,
  logActivity,
  loadingActivity,
  activityLogged,
}) => {
  return (
    <div className="group [perspective:1200px]">
      <div className="relative h-full flex flex-col rounded-[28px] p-6 bg-white/25 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.08)] transform-gpu transition-all duration-300 group-hover:-translate-y-2 group-hover:scale-[1.015] group-hover:shadow-[0_24px_60px_rgba(0,0,0,0.18)] [backface-visibility:hidden]">
        {loadingActivity && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#DDD6FE] via-[#FBCFE8] to-[#FDE68A] animate-pulse rounded-t-[28px]" />
        )}
        <h2 className="text-center font-semibold text-[#6B21A8] text-lg mb-6">
          Activity
          {activityLogged && <LoggedBadge text={`Logged: ${activityLogged.type} (${activityLogged.steps || 0} steps, ${activityLogged.duration || 0} min)`} />}
        </h2>
        <div className="space-y-3">
          <select value={activityType} onChange={(e) => setActivityType(e.target.value)} className="w-full p-3 rounded-2xl bg-white/50 border border-white/70 text-center focus:outline-none focus:ring-2 focus:ring-[#DDD6FE]">
            <option value="">Select Activity</option>
            <option value="walking">Walking</option>
            <option value="running">Running</option>
            <option value="cycling">Cycling</option>
            <option value="gym">Gym</option>
          </select>
          <input type="number" value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="Steps" className="w-full p-3 rounded-2xl bg-white/50 border border-white/70 text-center focus:outline-none focus:ring-2 focus:ring-[#DDD6FE]" />
          <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Duration (minutes)" className="w-full p-3 rounded-2xl bg-white/50 border border-white/70 text-center focus:outline-none focus:ring-2 focus:ring-[#DDD6FE]" />
          <button onClick={logActivity} className="relative w-full py-2.5 rounded-2xl font-semibold bg-gradient-to-r from-[#DDD6FE] via-[#FBCFE8] to-[#FDE68A] ring-1 ring-white/60 shadow-md hover:shadow-xl hover:brightness-[1.08] active:brightness-95 transition">
            <span className="text-[#3B0764] drop-shadow-[0_1px_0_rgba(255,255,255,0.7)]">
              {loadingActivity ? "Logging..." : "Log Activity"}
            </span>
            <span className="pointer-events-none absolute inset-0 rounded-2xl bg-white/10" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogger;