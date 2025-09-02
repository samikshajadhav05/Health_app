import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';
import { dailyLogService } from '../services/dailyLogService';
import { goalsService } from '../services/goalsService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ReferenceLine } from 'recharts';
import { LucideLoader } from 'lucide-react';

// Define data types
interface DailyLog {
  date: string;
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  weight?: { value: number };
  activity?: { duration: number };
}

const Trends: React.FC = () => {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [goals, setGoals] = useState<any>({}); // Simplified goals type
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Corrected function call from getGoal to getGoals
        const [logData, goalData] = await Promise.all([
          dailyLogService.getLogs(),
          goalsService.getGoals().catch(() => ({})), 
        ]);
        // Sort logs by date ascending for correct chart progression
        setLogs(logData.sort((a: DailyLog, b: DailyLog) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        setGoals(goalData);
      } catch (err) {
        setError('Failed to fetch trends data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  
  const chartData = useMemo(() => {
    // NOTE: Weekly and monthly aggregation logic would be needed for a full implementation
    return logs.map(log => ({
      date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      calories: log.totals.calories,
      protein: log.totals.protein,
      carbs: log.totals.carbs,
      fat: log.totals.fat,
      weight: log.weight?.value || null,
      activity: log.activity?.duration || null,
    }));
  }, [logs, timeRange]);

  const renderChart = (title: string, dataKey: string, color: string, goalValue?: number) => (
    <div className="bg-[#FEEFEF] p-4 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
      <h3 className="font-semibold text-[#007BFF] mb-4 text-lg">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
          {goalValue != null && <ReferenceLine y={goalValue} label="Goal" stroke="red" strokeDasharray="3 3" />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
  
  const renderMacrosChart = () => (
     <div className="bg-[#FEEFEF] p-4 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
      <h3 className="font-semibold text-[#007BFF] mb-4 text-lg">Macros Goal</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Legend />
            <Bar dataKey="protein" stackId="a" fill="#8884d8" name="Protein (g)" />
            <Bar dataKey="carbs" stackId="a" fill="#82ca9d" name="Carbs (g)" />
            <Bar dataKey="fat" stackId="a" fill="#ffc658" name="Fat (g)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div className="min-h-screen bg-lightblue p-4 md:p-6">
      <Navbar />
      <main className="max-w-7xl mx-auto mt-6 md:mt-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-3xl font-semibold text-[#067BC2]">Trends & Insights</h1>
          <div className="flex space-x-1 bg-white/50 p-1 rounded-full">
            {(['daily', 'weekly', 'monthly'] as const).map(range => (
              <button 
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${timeRange === range ? 'bg-gradient-to-r from-[#B1D5E5] to-[#F48C74] text-white shadow' : 'text-blue-700'}`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {isLoading && <div className="flex justify-center items-center h-64"><LucideLoader className="animate-spin text-blue-500" size={40} /></div>}
        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>}

        {!isLoading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderChart('Calories Intake', 'calories', '#8884d8', goals.macros?.calories?.max)}
            {renderMacrosChart()}
            {renderChart('Weight', 'weight', '#82ca9d', goals.goalWeight)}
            {renderChart('Activity Trend (minutes)', 'activity', '#ffc658')}
          </div>
        )}
      </main>
    </div>
  );
};

export default Trends;

