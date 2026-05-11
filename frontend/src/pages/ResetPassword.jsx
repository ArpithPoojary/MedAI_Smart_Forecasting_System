import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verified, setVerified] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const inputsRef = useRef([]);

  // ================= TIMER =================
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  // ================= OTP =================
  const handleOtpChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const fullOtp = otp.join("");

  // ================= VERIFY OTP =================
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (fullOtp.length !== 6) {
      return setError("Enter complete OTP");
    }

    try {
      setLoading(true);

      await axios.post("http://127.0.0.1:8000/auth/verify-otp", {
        email,
        otp: fullOtp,
      });

      setVerified(true);
      setSuccess("OTP verified ✅");

    } catch (err) {
      setError(err.response?.data?.detail || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // ================= RESEND =================
  const handleResend = async () => {
    try {
      setLoading(true);

      await axios.post("http://127.0.0.1:8000/auth/send-otp", {
        email,
      });

      setSuccess("OTP resent 📩");
      setTimer(60);
      setCanResend(false);

    } catch {
      setError("Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  // ================= RESET PASSWORD =================
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newPassword || !confirmPassword)
      return setError("All fields are required");

    if (newPassword.length < 6)
      return setError("Password must be at least 6 characters");

    if (newPassword !== confirmPassword)
      return setError("Passwords do not match");

    try {
      setLoading(true);

      await axios.post("http://127.0.0.1:8000/auth/reset-password", {
        email,
        new_password: newPassword,
      });

      setSuccess("Password reset successful 🎉");

      setTimeout(() => navigate("/"), 1500);

    } catch (err) {
      setError(err.response?.data?.detail || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">

      {/* 🔥 BACKGROUND IMAGE */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/login-bg.png')" }}
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
        shadow-[0_20px_60px_rgba(0,0,0,0.12)] space-y-6"
      >

        {/* LOGO */}
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold shadow-lg">
            M
          </div>
          <h1 className="text-xl font-semibold mt-3">MedAI</h1>
          <p className="text-sm text-slate-500">Smart Forecasting</p>
        </div>

        <h2 className="text-2xl font-semibold text-center">
          Reset Password 🔁
        </h2>

        {!verified ? (
          <>
            <p className="text-sm text-center text-slate-500">
              Enter OTP sent to <span className="font-medium">{email}</span>
            </p>

            {/* OTP INPUT */}
            <div className="flex justify-between gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputsRef.current[index] = el)}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) =>
                    handleOtpChange(e.target.value, index)
                  }
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-12 h-12 text-center text-lg rounded-xl
                  bg-white/70 backdrop-blur
                  border border-white/40
                  focus:ring-2 focus:ring-blue-400 outline-none"
                />
              ))}
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">{success}</p>}

            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              onClick={handleVerifyOtp}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </motion.button>

            <div className="text-center text-sm">
              {canResend ? (
                <span
                  onClick={handleResend}
                  className="text-blue-600 cursor-pointer hover:underline"
                >
                  Resend OTP
                </span>
              ) : (
                <span className="text-slate-400">
                  Resend in {timer}s
                </span>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-center text-slate-500">
              Set your new password
            </p>

            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/70 border border-white/40"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/70 border border-white/40"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">{success}</p>}

            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              onClick={handleResetPassword}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </motion.button>
          </>
        )}

      </motion.div>
    </div>
  );
}