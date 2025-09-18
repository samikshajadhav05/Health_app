import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { dailyLogService } from "../services/dailyLogService";
import { goalsService } from "../services/goalsService";
import type { Goals } from "../services/goalsService";


import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
  Legend,
  CartesianGrid,
} from "recharts";

/** ------------------------------------------------------------
 * Color tokens (high-contrast yellow/purple for visibility)
 * ------------------------------------------------------------ */
const COLORS = {
  // Primary purple + accents
  primary: "#7C3AED", // vivid purple (lines, bars)
  primarySoft: "#A78BFA", // soft purple
  // Yellow accents
  accent: "#F59E0B", // amber (targets, max lines)
  accentSoft: "#FDE68A", // pastel band / dots
  // Text & grid
  text: "#3B0764",
  textMuted: "#6B21A8",
  grid: "#E9D5FF",
  // Bands
  bandPurple: "rgba(167, 139, 250, 0.22)",
  bandPink: "rgba(251, 191, 210, 0.22)",
};

/** ------------------------------------------------------------
 * Tiny UI primitives (match your vibe)
 * ------------------------------------------------------------ */
const PageHeader: React.FC<{ title: string; subtitle?: string; right?: React.ReactNode }> = ({
  title,
  subtitle,
  right,
}) => (
  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 text-[#6B21A8]">
    <div>
      <h1 className="text-xl md:text-2xl font-semibold">{title}</h1>
      {subtitle && <p className="text-sm md:text-base text-[#3B0764]/80">{subtitle}</p>}
    </div>
    {right}
  </div>
);

const Card: React.FC<{
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, right, className = "", children }) => (
  <section
    className={`group [perspective:1200px] relative h-full flex flex-col rounded-[28px] p-6 bg-white/25 backdrop-blur-xl border border-white/60
                 shadow-[0_8px_30px_rgba(0,0,0,0.08)] transform-gpu transition-all duration-300
                 group-hover:-translate-y-2 group-hover:scale-[1.015] group-hover:shadow-[0_24px_60px_rgba(0,0,0,0.18)]
                 ${className}`}
  >
    {(title || right) && (
      <div className="flex items-center justify-between mb-3 text-[#6B21A8]">
        <div>
          {title && <h2 className="font-semibold text-base md:text-lg">{title}</h2>}
          {subtitle && <div className="text-[11px] md:text-xs text-[#3B0764]">{subtitle}</div>}
        </div>
        {right}
      </div>
    )}
    {children}
  </section>
);

const NumberInput: React.FC<{
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  step?: number;
  suffix?: string;
  min?: number;
  max?: number;
}> = ({ label, value, onChange, step = 1, suffix, min, max }) => (
  <label className="flex items-center gap-2 bg-white/50 border border-white/70 rounded-2xl px-3 py-2 text-[#6B21A8]">
    <span className="text-sm min-w-[110px]">{label}</span>
    <input
      type="number"
      step={step}
      min={min !== undefined ? min : undefined}
      max={max !== undefined ? max : undefined}
      className="flex-1 outline-none text-[#3B0764] bg-transparent"
      value={value ?? ""}
      onChange={(e) => {
        const raw = e.target.value;
        onChange(raw === "" ? undefined : Number(raw));
      }}
    />
    {suffix && <span className="text-gray-500/70 text-xs">{suffix}</span>}
  </label>
);

const SaveBar: React.FC<{ saving: boolean; onSave: () => void }> = ({ saving, onSave }) => (
  <div className="flex justify-end">
    <button
      onClick={onSave}
      disabled={saving}
      className="relative px-4 py-2.5 rounded-2xl font-semibold
                 bg-gradient-to-r from-[#FDE68A] via-[#FBCFE8] to-[#DDD6FE]
                 ring-1 ring-white/60 shadow-md
                 hover:shadow-xl hover:brightness-[1.08] active:brightness-95
                 transition disabled:opacity-60"
    >
      <span className="text-[#3B0764] drop-shadow-[0_1px_0_rgba(255,255,255,0.7)]">
        {saving ? "Saving..." : "Save"}
      </span>
      <span className="pointer-events-none absolute inset-0 rounded-2xl bg-white/10" />
    </button>
  </div>
);

/** ------------------------------------------------------------
 * Types & helpers
 * ------------------------------------------------------------ */
type MacroKey = "calories" | "protein" | "carbs" | "fat" | "fiber";

const toNum = (v: any) => (typeof v === "number" ? v : Number(v) || 0);
const fmt = (iso: string) => iso.slice(5).replace("-", "/"); // MM/DD
const avg = (arr: number[]) => {
  const vals = arr.filter((v) => Number.isFinite(v));
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
};

/** ------------------------------------------------------------
 * Component
 * ------------------------------------------------------------ */
const GoalsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const [draft, setDraft] = useState<Goals>({
    steps: { min: 8000, max: 12000 },
    workout: { type: "gym", mode: "time", target: 45 },
    macros: {
      calories: { min: 1800, max: 2200 },
      protein: { min: 110, max: 150 },
      carbs: { min: 150, max: 260 },
      fat: { min: 45, max: 80 },
      fiber: { min: 25, max: 40 },
    },
    currentWeight: undefined,
    goalWeight: undefined,
    targetDate: null,
    nonWeight: { sleepHours: { min: 7, max: 8 }, waterLiters: { min: 2.5, max: 3 } },
    streaks: { stepsDaysPerWeekMin: 5, caloriesWithinGoalDaysPerWeekMin: 5 },
  });

  useEffect(() => {
    (async () => {
      try {
        const [l, g] = await Promise.all([dailyLogService.getLogs(), goalsService.getGoals()]);
        setLogs(Array.isArray(l) ? l : []);
        if (g) setDraft((d) => ({ ...d, ...g })); // merge from server
      } catch (e) {
        console.error("Goals load error:", e);
      }
    })();
  }, []);

  const series = useMemo(() => {
    const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
    const labels = sorted.map((d) => fmt(d.date));

    const steps = sorted.map((d) => toNum(d.activity?.steps));
    const minutes = sorted.map((d) => toNum(d.activity?.duration));
    const weight = sorted.map((d) => (typeof d.weight === "number" ? d.weight : d.weight?.value ?? NaN));
    const calories = sorted.map((d) => toNum(d.macros?.calories));
    const protein = sorted.map((d) => toNum(d.macros?.protein));
    const carbs = sorted.map((d) => toNum(d.macros?.carbs));
    const fat = sorted.map((d) => toNum(d.macros?.fat));
    const fiber = sorted.map((d) => toNum(d.macros?.fiber));

    const macroAvg = {
      calories: Math.round(avg(calories)),
      protein: Math.round(avg(protein)),
      carbs: Math.round(avg(carbs)),
      fat: Math.round(avg(fat)),
      fiber: Math.round(avg(fiber)),
    };

    return {
      stepsData: labels.map((l, i) => ({ label: l, steps: steps[i] || 0 })),
      minutesData: labels.map((l, i) => ({ label: l, minutes: minutes[i] || 0 })),
      weightData: labels.map((l, i) => ({ label: l, weight: weight[i] })),
      macroCompareData: (["calories", "protein", "carbs", "fat", "fiber"] as MacroKey[]).map((k) => ({
        name: k[0].toUpperCase() + k.slice(1),
        avg: macroAvg[k],
        min: (draft.macros as any)?.[k]?.min,
        max: (draft.macros as any)?.[k]?.max,
      })),
      macroAvg,
    };
  }, [logs, draft]);

  // Adaptive suggestions (gentle, user-controlled)
  const suggestions = useMemo(() => {
    const s: { key: string; text: string; apply: () => void }[] = [];
    const m = series.macroAvg;

    // Calories nudges ±100 when avg is outside band
    const cal = draft.macros?.calories;
    if (cal?.max && m.calories > cal.max + 100) {
      s.push({
        key: "calories-down",
        text: `You're averaging ${m.calories} kcal; your max is ${cal.max}. Reduce calorie max by 100?`,
        apply: () =>
          setDraft((d) => ({
            ...d,
            macros: { ...d.macros, calories: { min: cal.min, max: Math.max(100, (cal.max || 0) - 100) } },
          })),
      });
    }
    if (cal?.min && m.calories < cal.min - 100) {
      s.push({
        key: "calories-up",
        text: `You're averaging ${m.calories} kcal; your min is ${cal.min}. Increase calorie min by 100?`,
        apply: () => setDraft((d) => ({ ...d, macros: { ...d.macros, calories: { min: (cal.min || 0) + 100, max: cal.max } } })),
      });
    }

    // Protein min +10 if avg too low
    const prot = draft.macros?.protein;
    if (prot?.min && m.protein < prot.min - 10) {
      s.push({
        key: "protein-up",
        text: `Avg protein ${m.protein}g; min is ${prot.min}g. Increase protein min by 10g?`,
        apply: () =>
          setDraft((d) => ({ ...d, macros: { ...d.macros, protein: { min: (prot.min || 0) + 10, max: prot.max } } })),
      });
    }

    // Steps min/max ±1000 based on avg
    const st = draft.steps;
    const avgSteps = Math.round(avg(series.stepsData.map((x) => x.steps)));
    if (st?.max && avgSteps > st.max + 1000) {
      s.push({
        key: "steps-up",
        text: `Avg steps ${avgSteps}; max is ${st.max}. Increase steps max by 1000?`,
        apply: () => setDraft((d) => ({ ...d, steps: { min: d.steps?.min, max: (d.steps?.max || 0) + 1000 } })),
      });
    }
    if (st?.min && avgSteps < st.min - 1000) {
      s.push({
        key: "steps-down",
        text: `Avg steps ${avgSteps}; min is ${st.min}. Decrease steps min by 1000?`,
        apply: () => setDraft((d) => ({ ...d, steps: { min: Math.max(0, (d.steps?.min || 0) - 1000), max: d.steps?.max } })),
      });
    }

    return s.slice(0, 4);
  }, [draft, series.macroAvg, series.stepsData]);

  const saveGoals = async () => {
    try {
      setSaving(true);
      const saved = await goalsService.updateGoals(draft);
      setDraft(saved); // reflect backend truth
    } catch (e) {
      console.error("Save goals failed:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#FDE68A] via-[#FBCFE8] to-[#DDD6FE]">
      {/* Luxe pastel aura background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-60"
          style={{ background: "radial-gradient( circle at 30% 30%, #FDE68A 0%, transparent 60% )" }}
        />
        <div
          className="absolute top-10 right-0 h-96 w-96 rounded-full blur-3xl opacity-60"
          style={{ background: "radial-gradient( circle at 70% 30%, #DDD6FE 0%, transparent 60% )" }}
        />
        <div
          className="absolute bottom-[-120px] left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full blur-3xl opacity-50"
          style={{ background: "radial-gradient( circle at 50% 50%, #F5D0FE 0%, transparent 60% )" }}
        />
      </div>

      <div className="p-6">
      <Navbar />
      <main className="max-w-7xl mx-auto mt-6 md:mt-10 space-y-6 md:space-y-8 p-4 md:p-0">
        <PageHeader
          title="Goals"
          subtitle="Set clear targets and see your recent data against them."
          right={<SaveBar saving={saving} onSave={saveGoals} />}
        />

        {/* Adaptive suggestions */}
        {suggestions.length > 0 && (
          <Card title="Adaptive suggestions" subtitle="Small nudges from your recent averages">
            <div className="grid gap-2">
              {suggestions.map((s) => (
                <div
                  key={s.key}
                  className="flex items-center justify-between bg-white/50 border border-white/70 rounded-2xl px-3 py-2"
                >
                  <div className="text-sm text-[#3B0764]">{s.text}</div>
                  <button
                    onClick={s.apply}
                    className="relative px-3 py-1 rounded-2xl font-semibold bg-gradient-to-r from-[#FDE68A] to-[#FBCFE8] text-[#3B0764] text-xs shadow-md"
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white/50 border border-white/70 rounded-2xl px-4 py-3 text-center">
            <div className="text-xs md:text-sm text-[#6B21A8]">Avg Calories</div>
            <div className="text-lg md:text-2xl font-semibold text-[#3B0764]">{series.macroAvg.calories} kcal</div>
          </div>
          <div className="bg-white/50 border border-white/70 rounded-2xl px-4 py-3 text-center">
            <div className="text-xs md:text-sm text-[#6B21A8]">Avg Protein</div>
            <div className="text-lg md:text-2xl font-semibold text-[#3B0764]">{series.macroAvg.protein} g</div>
          </div>
          <div className="bg-white/50 border border-white/70 rounded-2xl px-4 py-3 text-center">
            <div className="text-xs md:text-sm text-[#6B21A8]">Avg Steps</div>
            <div className="text-lg md:text-2xl font-semibold text-[#3B0764]">
              {Math.round(avg(series.stepsData.map((x) => x.steps)))}
            </div>
          </div>
          <div className="bg-white/50 border border-white/70 rounded-2xl px-4 py-3 text-center">
            <div className="text-xs md:text-sm text-[#6B21A8]">Avg Minutes</div>
            <div className="text-lg md:text-2xl font-semibold text-[#3B0764]">
              {Math.round(avg(series.minutesData.map((x) => x.minutes)))} min
            </div>
          </div>
        </div>

        {/* Steps Goal */}
        <Card title="Steps Goal" subtitle="Set a daily min/max. We’ll overlay your recent days.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <NumberInput
              label="Steps min"
              value={draft.steps?.min}
              onChange={(v) => setDraft((d) => ({ ...d, steps: { min: v, max: d.steps?.max } }))}
            />
            <NumberInput
              label="Steps max"
              value={draft.steps?.max}
              onChange={(v) => setDraft((d) => ({ ...d, steps: { min: d.steps?.min, max: v } }))}
            />
            <div className="bg-white/50 border border-white/70 rounded-2xl px-3 py-2 text-[#3B0764] text-sm flex items-center">
              Tip: aim for a range you can hit 5+ days/week.
            </div>
          </div>

          <div className="h-60 w-full mt-3">
            <ResponsiveContainer>
              <LineChart data={series.stepsData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: COLORS.textMuted }} />
                <YAxis tick={{ fontSize: 12, fill: COLORS.textMuted }} width={44} />
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: `1px solid ${COLORS.primarySoft}`,
                    borderRadius: 12,
                    fontSize: 12,
                    color: COLORS.text,
                  }}
                />
                {draft.steps?.min != null && draft.steps?.max != null && (
                  <ReferenceArea y1={draft.steps.min} y2={draft.steps.max} fill={COLORS.bandPurple} />
                )}
                {draft.steps?.min != null && (
                  <ReferenceLine y={draft.steps.min} stroke={COLORS.primary} strokeDasharray="4 4" strokeWidth={2} />
                )}
                {draft.steps?.max != null && (
                  <ReferenceLine y={draft.steps.max} stroke={COLORS.accent} strokeDasharray="6 4" strokeWidth={2} />
                )}
                <Line
                  type="monotone"
                  dataKey="steps"
                  stroke={COLORS.primary}
                  strokeWidth={3}
                  dot={{ r: 3, stroke: COLORS.accentSoft, strokeWidth: 2, fill: "#fff" }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: COLORS.accent, fill: "#fff" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Workout Goal */}
        <Card title="Workout Goal" subtitle="Pick a type and set a target (time or calories)">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="bg-white/50 border border-white/70 rounded-2xl px-3 py-2 text-[#6B21A8] text-sm">
              <span className="mr-2">Type</span>
              <select
                className="outline-none text-[#3B0764] bg-transparent"
                value={draft.workout?.type || "gym"}
                onChange={(e) => setDraft((d) => ({ ...d, workout: { ...d.workout, type: e.target.value } }))}
              >
                <option value="walking">Walking</option>
                <option value="running">Running</option>
                <option value="cycling">Cycling</option>
                <option value="gym">Gym</option>
              </select>
            </label>

            <label className="bg-white/50 border border-white/70 rounded-2xl px-3 py-2 text-[#6B21A8] text-sm">
              <span className="mr-2">Mode</span>
              <select
                className="outline-none text-[#3B0764] bg-transparent"
                value={draft.workout?.mode || "time"}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, workout: { ...d.workout, mode: e.target.value as "time" | "calories" } }))
                }
              >
                <option value="time">Time (min)</option>
                <option value="calories">Calories</option>
              </select>
            </label>

            <NumberInput
              label="Target"
              value={draft.workout?.target}
              onChange={(v) => setDraft((d) => ({ ...d, workout: { ...d.workout, target: v } }))}
              suffix={draft.workout?.mode === "calories" ? "kcal/session" : "min/session"}
            />
          </div>

          <div className="h-60 w-full mt-3">
            <ResponsiveContainer>
              <BarChart data={series.minutesData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: COLORS.textMuted }} />
                <YAxis tick={{ fontSize: 12, fill: COLORS.textMuted }} width={44} />
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: `1px solid ${COLORS.primarySoft}`,
                    borderRadius: 12,
                    fontSize: 12,
                    color: COLORS.text,
                  }}
                />
                {draft.workout?.mode === "time" && draft.workout?.target != null && (
                  <ReferenceLine y={draft.workout.target} stroke={COLORS.accent} strokeDasharray="6 4" strokeWidth={2} />
                )}
                <Bar
                  dataKey="minutes"
                  name="Minutes"
                  fill={COLORS.primary}
                  stroke={COLORS.primary}
                  strokeWidth={1.5}
                  radius={[10, 10, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Macro Goals */}
        <Card title="Macro Goals" subtitle="Absolute numbers with optional min/max. Bar shows your recent average.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(["calories", "protein", "carbs", "fat", "fiber"] as MacroKey[]).map((k) => (
              <div key={k} className="grid grid-cols-2 gap-2">
                <NumberInput
                  label={`${k[0].toUpperCase() + k.slice(1)} min`}
                  value={(draft.macros as any)?.[k]?.min}
                  onChange={(v) =>
                    setDraft((d) => ({ ...d, macros: { ...d.macros, [k]: { ...(d.macros as any)?.[k], min: v } } }))
                  }
                  suffix={k === "calories" ? "kcal" : "g"}
                />
                <NumberInput
                  label={`${k[0].toUpperCase() + k.slice(1)} max`}
                  value={(draft.macros as any)?.[k]?.max}
                  onChange={(v) =>
                    setDraft((d) => ({ ...d, macros: { ...d.macros, [k]: { ...(d.macros as any)?.[k], max: v } } }))
                  }
                  suffix={k === "calories" ? "kcal" : "g"}
                />
              </div>
            ))}
          </div>

          <div className="h-72 w-full mt-3">
            <ResponsiveContainer>
              <BarChart data={series.macroCompareData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: COLORS.textMuted }} />
                <YAxis tick={{ fontSize: 12, fill: COLORS.textMuted }} width={44} />
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: `1px solid ${COLORS.primarySoft}`,
                    borderRadius: 12,
                    fontSize: 12,
                    color: COLORS.text,
                  }}
                />
                <Legend
                  wrapperStyle={{
                    color: COLORS.text,
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="avg"
                  name="Your Avg"
                  fill={COLORS.primary}
                  stroke={COLORS.primary}
                  strokeWidth={1.5}
                  radius={[10, 10, 0, 0]}
                />
                {/* Optional goal bands per bar (min/max) */}
                {/* You can add custom shapes if you want min/max range visual per macro */}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Weight Goal */}
        <Card title="Weight Goal" subtitle="Target weight (optional target date). Trend vs target.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <NumberInput
              label="Current weight"
              value={draft.currentWeight}
              onChange={(v) => setDraft((d) => ({ ...d, currentWeight: v }))}
              suffix="kg"
            />
            <NumberInput
              label="Target weight"
              value={draft.goalWeight}
              onChange={(v) => setDraft((d) => ({ ...d, goalWeight: v }))}
              suffix="kg"
            />
            <label className="flex items-center gap-2 bg-white/50 border border-white/70 rounded-2xl px-3 py-2 text-[#6B21A8] text-sm">
              <span className="min-w-[110px]">Target date</span>
              <input
                type="date"
                className="flex-1 outline-none text-[#3B0764] bg-transparent"
                value={draft.targetDate || ""}
                onChange={(e) => setDraft((d) => ({ ...d, targetDate: e.target.value || null }))}
              />
            </label>
          </div>

          <div className="h-60 w-full mt-3">
            <ResponsiveContainer>
              <LineChart data={series.weightData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: COLORS.textMuted }} />
                <YAxis tick={{ fontSize: 12, fill: COLORS.textMuted }} width={44} />
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: `1px solid ${COLORS.primarySoft}`,
                    borderRadius: 12,
                    fontSize: 12,
                    color: COLORS.text,
                  }}
                />
                {draft.goalWeight != null && (
                  <ReferenceLine y={draft.goalWeight} stroke={COLORS.accent} strokeDasharray="6 4" strokeWidth={2} />
                )}
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke={COLORS.primary}
                  strokeWidth={3}
                  dot={{ r: 3, stroke: COLORS.accentSoft, strokeWidth: 2, fill: "#fff" }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: COLORS.accent, fill: "#fff" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Non-Weight Goals */}
        <Card title="Non-Weight Goals" subtitle="Sleep & hydration targets support recovery.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="grid grid-cols-2 gap-2">
              <NumberInput
                label="Sleep min"
                value={draft.nonWeight?.sleepHours?.min}
                onChange={(v) =>
                  setDraft((d) => ({
                    ...d,
                    nonWeight: { ...d, sleepHours: { ...d.nonWeight?.sleepHours, min: v } as any }.nonWeight,
                  }))
                }
                suffix="hrs"
                step={0.5}
              />
              <NumberInput
                label="Sleep max"
                value={draft.nonWeight?.sleepHours?.max}
                onChange={(v) =>
                  setDraft((d) => ({
                    ...d,
                    nonWeight: { ...d, sleepHours: { ...d.nonWeight?.sleepHours, max: v } as any }.nonWeight,
                  }))
                }
                suffix="hrs"
                step={0.5}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <NumberInput
                label="Water min"
                value={draft.nonWeight?.waterLiters?.min}
                onChange={(v) =>
                  setDraft((d) => ({
                    ...d,
                    nonWeight: { ...d, waterLiters: { ...d.nonWeight?.waterLiters, min: v } as any }.nonWeight,
                  }))
                }
                suffix="L"
                step={0.1}
              />
              <NumberInput
                label="Water max"
                value={draft.nonWeight?.waterLiters?.max}
                onChange={(v) =>
                  setDraft((d) => ({
                    ...d,
                    nonWeight: { ...d, waterLiters: { ...d.nonWeight?.waterLiters, max: v } as any }.nonWeight,
                  }))
                }
                suffix="L"
                step={0.1}
              />
            </div>
          </div>
        </Card>

        {/* Streak Targets */}
        <Card title="Streak Targets" subtitle="Days per week you want to hit these goals.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <NumberInput
              label="Steps days/week"
              value={draft.streaks?.stepsDaysPerWeekMin}
              onChange={(v) => setDraft((d) => ({ ...d, streaks: { ...d.streaks, stepsDaysPerWeekMin: v } }))}
              min={0}
              max={7}
            />
            <NumberInput
              label="Calories within goal days/week"
              value={draft.streaks?.caloriesWithinGoalDaysPerWeekMin}
              onChange={(v) =>
                setDraft((d) => ({ ...d, streaks: { ...d.streaks, caloriesWithinGoalDaysPerWeekMin: v } }))
              }
              min={0}
              max={7}
            />
          </div>
        </Card>

        <SaveBar saving={saving} onSave={saveGoals} />
      </main>
    </div>
    </div>
  );
};

export default GoalsPage;