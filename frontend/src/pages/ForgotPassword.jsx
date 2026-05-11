import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔥 SEND OTP (UNCHANGED)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      return setError("Email is required");
    }

    try {
      setLoading(true);

      await axios.post("http://127.0.0.1:8000/auth/send-otp", {
        email,
      });

      setSuccess("OTP sent to your email 📩");

      setTimeout(() => {
        navigate("/reset-password", { state: { email } });
      }, 1200);

    } catch (err) {
      console.error(err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to send OTP");
      }
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

      {/* 🔥 OVERLAY */}
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
          Forgot Password 🔐
        </h2>

        <p className="text-sm text-slate-500 text-center mb-6">
          Enter your email to receive OTP
        </p>

        {/* ================= FORM ================= */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* EMAIL INPUT */}
          <div className="relative group">
            <Mail
              size={18}
              className="absolute left-3 top-3 text-slate-400 group-focus-within:text-blue-500 transition"
            />

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            {loading ? "Sending..." : "Send OTP"}
          </motion.button>

        </form>

        {/* FOOTER */}
        <div className="mt-6 text-center text-sm space-y-2">

          <p
            onClick={() => navigate("/")}
            className="text-blue-600 cursor-pointer hover:underline"
          >
            Back to Login
          </p>

        </div>

      </motion.div>
    </div>
  );
}