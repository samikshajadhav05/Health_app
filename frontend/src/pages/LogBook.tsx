import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { dailyLogService } from '../services/dailyLogService'; // Assuming this service exists
import { LucideLoader, LucideDownload } from 'lucide-react';

// Define the shape of the daily log data coming from the backend
interface DailyLog {
  id: string;
  date: string; // The backend should format this as YYYY-MM-DD
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

const LogBook: React.FC = () => {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        const data = await dailyLogService.getLogs();
        // Sort logs by date descending (most recent first)
        const sortedData = data.sort((a: DailyLog, b: DailyLog) => b.date.localeCompare(a.date));
        setLogs(sortedData);
      } catch (err) {
        setError('Failed to fetch your log book data.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <Navbar />
      <main className="max-w-5xl mx-auto mt-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Log Book</h1>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
            <LucideDownload size={18} className="mr-2" />
            Export
          </button>
        </div>
        
        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <LucideLoader className="animate-spin text-blue-500" size={40} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600">Date</th>
                    <th className="p-4 font-semibold text-gray-600">Calories (kcal)</th>
                    <th className="p-4 font-semibold text-gray-600">Protein (g)</th>
                    <th className="p-4 font-semibold text-gray-600">Carbs (g)</th>
                    <th className="p-4 font-semibold text-gray-600">Fats (g)</th>
                    <th className="p-4 font-semibold text-gray-600">Fiber (g)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.length > 0 ? (
                    logs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="p-4 whitespace-nowrap font-medium text-gray-800">{new Date(log.date).toLocaleDateString()}</td>
                        <td className="p-4 whitespace-nowrap text-gray-700">{log.totals.calories.toFixed(0)}</td>
                        <td className="p-4 whitespace-nowrap text-gray-700">{log.totals.protein.toFixed(1)}</td>
                        <td className="p-4 whitespace-nowrap text-gray-700">{log.totals.carbs.toFixed(1)}</td>
                        <td className="p-4 whitespace-nowrap text-gray-700">{log.totals.fat.toFixed(1)}</td>
                        <td className="p-4 whitespace-nowrap text-gray-700">{log.totals.fiber.toFixed(1)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-gray-500">
                        You haven't logged any nutritional data yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LogBook;
