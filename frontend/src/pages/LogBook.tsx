import React from 'react';
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { dailyLogService } from '../services/dailyLogService';

type WeightShape =
  | number
  | {
      value: number;
      measuredAt?: 'morning' | 'evening' | 'night' | string;
    };

// This interface now correctly expects a 'totals' object
interface DailyLog {
  date: string;
  weight?: WeightShape;
  activity?: {
    type: string;
    steps?: number;
    duration?: number;
  };
  totals?: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
    fiber: number;
  };
}

const renderWeight = (w?: WeightShape) => {
  if (w == null) return '-';
  if (typeof w === 'number') return `${w}kg`;
  if (typeof w === 'object' && typeof w.value === 'number') {
    return `${w.value}kg${w.measuredAt ? ` (${w.measuredAt})` : ''}`;
  }
  return '-';
};

const LogBook: React.FC = () => {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await dailyLogService.getLogs();

        // 1. Sort the data in descending order (newest first)
        const sortedData = (data || []).sort((a: DailyLog, b: DailyLog) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        // 2. Set the state with the sorted data
        setLogs(sortedData);

      } catch (err) {
        console.error('❌ Error fetching logs:', err);
      }
    };
    fetchLogs();
  }, []);

  // --- NEW: Helper function to format the date ---
  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // --- CSV EXPORT LOGIC (remains the same) ---
  const toPlainWeight = (w?: WeightShape) => {
    // ... (this function is unchanged)
  };
  const handleExportCSV = async () => {
    // ... (this function is unchanged)
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#FDE68A] via-[#FBCFE8] to-[#DDD6FE]">
      <div className="pointer-events-none absolute inset-0 -z-10">{/* Aura backgrounds */}</div>
      <div className="bg-transparent p-6">
        <Navbar />
        <div className="max-w-6xl mx-auto mt-10">
          <div className="rounded-[28px] p-4 md:p-5 bg-white/20 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
            <div className="overflow-x-auto">
              <table className="w-full text-center border-separate border-spacing-y-2 text-sm md:text-base">
                <thead>
                  <tr className="text-[#3B0764] font-semibold">
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Weight</th>
                    <th className="px-3 py-2">Activity</th>
                    <th className="px-3 py-2">Calories</th>
                    <th className="px-3 py-2">Carbs</th>
                    <th className="px-3 py-2">Protein</th>
                    <th className="px-3 py-2">Fats</th>
                    <th className="px-3 py-2">Fibre</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((entry, index) => (
                    <tr key={index} className="group transform-gpu transition-all duration-300 hover:-translate-y-1 hover:scale-[1.008] hover:drop-shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
                      <td className="px-3 py-2 first:rounded-l-xl bg-transparent group-hover:bg-white/40 transition-colors">
                        {/* Use the new formatDate function */}
                        {formatDate(entry.date)}
                      </td>
                      <td className="px-3 py-2 bg-transparent group-hover:bg-white/40 transition-colors">
                        {renderWeight(entry.weight)}
                      </td>
                      <td className="px-3 py-2 bg-transparent group-hover:bg-white/40 transition-colors">
                        {entry.activity?.type ? `${entry.activity.type} (${entry.activity.steps || 0} steps, ${entry.activity.duration || 0} min)` : '-'}
                      </td>
                      {/* CORRECTED: Access macros via entry.totals */}
                      <td className="px-3 py-2 bg-transparent group-hover:bg-white/40 transition-colors">{entry.totals?.calories || 0} kcal</td>
                      <td className="px-3 py-2 bg-transparent group-hover:bg-white/40 transition-colors">{entry.totals?.carbs || 0} g</td>
                      <td className="px-3 py-2 bg-transparent group-hover:bg-white/40 transition-colors">{entry.totals?.protein || 0} g</td>
                      <td className="px-3 py-2 bg-transparent group-hover:bg-white/40 transition-colors">{entry.totals?.fat || 0} g</td>
                      <td className="px-3 py-2 last:rounded-r-xl bg-transparent group-hover:bg-white/40 transition-colors">{entry.totals?.fiber || 0} g</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* ... (Export buttons remain the same) ... */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogBook;