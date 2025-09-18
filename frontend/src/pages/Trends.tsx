import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";

import { dailyLogService } from "../services/dailyLogService";
import { goalsService } from "../services/goalsService";
import type { Goals } from "../services/goalsService"; // ✅ use service type (has {min,max} ranges)

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
  ReferenceArea, // ✅ to show min→max band
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ---------- Types ----------
type Log = {
  date: string; // YYYY-MM-DD
  weight?: { value: number; measuredAt?: string } | number;
  activity?: { type: string; steps?: number; duration?: number };
  macros?: { calories: number; carbs: number; protein: number; fat: number; fiber: number };
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
      <h1 className="text-xl md:text-2xl font-semibold text-[#3B0764]">{title}</h1>
      {subtitle && <p className="text-sm md:text-base text-[#3B0764]/70">{subtitle}</p>}
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
  <section className={`group [perspective:1200px] ${className}`}>
    <div
      className="rounded-[28px] p-4 md:p-6 bg-white/25 backdrop-blur-xl border border-white/60
                 shadow-[0_8px_30px_rgba(0,0,0,0.08)]
                 transform-gpu transition-all duration-300
                 group-hover:-translate-y-2 group-hover:scale-[1.015]
                 group-hover:shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
    >
      {(title || right) && (
        <div className="flex items-center justify-between mb-3">
          <div>
            {title && <h2 className="text-[#6B21A8] font-semibold text-base md:text-lg">{title}</h2>}
            {subtitle && <div className="text-[11px] md:text-xs text-[#6B21A8]/70">{subtitle}</div>}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  </section>
);

const Stat: React.FC<{ label: string; value: string | number; foot?: string }> = ({ label, value, foot }) => (
  <div className="bg-white/60 border border-white/70 rounded-2xl px-4 py-3 text-center backdrop-blur">
    <div className="text-xs md:text-sm text-[#6B21A8]">{label}</div>
    <div className="text-lg md:text-2xl font-semibold text-[#3B0764]">{value}</div>
    {foot && <div className="text-[11px] md:text-xs text-[#6B21A8]/80">{foot}</div>}
  </div>
);

const ButtonChip: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }
> = ({ active, className = "", ...props }) => (
  <button
    {...props}
    className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-all
      focus:outline-none focus:ring-2 focus:ring-white/60 backdrop-blur
      ${active
        ? "text-[#3B0764] bg-white/60 border border-white/80 shadow"
        : "text-[#3B0764] bg-white/30 border border-white/60 hover:bg-white/50"} ${className}`}
  />
);

// ---------- Main ----------
const Trends: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [goals, setGoals] = useState<Goals | null>(null); // ✅ use service type
  const [loading, setLoading] = useState(true);

  // Filters
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [macroMetric, setMacroMetric] = useState<"calories" | "protein" | "carbs" | "fat" | "fiber">("calories");

  useEffect(() => {
    (async () => {
      try {
        const [l, g] = await Promise.all([dailyLogService.getLogs(), goalsService.getGoals()]);
        setLogs(Array.isArray(l) ? l : []);
        setGoals(g || null); // ✅ types now align
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

  // ✅ goals.macros entries are DualRange-like {min,max}. Compute band + midpoint.
  const macroRange = goals?.macros?.[macroMetric] as { min?: number; max?: number } | undefined;
  const macroMin = macroRange?.min ?? undefined;
  const macroMax = macroRange?.max ?? undefined;
  const macroMid =
    macroMin != null && macroMax != null
      ? Math.round((macroMin + macroMax) / 2)
      : macroMax ?? macroMin ?? undefined;

  // Loading & empty
  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#FDE68A] via-[#FBCFE8] to-[#DDD6FE]">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-60"
               style={{ background: "radial-gradient( circle at 30% 30%, #FDE68A 0%, transparent 60% )" }} />
          <div className="absolute top-10 right-0 h-96 w-96 rounded-full blur-3xl opacity-60"
               style={{ background: "radial-gradient( circle at 70% 30%, #DDD6FE 0%, transparent 60% )" }} />
          <div className="absolute bottom-[-120px] left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full blur-3xl opacity-50"
               style={{ background: "radial-gradient( circle at 50% 50%, #F5D0FE 0%, transparent 60% )" }} />
        </div>

        <div className="p-6">
          <Navbar />
          <div className="max-w-7xl mx-auto mt-6 md:mt-10 space-y-4">
            <div className="h-8 w-64 bg-white/40 rounded-xl animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-white/40 rounded-2xl animate-pulse" />
              ))}
            </div>
            <div className="h-64 bg-white/40 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!logs.length) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#FDE68A] via-[#FBCFE8] to-[#DDD6FE]">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-60"
               style={{ background: "radial-gradient( circle at 30% 30%, #FDE68A 0%, transparent 60% )" }} />
          <div className="absolute top-10 right-0 h-96 w-96 rounded-full blur-3xl opacity-60"
               style={{ background: "radial-gradient( circle at 70% 30%, #DDD6FE 0%, transparent 60% )" }} />
          <div className="absolute bottom-[-120px] left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full blur-3xl opacity-50"
               style={{ background: "radial-gradient( circle at 50% 50%, #F5D0FE 0%, transparent 60% )" }} />
        </div>

        <div className="p-6">
          <Navbar />
          <div className="max-w-4xl mx-auto mt-10">
            <div className="rounded-[28px] p-8 text-center bg-white/25 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
              <h2 className="text-[#6B21A8] font-semibold text-lg">No data yet</h2>
              <p className="text-[#6B21A8]/80 mt-2">Log your weight, activity, and meals to see trends here.</p>
            </div>
          </div>
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

  const tooltipStyle = {
    background: "white",
    border: "1px solid rgba(255,255,255,0.7)",
    borderRadius: "12px",
    fontSize: "12px",
    padding: "8px",
    backdropFilter: "blur(8px)",
  } as React.CSSProperties;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#FDE68A] via-[#FBCFE8] to-[#DDD6FE]">
      {/* Aura blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-60"
             style={{ background: "radial-gradient( circle at 30% 30%, #FDE68A 0%, transparent 60% )" }} />
        <div className="absolute top-10 right-0 h-96 w-96 rounded-full blur-3xl opacity-60"
             style={{ background: "radial-gradient( circle at 70% 30%, #DDD6FE 0%, transparent 60% )" }} />
        <div className="absolute bottom-[-120px] left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full blur-3xl opacity-50"
             style={{ background: "radial-gradient( circle at 50% 50%, #F5D0FE 0%, transparent 60% )" }} />
      </div>

      <div className="p-6">
        <Navbar />

        <main className="max-w-7xl mx-auto mt-6 md:mt-10 space-y-6 md:space-y-8">
          {/* Header + Filters */}
          <PageHeader
            title=""
            subtitle=""
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
            <Card title="Weight Trend" subtitle="7-day moving average overlay">
              <div className="h-64 w-full">
                <ResponsiveContainer>
                  <RLineChart data={series.lineWeightData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#E6F2F8" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#3B0764" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#3B0764" }} width={40} />
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
                    <div key={i} className="bg-white/60 border border-white/70 rounded-2xl px-3 md:px-4 py-2 md:py-3 text-center backdrop-blur">
                      <div className="font-semibold text-[#3B0764]">{p.name}</div>
                      <div className="text-[#6B21A8]">{Math.round(p.value)} kcal/day</div>
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
                macroMin != null && macroMax != null
                  ? `Goal band: ${macroMin}–${macroMax} ${macroMetric === "calories" ? "kcal" : "g"}`
                  : macroMid != null
                  ? `Goal: ${macroMid} ${macroMetric === "calories" ? "kcal" : "g"}`
                  : "Set your macro goals in Goals page to see targets"
              }
            >
              <div className="h-72 w-full">
                <ResponsiveContainer>
                  <RBarChart data={series.barMacroData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#E6F2F8" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#3B0764" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#3B0764" }} width={40} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {/* User data */}
                    <Bar dataKey={macroMetric} fill={macroBarColor} radius={[6, 6, 0, 0]} />
                    {/* Goal band + midpoint */}
                    {macroMin != null && macroMax != null && (
                      <ReferenceArea y1={macroMin} y2={macroMax} fill="#FBCFE8" fillOpacity={0.18} />
                    )}
                    {macroMid != null && (
                      <ReferenceLine y={macroMid} stroke="#F37748" strokeDasharray="6 4" />
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
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#3B0764" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#3B0764" }} width={40} />
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
    </div>
  );
};

export default Trends;