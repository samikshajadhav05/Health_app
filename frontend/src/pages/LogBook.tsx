import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { dailyLogService } from "../services/dailyLogService";

type WeightShape =
  | number
  | {
      value: number;
      measuredAt?: "morning" | "evening" | "night" | string;
    };

interface DailyLog {
  date: string;
  weight?: WeightShape;
  activity?: {
    type: string;
    steps?: number;
    duration?: number;
  };
  macros?: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
    fiber: number;
  };
}

const renderWeight = (w?: WeightShape) => {
  if (w == null) return "-";
  if (typeof w === "number") return `${w}kg`;
  if (typeof w === "object" && typeof w.value === "number") {
    return `${w.value}kg${w.measuredAt ? ` (${w.measuredAt})` : ""}`;
  }
  return "-";
};

const LogBook: React.FC = () => {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await dailyLogService.getLogs();
        setLogs(data || []);
      } catch (err) {
        console.error("❌ Error fetching logs:", err);
      }
    };
    fetchLogs();
  }, []);

  const highlightRow = (calories: number | undefined) => {
    if (!calories) return "bg-white hover:bg-lightblue hover:bg-opacity-50";
    if (calories > 2500) return "bg-orange-100 hover:bg-orange-200";
    if (calories < 1200) return "bg-blue-100 hover:bg-blue-200";
    return "bg-white hover:bg-lightblue hover:bg-opacity-50";
  };

  // ---------- CSV EXPORT ----------
  const toPlainWeight = (w?: WeightShape) => {
    if (w == null) return { weight: "", measuredAt: "" };
    if (typeof w === "number") return { weight: String(w), measuredAt: "" };
    return { weight: String(w.value ?? ""), measuredAt: String(w.measuredAt ?? "") };
  };

  const escapeCsv = (val: any) => {
    const s = val == null ? "" : String(val);
    // Quote if contains comma, quote, or newline
    if (/[",\n]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const downloadCsv = (rows: string[][], filename: string) => {
    const csv = rows.map(r => r.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);

      // Columns (stable order)
      const headers = [
        "Date",
        "Weight (kg)",
        "Measured At",
        "Activity Type",
        "Steps",
        "Duration (min)",
        "Calories (kcal)",
        "Carbs (g)",
        "Protein (g)",
        "Fat (g)",
        "Fiber (g)",
      ];

      const rows: string[][] = [headers];

      (logs || []).forEach((entry) => {
        const { weight, measuredAt } = toPlainWeight(entry.weight);
        rows.push([
          entry.date || "",
          weight,
          measuredAt,
          entry.activity?.type || "",
          entry.activity?.steps != null ? String(entry.activity.steps) : "",
          entry.activity?.duration != null ? String(entry.activity.duration) : "",
          entry.macros?.calories != null ? String(entry.macros.calories) : "",
          entry.macros?.carbs != null ? String(entry.macros.carbs) : "",
          entry.macros?.protein != null ? String(entry.macros.protein) : "",
          entry.macros?.fat != null ? String(entry.macros.fat) : "",
          entry.macros?.fiber != null ? String(entry.macros.fiber) : "",
        ]);
      });

      const today = new Date().toISOString().slice(0, 10);
      downloadCsv(rows, `logbook_${today}.csv`);
    } catch (e) {
      console.error("CSV export failed:", e);
    } finally {
      setExporting(false);
    }
  };
  // --------------------------------

  return (
    <div className="min-h-screen bg-lightblue p-6">
      <Navbar />

      <div className="max-w-6xl mx-auto bg-white rounded-xl md:rounded-2xl p-3 md:p-4 mt-10 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-separate border-spacing-y-1 text-sm md:text-base">
            <thead>
              <tr className="font-bold text-gray-800">
                <th className="p-2">Date</th>
                <th className="p-2">Weight</th>
                <th className="p-2">Activity</th>
                <th className="p-2">Calories</th>
                <th className="p-2">Carbs</th>
                <th className="p-2">Protein</th>
                <th className="p-2">Fats</th>
                <th className="p-2">Fibre</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((entry, index) => (
                <tr
                  key={index}
                  className={`transition-colors duration-200 cursor-pointer ${highlightRow(
                    entry.macros?.calories
                  )}`}
                >
                  <td className="p-2 rounded-l-lg">{entry.date}</td>
                  <td className="p-2">{renderWeight(entry.weight)}</td>
                  <td className="p-2">
                    {entry.activity?.type
                      ? `${entry.activity.type} (${entry.activity.steps || 0} steps, ${
                          entry.activity.duration || 0
                        } min)`
                      : "-"}
                  </td>
                  <td className="p-2">{entry.macros?.calories || 0} kcal</td>
                  <td className="p-2">{entry.macros?.carbs || 0}g</td>
                  <td className="p-2">{entry.macros?.protein || 0}g</td>
                  <td className="p-2">{entry.macros?.fat || 0}g</td>
                  <td className="p-2 rounded-r-lg">{entry.macros?.fiber || 0}g</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white px-3 py-1.5 text-sm md:px-4 md:py-2 rounded-full shadow-md transition-all duration-200 disabled:opacity-60"
          >
            {exporting ? "Exporting..." : "Export as CSV ⬇️"}
          </button>

          <button
            className="bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white px-3 py-1.5 text-sm md:px-4 md:py-2 rounded-full shadow-md transition-all duration-200"
            // onClick={handleExportExcel} // Optional: see note below
            title="(Optional) We can wire this to Excel later"
          >
            View Trends 📈
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogBook;
