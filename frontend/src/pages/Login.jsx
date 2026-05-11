import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, User, Lock } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { loginUser } from "../api/auth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const { login, loading: authLoading } = useAuth();
  const from = location.state?.from?.pathname || "/dashboard";

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ================= LOGIN =================
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.username || !formData.password) {
      return setError("Please fill all fields");
    }

    try {
      setLoading(true);

      const data = await loginUser(formData);

      console.log("✅ LOGIN RESPONSE:", data);

      // 🔥 FIXED: pass full response
      login(data);

      navigate(from, { replace: true });

    } catch (err) {
      console.error("❌ Login error:", err);

      setError(
        err?.response?.data?.detail ||
        err?.detail ||
        "Invalid username or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">

      {/* 🌈 BACKGROUND */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/login-bg.png')" }}
      />
      <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]" />

      {/* 🧊 CARD */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md rounded-3xl p-8
        bg-white/60 backdrop-blur-xl
        border border-white/40
        shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
      >

        {/* 🔷 HEADER */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-lg">
            M
          </div>

          <h1 className="text-xl font-semibold mt-3 text-slate-800">
            MedAI
          </h1>

          <p className="text-sm text-slate-500">
            Smart Forecasting
          </p>
        </div>

        <h2 className="text-2xl font-semibold text-center text-slate-800">
          Welcome Back 👋
        </h2>

        <p className="text-sm text-slate-500 text-center mb-6">
          Login to your account
        </p>

        {/* 🔐 FORM */}
        <form onSubmit={handleLogin} className="space-y-4">

          {/* USERNAME */}
          <div className="relative">
            <User size={18} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              autoComplete="username"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/40 bg-white/70 focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </div>

          {/* PASSWORD */}
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-3 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-white/40 bg-white/70 focus:ring-2 focus:ring-blue-400 outline-none"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-400"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* ERROR */}
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          {/* FORGOT PASSWORD */}
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading || authLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:opacity-90 transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        {/* REGISTER */}
        <p className="text-sm text-center text-slate-500 mt-6">
          Don’t have an account?{" "}
          <Link
            to="/register"
            className="text-blue-600 font-semibold hover:underline"
          >
            Register
          </Link>
        </p>

      </motion.div>
    </div>
  );
}