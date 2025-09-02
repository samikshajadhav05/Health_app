import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService} from "../services/authService.ts";

interface LoginData {
  email: string;
  password: string;
}

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginData>({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authService.login(form);

      if (res.token) {
        localStorage.setItem("token", res.token);
        navigate("/home");
      } else {
        setError("Login failed: No token returned from server.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-lightblue p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow">
        <h2 className="text-2xl font-semibold mb-4">Sign In</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            name="email"
            value={form.email}
            onChange={onChange}
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 rounded border"
            required
          />
          <input
            name="password"
            value={form.password}
            onChange={onChange}
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 rounded border"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
          {error && <div className="text-red-500 text-sm">{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default SignIn;
