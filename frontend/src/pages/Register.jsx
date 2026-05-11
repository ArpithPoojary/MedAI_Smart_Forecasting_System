import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";
import { motion } from "framer-motion";
import { User, Mail, Lock } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { username, email, password, confirm_password } = formData;

    if (!username || !email || !password || !confirm_password) {
      return setError("All fields are required");
    }

    if (password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    if (password !== confirm_password) {
      return setError("Passwords do not match");
    }

    try {
      setLoading(true);
      await registerUser(formData);
      setSuccess("Account created successfully 🎉");

      setTimeout(() => {
        navigate("/");
      }, 1500);

    } catch (err) {
      setError(err.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">

      {/* ================= BACKGROUND IMAGE ================= */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/login-bg.png')",
        }}
      />

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]" />

      {/* ================= CARD ================= */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md rounded-3xl p-8
        bg-white/60 backdrop-blur-xl
        border border-white/40
        shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
      >

        {/* LOGO */}
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

        {/* TITLE */}
        <h2 className="text-2xl font-semibold text-center text-slate-800">
          Create Account 🚀
        </h2>

        <p className="text-sm text-slate-500 text-center mb-6">
          Register to get started
        </p>

        {/* ================= FORM ================= */}
        <form onSubmit={handleRegister} className="space-y-4">

          {/* USERNAME */}
          <div className="relative group">
            <User size={18} className="absolute left-3 top-3 text-slate-400 group-focus-within:text-blue-500 transition" />
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
              className="w-full pl-10 pr-4 py-3 rounded-xl
              bg-white/70 backdrop-blur
              border border-white/40
              focus:ring-2 focus:ring-blue-400
              outline-none transition"
            />
          </div>

          {/* EMAIL */}
          <div className="relative group">
            <Mail size={18} className="absolute left-3 top-3 text-slate-400 group-focus-within:text-blue-500 transition" />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              className="w-full pl-10 pr-4 py-3 rounded-xl
              bg-white/70 backdrop-blur
              border border-white/40
              focus:ring-2 focus:ring-blue-400
              outline-none transition"
            />
          </div>

          {/* PASSWORD */}
          <div className="relative group">
            <Lock size={18} className="absolute left-3 top-3 text-slate-400 group-focus-within:text-blue-500 transition" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              className="w-full pl-10 pr-4 py-3 rounded-xl
              bg-white/70 backdrop-blur
              border border-white/40
              focus:ring-2 focus:ring-blue-400
              outline-none transition"
            />
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="relative group">
            <Lock size={18} className="absolute left-3 top-3 text-slate-400 group-focus-within:text-blue-500 transition" />
            <input
              type="password"
              name="confirm_password"
              placeholder="Confirm Password"
              value={formData.confirm_password}
              onChange={handleChange}
              disabled={loading}
              className="w-full pl-10 pr-4 py-3 rounded-xl
              bg-white/70 backdrop-blur
              border border-white/40
              focus:ring-2 focus:ring-blue-400
              outline-none transition"
            />
          </div>

          {/* ERROR */}
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          {/* SUCCESS */}
          {success && (
            <p className="text-green-600 text-sm">{success}</p>
          )}

          {/* BUTTON */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold transition ${
              loading
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl"
            }`}
          >
            {loading ? "Creating..." : "Register"}
          </motion.button>

        </form>

        {/* FOOTER */}
        <div className="mt-6 text-center text-sm space-y-2">
          <p>
            Already have an account?{" "}
            <span
              onClick={() => navigate("/")}
              className="text-blue-600 cursor-pointer hover:underline"
            >
              Login
            </span>
          </p>
        </div>

      </motion.div>
    </div>
  );
}