import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/authService.ts";

/** ------------------------------------------------------------
 * Lightweight ConfettiFX
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

        if (p.shape === "rect") {
          ctx.fillRect(-p.r, -p.r * 0.6, p.r * 2, p.r * 1.2);
        } else {
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

      if (elapsed < duration) {
        rafRef.current = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, w, h);
      }
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [run, duration]);

  if (!run) return null;
  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[60]"
      aria-hidden="true"
    />
  );
};

/** ------------------------------------------------------------
 * Page
 * ------------------------------------------------------------ */
interface LoginData {
  email: string;
  password: string;
}

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginData>({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // In frontend/src/pages/SignIn.tsx

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authService.login(form);
      // CORRECTED: Check for 'access_token'
      if (res.access_token) {
        // The token is already saved by authService, so we just celebrate and navigate
        setCelebrate(true);
        setTimeout(() => navigate("/home"), 1500);
      } else {
        setError("Login failed: No token returned from server.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Login failed. Please check your credentials.");
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

      <div className="mx-auto max-w-7xl px-4 py-10 md:py-16">
        <div className="mx-auto w-full max-w-md">
          <section
            className="group [perspective:1200px] relative flex flex-col rounded-[28px] p-6 md:p-8 bg-white/25 backdrop-blur-xl border border-white/60
                       shadow-[0_8px_30px_rgba(0,0,0,0.08)] transform-gpu transition-all duration-300
                       group-hover:-translate-y-2 group-hover:scale-[1.015] group-hover:shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
          >
            <div className="mb-6 text-center">
              <h1 className="text-2xl md:text-3xl font-semibold text-[#6B21A8]">Welcome Back 👋</h1>
              <p className="mt-1 text-sm text-[#3B0764]/80">Sign in to continue</p>
            </div>

            {/* Email/password form */}
            <form onSubmit={onSubmit} className="space-y-4">
              <label className="flex items-center gap-2 bg-white/50 border border-white/70 rounded-2xl px-3 py-2 text-[#6B21A8]">
                <span className="text-sm min-w-[92px]">Email</span>
                <input
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  type="email"
                  placeholder="you@example.com"
                  className="flex-1 outline-none text-[#3B0764] bg-transparent placeholder:text-[#3B0764]/40"
                  required
                />
              </label>

              <label className="flex items-center gap-2 bg-white/50 border border-white/70 rounded-2xl px-3 py-2 text-[#6B21A8]">
                <span className="text-sm min-w-[92px]">Password</span>
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

              {error && (
                <div className="text-center text-sm text-red-600 bg-white/50 border border-red-200 rounded-2xl px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="relative w-full px-4 py-3 rounded-2xl font-semibold
                           bg-gradient-to-r from-[#FDE68A] via-[#FBCFE8] to-[#DDD6FE]
                           ring-1 ring-white/60 shadow-md
                           hover:shadow-xl hover:brightness-[1.07] active:brightness-95
                           transition disabled:opacity-60 text-[#3B0764]"
              >
                {loading ? "Signing in..." : "Sign In"}
                <span className="pointer-events-none absolute inset-0 rounded-2xl bg-white/10" />
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-[#3B0764]/80">
              Don’t have an account?{" "}
              <Link to="/signup" className="font-semibold text-[#6B21A8] hover:underline">
                Sign Up
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SignIn;