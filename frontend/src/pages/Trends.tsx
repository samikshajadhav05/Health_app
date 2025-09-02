import React, { useEffect, useMemo,  useState } from "react";
import Navbar from "../components/Navbar";
import { dailyLogService } from "../services/dailyLogService";
import { goalsService } from "../services/goalsService";
import {
  ResponsiveContainer,
  LineChart as RLineChart,
  Line,
  BarChart as RBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/**
 * Keeps your palette & rounding:
 * Blue(#067BC2) Orange(#F37748) Yellow(#ECC30B) LightBlue(#84BCDA) Indigo(#4F46E5) BG(#FEEFEF)
 * Cards: rounded-2xl, soft borders, subtle shadows.
 */

// ---------- Types ----------
type Log = {
  date: string; // YYYY-MM-DD
  weight?: { value: number; measuredAt?: string } | number;
  activity?: { type: string; steps?: number; duration?: number };
  macros?: { calories: number; carbs: number; protein: number; fat: number; fiber: number };
};

type Goals = {
  stepsTarget?: number;
  workoutType?: string;
  workoutDuration?: number;
  macros?: { calories?: number; carbs?: number; protein?: number; fat?: number; fiber?: number };
  streak?: number;
  currentWeight?: number;
  goalWeight?: number;
};

// ---------- Helpers ----------
const toNumber = (v: any): number => (typeof v === "number" ? v : Number(v) || 0);
const formatDateShort = (iso: string) => iso.slice(5).replace("-", "/"); // MM/DD

const movingAvg = (arr: number[], window = 7) => {
  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
    if (i >= window) sum -= arr[i - window];
    out.push(i >= window - 1 ? sum / window : NaN);
  }
  return out;
};

const avg = (arr: number[]) => {
  const vals = arr.filter((v) => Number.isFinite(v));
  if (!vals.length) return 0;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
};

// ---------- Reusable UI ----------
const PageHeader: React.FC<{ title: string; subtitle?: string; right?: React.ReactNode }> = ({
  title,
  subtitle,
  right,
}) => (
  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
    <div>
      <h1 className="text-xl md:text-2xl font-semibold text-[#067BC2]">{title}</h1>
      {subtitle && <p className="text-sm md:text-base text-blue-700/80">{subtitle}</p>}
    </div>
    {right}
  </div>
);

const Card: React.FC<{
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
  right?: React.ReactNode;
}> = ({ title, subtitle, children, className = "", right }) => (
  <section className={`bg-[#FEEFEF] rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow ${className}`}>
    {(title || right) && (
      <div className="flex items-center justify-between mb-3">
        <div>
          {title && <h2 className="text-[#007BFF] font-semibold text-base md:text-lg">{title}</h2>}
          {subtitle && <div className="text-[11px] md:text-xs text-blue-500">{subtitle}</div>}
        </div>
        {right}
      </div>
    )}
    {children}
  </section>
);

const Stat: React.FC<{ label: string; value: string | number; foot?: string }> = ({ label, value, foot }) => (
  <div className="bg-white border border-[#B1D5E5] rounded-2xl px-4 py-3 text-center">
    <div className="text-xs md:text-sm text-blue-700">{label}</div>
    <div className="text-lg md:text-2xl font-semibold text-[#067BC2]">{value}</div>
    {foot && <div className="text-[11px] md:text-xs text-blue-700/70">{foot}</div>}
  </div>
);

const ButtonChip: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }
> = ({ active, className = "", ...props }) => (
  <button
    {...props}
    className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-[#B1D5E5] 
      ${active ? "bg-gradient-to-r from-[#B1D5E5] to-[#F48C74] text-white shadow" : "bg-white border border-[#B1D5E5] text-blue-700"} ${className}`}
  />
);

// ---------- Main ----------
const Trends: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [goals, setGoals] = useState<Goals | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [macroMetric, setMacroMetric] = useState<"calories" | "protein" | "carbs" | "fat" | "fiber">("calories");

  useEffect(() => {
    (async () => {
      try {
        const [l, g] = await Promise.all([dailyLogService.getLogs(), goalsService.getGoals()]);
        setLogs(Array.isArray(l) ? l : []);
        setGoals(g || null);
      } catch (e) {
        console.error("Trends load error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const clampByRange = (arr: any[]) => {
    if (range === "all") return arr;
    const n = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    return arr.slice(-n);
  };

  const series = useMemo(() => {
    const byDate = [...logs].sort((a, b) => a.date.localeCompare(b.date));

    const dates = byDate.map((d) => d.date);
    const weights = byDate.map((d) => (typeof d.weight === "number" ? d.weight : d.weight?.value ?? NaN));
    const duration = byDate.map((d) => toNumber(d.activity?.duration));
    const calories = byDate.map((d) => toNumber(d.macros?.calories));
    const protein = byDate.map((d) => toNumber(d.macros?.protein));
    const carbs = byDate.map((d) => toNumber(d.macros?.carbs));
    const fat = byDate.map((d) => toNumber(d.macros?.fat));
    const fiber = byDate.map((d) => toNumber(d.macros?.fiber));

    const datesC = clampByRange(dates);
    const weightsC = clampByRange(weights);
    const durationC = clampByRange(duration);
    const caloriesC = clampByRange(calories);
    const proteinC = clampByRange(protein);
    const carbsC = clampByRange(carbs);
    const fatC = clampByRange(fat);
    const fiberC = clampByRange(fiber);

    const labels = datesC.map(formatDateShort);
    const weightMA7 = movingAvg(weightsC, 7);

    const weightDelta = (() => {
      const vals = weightsC.filter((v) => Number.isFinite(v));
      if (vals.length < 2) return 0;
      return Math.round((vals[vals.length - 1] - vals[0]) * 10) / 10;
    })();

    const kcalAvg = Math.round(avg(caloriesC));
    const activeMinAvg = Math.round(avg(durationC));

    const avgProtein = avg(proteinC);
    const avgCarbs = avg(carbsC);
    const avgFat = avg(fatC);
    const kcalSplit = [
      { name: "Protein", value: avgProtein * 4 },
      { name: "Carbs", value: avgCarbs * 4 },
      { name: "Fat", value: avgFat * 9 },
    ];

    // build recharts datasets
    const lineWeightData = labels.map((l, i) => ({
      label: l,
      weight: weightsC[i],
      ma7: weightMA7[i],
    }));

    const barMacroData = labels.map((l, i) => ({
      label: l,
      calories: caloriesC[i],
      protein: proteinC[i],
      carbs: carbsC[i],
      fat: fatC[i],
      fiber: fiberC[i],
    }));

    const lineMinutesData = labels.map((l, i) => ({
      label: l,
      minutes: durationC[i],
    }));

    return {
      labels,
      lineWeightData,
      barMacroData,
      lineMinutesData,
      kcalSplit,
      kpis: { weightDelta, kcalAvg, activeMinAvg, days: labels.length },
    };
  }, [logs, goals, range]);

  const macroGoalValue = goals?.macros?.[macroMetric] ?? undefined;

  // Loading & empty
  if (loading) {
    return (
      <div className="min-h-screen bg-lightblue p-4 md:p-6">
        <Navbar />
        <div className="max-w-7xl mx-auto mt-6 md:mt-10 space-y-4">
          <div className="h-8 w-64 bg-white/60 rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-white/60 rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-white/60 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!logs.length) {
    return (
      <div className="min-h-screen bg-lightblue p-4 md:p-6">
        <Navbar />
        <div className="max-w-4xl mx-auto mt-10 bg-white rounded-2xl p-8 text-center">
          <h2 className="text-[#067BC2] font-semibold text-lg">No data yet</h2>
          <p className="text-blue-700/80 mt-2">Log your weight, activity, and meals to see trends here.</p>
        </div>
      </div>
    );
  }

  const macroBarColor =
    macroMetric === "protein"
      ? "#F48C74"
      : macroMetric === "carbs"
      ? "#84BCDA"
      : macroMetric === "fat"
      ? "#ECC30B"
      : macroMetric === "fiber"
      ? "#4F46E5"
      : "#84BCDA";

  const donutColors = ["#067BC2", "#F37748", "#ECC30B"];

  // Custom tooltip styles (subtle, matches palette)
  const tooltipStyle = {
    background: "white",
    border: "1px solid #B1D5E5",
    borderRadius: "12px",
    fontSize: "12px",
    padding: "8px",
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-lightblue p-4 md:p-6">
      <Navbar />

      <main className="max-w-7xl mx-auto mt-6 md:mt-10 space-y-6 md:space-y-8">
        {/* Header + Filters */}
        <PageHeader
          title="Trends & Insights"
          subtitle="Visualize your progress and goal adherence over time."
          right={
            <div className="flex items-center gap-2">
              {(["7d", "30d", "90d", "all"] as const).map((r) => (
                <ButtonChip key={r} active={range === r} onClick={() => setRange(r)} aria-pressed={range === r}>
                  {r.toUpperCase()}
                </ButtonChip>
              ))}
            </div>
          }
        />

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Stat label="Days in View" value={series.kpis.days} />
          <Stat label="Weight Δ" value={`${series.kpis.weightDelta >= 0 ? "+" : ""}${series.kpis.weightDelta} kg`} foot="(first → last)" />
          <Stat label="Avg Calories" value={`${series.kpis.kcalAvg} kcal`} />
          <Stat label="Avg Active Minutes" value={`${series.kpis.activeMinAvg} min`} />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Weight Trend */}
          <Card title="Weight Trend" subtitle="7‑day moving average overlay">
            <div className="h-64 w-full">
              <ResponsiveContainer>
                <RLineChart data={series.lineWeightData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#E6F2F8" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#2563eb" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#2563eb" }} width={40} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="weight" stroke="#067BC2" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="ma7" stroke="#F37748" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                </RLineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Macro Split Donut */}
          <Card title="Average Daily Macro Energy Split" subtitle="Protein / Carbs / Fat → kcal">
            <div className="flex flex-col md:flex-row items-center md:items-stretch gap-4">
              <div className="h-64 w-full md:w-1/2">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={series.kcalSplit}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="60%"
                      outerRadius="85%"
                      paddingAngle={2}
                    >
                      {series.kcalSplit.map((_, i) => (
                        <Cell key={`c-${i}`} fill={donutColors[i % donutColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${Math.round(v as number)} kcal`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-2 md:gap-4 text-xs md:text-sm w-full md:w-1/2">
                {series.kcalSplit.map((p, i) => (
                  <div key={i} className="bg-white border border-[#B1D5E5] rounded-2xl px-3 md:px-4 py-2 md:py-3 text-center">
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-blue-700">{Math.round(p.value)} kcal/day</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Macros vs Goals (full-width) */}
          <Card
            title="Macros vs Goals"
            right={
              <div className="flex gap-2 overflow-x-auto no-scrollbar px-1">
                {(["calories", "protein", "carbs", "fat", "fiber"] as const).map((m) => (
                  <ButtonChip key={m} active={macroMetric === m} onClick={() => setMacroMetric(m)} aria-pressed={macroMetric === m}>
                    {m[0].toUpperCase() + m.slice(1)}
                  </ButtonChip>
                ))}
              </div>
            }
            className="lg:col-span-2"
            subtitle={
              macroGoalValue != null
                ? `Goal: ${macroMetric === "calories" ? macroGoalValue + " kcal" : macroGoalValue + " g"}`
                : "Set your macro goals in Goals page to see target lines"
            }
          >
            <div className="h-72 w-full">
              <ResponsiveContainer>
                <RBarChart data={series.barMacroData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#E6F2F8" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#2563eb" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#2563eb" }} width={40} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey={macroMetric} fill={macroBarColor} radius={[6, 6, 0, 0]} />
                  {macroGoalValue != null && (
                    <ReferenceLine y={macroGoalValue} stroke="#F37748" strokeDasharray="6 4" />
                  )}
                </RBarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Activity Minutes (full-width) */}
          <Card title="Activity Minutes" subtitle="Daily duration (min)" className="lg:col-span-2">
            <div className="h-64 w-full">
              <ResponsiveContainer>
                <RLineChart data={series.lineMinutesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#E6F2F8" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#2563eb" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#2563eb" }} width={40} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="minutes" stroke="#4F46E5" strokeWidth={2} dot={false} />
                </RLineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Trends;
