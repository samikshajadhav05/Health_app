import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import Penguin from "../assets/Penguin.svg";

interface RegisterData {
  email: string;
  password: string;
  age?: number;
  height?: number;
  currentWeight?: number;
  goalWeight?: number;
  goal?: "loss" | "gain" | "maintenance";
}

/** ------------------------------------------------------------
 * Lightweight Confetti (no external libs)
 * ------------------------------------------------------------ */
const ConfettiFX: React.FC<{ run: boolean; duration?: number }> = ({ run, duration = 1500 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!run) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const colors = ["#7C3AED", "#A78BFA", "#F59E0B", "#FDE68A", "#FBCFE8", "#DDD6FE"];

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    const count = Math.min(220, Math.floor((w * h) / 18000));
    const particles = Array.from({ length: count }).map(() => ({
      x: Math.random() * w,
      y: -20 - Math.random() * h * 0.5,
      r: 4 + Math.random() * 6,
      c: colors[Math.floor(Math.random() * colors.length)],
      vy: 2 + Math.random() * 3.5,
      vx: -2 + Math.random() * 4,
      a: Math.random() * Math.PI * 2,
      va: -0.1 + Math.random() * 0.2,
      shape: Math.random() < 0.5 ? "rect" : "circle",
    }));

    const start = performance.now();
    const draw = (t: number) => {
      const elapsed = t - start;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.a += p.va;
        p.vx += Math.sin(t / 600 + p.y / 200) * 0.02;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.a);
        ctx.fillStyle = p.c;

        if (p.shape === "rect") ctx.fillRect(-p.r, -p.r * 0.6, p.r * 2, p.r * 1.2);
        else {
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        if (p.y > h + 40) {
          p.y = -20;
          p.x = Math.random() * w;
        }
      }

      if (elapsed < duration) rafRef.current = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, w, h);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      const ctx2 = canvas.getContext("2d");
      if (ctx2) ctx2.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [run, duration]);

  if (!run) return null;
  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[60]" aria-hidden="true" />;
};

/** ------------------------------------------------------------
 * Reusable field helpers
 * ------------------------------------------------------------ */
const Field: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <label className="relative flex items-center gap-2 bg-white/50 border border-white/70 rounded-2xl px-3 py-2 text-[#6B21A8]">
    <span className="text-sm min-w-[110px]">{label}</span>
    {children}
  </label>
);

// Number input with an inside-right unit (kg, cm, yrs)
const UnitField: React.FC<{
  label: string;
  name: string;
  value: string;
  placeholder: string;
  unit: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, name, value, placeholder, unit, onChange }) => (
  <div className="relative">
    <label className="relative flex items-center gap-2 bg-white/50 border border-white/70 rounded-2xl px-3 py-2 text-[#6B21A8]">
      <span className="text-sm min-w-[110px]">{label}</span>
      <input
        name={name}
        value={value}
        onChange={onChange}
        type="number"
        placeholder={placeholder}
        className="flex-1 outline-none text-[#3B0764] bg-transparent placeholder:text-[#3B0764]/40 pr-10
                   [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      {/* Absolutely positioned unit inside the pill */}
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#3B0764]/60">
        {unit}
      </span>
    </label>
  </div>
);

/** ------------------------------------------------------------
 * Page
 * ------------------------------------------------------------ */
const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    goal: "",
    currentWeight: "",
    goalWeight: "",
    height: "",
    age: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const payload: RegisterData = {
        email: form.email,
        password: form.password,
        goal: (form.goal || undefined) as "loss" | "gain" | "maintenance" | undefined,
        currentWeight: form.currentWeight ? Number(form.currentWeight) : undefined,
        goalWeight: form.goalWeight ? Number(form.goalWeight) : undefined,
        height: form.height ? Number(form.height) : undefined,
        age: form.age ? Number(form.age) : undefined,
      };

      const res = await authService.register(payload);

      if (res.token) {
        localStorage.setItem("token", res.token);
        setCelebrate(true);
        setTimeout(() => navigate("/home"), 1500);
      } else {
        setError("Registration failed: No token returned from server.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#FDE68A] via-[#FBCFE8] to-[#DDD6FE]">
      {/* Confetti overlay */}
      <ConfettiFX run={celebrate} duration={1500} />

      {/* Pastel aura blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-60"
          style={{ background: "radial-gradient(circle at 30% 30%, #FDE68A 0%, transparent 60%)" }}
        />
        <div
          className="absolute top-10 right-0 h-96 w-96 rounded-full blur-3xl opacity-60"
          style={{ background: "radial-gradient(circle at 70% 30%, #DDD6FE 0%, transparent 60%)" }}
        />
        <div
          className="absolute bottom-[-120px] left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full blur-3xl opacity-50"
          style={{ background: "radial-gradient(circle at 50% 50%, #F5D0FE 0%, transparent 60%)" }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Form card */}
          <section
            className="group [perspective:1200px] relative flex flex-col rounded-[28px] p-6 md:p-8 bg-white/25 backdrop-blur-xl border border-white/60
                       shadow-[0_8px_30px_rgba(0,0,0,0.08)] transform-gpu transition-all duration-300
                       group-hover:-translate-y-2 group-hover:scale-[1.015] group-hover:shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
          >
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigate(-1)}
                className="text-[#6B21A8] text-sm font-semibold bg-white/60 border border-white/70 rounded-2xl px-3 py-1.5 hover:shadow"
                aria-label="Go back"
              >
                ← Back
              </button>
            </div>

            <div className="mb-2">
              <h1 className="text-2xl md:text-3xl font-semibold text-[#6B21A8]">Create your account</h1>
              <p className="text-sm text-[#3B0764]/80 mt-1">Track, visualize, and hit your goals.</p>
            </div>

            <form onSubmit={onSubmit} className="mt-4 space-y-4">
              {/* Email */}
              <Field label="Email">
                <input
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  type="email"
                  placeholder="you@example.com"
                  className="flex-1 outline-none text-[#3B0764] bg-transparent placeholder:text-[#3B0764]/40"
                  required
                />
              </Field>

              {/* Password with show/hide */}
              <label className="relative flex items-center gap-2 bg-white/50 border border-white/70 rounded-2xl px-3 py-2 text-[#6B21A8]">
                <span className="text-sm min-w-[110px]">Password</span>
                <input
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  className="flex-1 outline-none text-[#3B0764] bg-transparent placeholder:text-[#3B0764]/40"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="text-xs font-semibold px-2 py-1 rounded-xl bg-white/70 border border-white/60 text-[#3B0764] hover:shadow"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </label>

              {/* Goal */}
              <Field label="Goal">
                <select
                  name="goal"
                  value={form.goal}
                  onChange={onChange}
                  className="flex-1 outline-none text-[#3B0764] bg-transparent"
                >
                  <option value="">Select health goal</option>
                  <option value="loss">Weight Loss</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="gain">Weight Gain</option>
                </select>
              </Field>

              {/* Weights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <UnitField
                  label="Current weight"
                  name="currentWeight"
                  value={form.currentWeight}
                  onChange={onChange}
                  placeholder="e.g. 92"
                  unit="kg"
                />
                <UnitField
                  label="Goal weight"
                  name="goalWeight"
                  value={form.goalWeight}
                  onChange={onChange}
                  placeholder="e.g. 75"
                  unit="kg"
                />
              </div>

              {/* Height & Age */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <UnitField
                  label="Height"
                  name="height"
                  value={form.height}
                  onChange={onChange}
                  placeholder="e.g. 173"
                  unit="cm"
                />
                <UnitField
                  label="Age"
                  name="age"
                  value={form.age}
                  onChange={onChange}
                  placeholder="e.g. 20"
                  unit="yrs"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="text-center text-sm text-red-600 bg-white/50 border border-red-200 rounded-2xl px-3 py-2">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full px-4 py-3 rounded-2xl font-semibold
                           bg-gradient-to-r from-[#FDE68A] via-[#FBCFE8] to-[#DDD6FE]
                           ring-1 ring-white/60 shadow-md
                           hover:shadow-xl hover:brightness-[1.07] active:brightness-95
                           transition disabled:opacity-60 text-[#3B0764]"
              >
                {loading ? "Creating..." : "Get Started"}
                <span className="pointer-events-none absolute inset-0 rounded-2xl bg-white/10" />
              </button>
            </form>
          </section>

          {/* Right: Brand card */}
          <section
            className="relative overflow-hidden rounded-[28px] bg-white/25 backdrop-blur-xl border border-white/60 p-6 md:p-8
                       shadow-[0_8px_30px_rgba(0,0,0,0.08)] flex items-center justify-center"
          >
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute -top-10 -right-10 h-52 w-52 rounded-full blur-3xl opacity-60"
                style={{ background: "radial-gradient(circle at 70% 30%, #DDD6FE 0%, transparent 60%)" }}
              />
              <div
                className="absolute bottom-0 left-0 h-60 w-60 rounded-full blur-3xl opacity-60"
                style={{ background: "radial-gradient(circle at 30% 70%, #FDE68A 0%, transparent 60%)" }}
              />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <h1 className="text-3xl font-bold text-[#6B21A8] mb-4 tracking-wide">PEBBL</h1>
              <img src={Penguin} alt="Penguin" className="w-40 md:w-48 mb-6 drop-shadow" />
              <h2 className="text-lg md:text-xl font-semibold text-[#3B0764]">
                Track & Visualize • Reach Goals
              </h2>
              <p className="text-sm mt-2 text-[#3B0764]/80">
                All your health metrics in one beautiful dashboard.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;