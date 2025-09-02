import React, { useState } from "react";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        goal: form.goal as "loss" | "gain" | "maintenance",
        currentWeight: Number(form.currentWeight || 0),
        goalWeight: Number(form.goalWeight || 0),
        height: Number(form.height || 0),
        age: Number(form.age || 0),
      };

      const res = await authService.register(payload);

      if (res.token) {
        localStorage.setItem("token", res.token);
        navigate("/home");
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
    <div className="min-h-screen flex bg-blue-200 p-8">
      <div className="w-full max-w-3xl bg-white p-8 rounded-2xl mx-auto flex">
        <div className="w-1/2 pr-6">
          <button onClick={() => navigate(-1)} className="text-2xl mb-4">←</button>
          <h2 className="text-3xl font-semibold mb-4">Sign Up</h2>

          <form onSubmit={onSubmit} className="space-y-4">
            <input
              name="email"
              value={form.email}
              onChange={onChange}
              type="email"
              placeholder="Your email"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 border"
              required
            />
            <input
              name="password"
              value={form.password}
              onChange={onChange}
              type="password"
              placeholder="Password"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 border"
              required
            />

            <select
              name="goal"
              value={form.goal}
              onChange={onChange}
              className="w-full px-4 py-3 rounded-xl bg-gray-100 border"
            >
              <option value="">Select health goal</option>
              <option value="loss">Weight Loss</option>
              <option value="maintenance">Maintenance</option>
              <option value="gain">Weight Gain</option>
            </select>

            <div className="grid grid-cols-2 gap-2">
              <input
                name="currentWeight"
                value={form.currentWeight}
                onChange={onChange}
                type="number"
                placeholder="Current Weight (kg)"
                className="px-4 py-2 rounded-xl bg-gray-100 border"
              />
              <input
                name="goalWeight"
                value={form.goalWeight}
                onChange={onChange}
                type="number"
                placeholder="Goal Weight (kg)"
                className="px-4 py-2 rounded-xl bg-gray-100 border"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                name="height"
                value={form.height}
                onChange={onChange}
                type="number"
                placeholder="Height (cm)"
                className="px-4 py-2 rounded-xl bg-gray-100 border"
              />
              <input
                name="age"
                value={form.age}
                onChange={onChange}
                type="number"
                placeholder="Age"
                className="px-4 py-2 rounded-xl bg-gray-100 border"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pink-400 text-white font-semibold py-2 rounded-xl"
            >
              {loading ? "Creating..." : "Get Started"}
            </button>

            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          </form>
        </div>

        <div className="w-1/2 bg-blue-500 rounded-2xl p-6 text-white flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold mb-6">PEBBL</h1>
          <img src={Penguin} alt="Penguin" className="w-3/5 mb-6" />
          <h2 className="text-xl font-semibold text-center">Track & Visualize | Reach Goals</h2>
          <p className="text-sm mt-2 text-center">Track All Health Metrics | One Stop Solution</p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
