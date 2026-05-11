import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminNavbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // ================= DYNAMIC TITLE =================
  const getTitle = () => {
    if (location.pathname.includes("/admin/users")) return "Users";
    return "Dashboard";
  };

  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="
        h-16 
        px-6 
        flex items-center justify-between
        bg-white/80 
        backdrop-blur-xl 
        shadow-sm
      "
    >

      {/* ================= LEFT ================= */}
      <div className="flex items-center gap-2">
        <h1 className="text-lg md:text-xl font-semibold text-slate-800 tracking-tight">
          {getTitle()}
        </h1>

        {getTitle() === "Dashboard" && (
          <span className="text-yellow-500 text-lg">👑</span>
        )}
      </div>

      {/* ================= RIGHT ================= */}
      <div className="flex items-center gap-5">

        {/* USER PROFILE */}
        <div className="flex items-center gap-3 cursor-pointer group">

          {/* AVATAR */}
          <div className="
            w-10 h-10 
            rounded-full 
            bg-gradient-to-br from-blue-500 to-indigo-600 
            text-white 
            flex items-center justify-center 
            font-semibold 
            shadow-md
            group-hover:scale-105 transition
          ">
            {user?.username?.charAt(0)?.toUpperCase() || "A"}
          </div>

          {/* NAME + ROLE */}
          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-semibold text-slate-800">
              {user?.username || "Admin"}
            </p>
            <p className="text-xs text-slate-400">
              Administrator
            </p>
          </div>

          {/* DROPDOWN ICON */}
          <ChevronDown
            size={16}
            className="text-slate-400 group-hover:text-slate-600 transition"
          />
        </div>

        {/* LOGOUT BUTTON */}
        <button
          onClick={handleLogout}
          className="
            text-sm px-4 py-2 rounded-lg 
            bg-red-50 text-red-500 
            hover:bg-red-100 hover:scale-105
            transition font-medium
          "
        >
          Logout
        </button>

      </div>

      {/* 🔥 SOFT DIVIDER (IMPORTANT) */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
    </motion.div>
  );
}