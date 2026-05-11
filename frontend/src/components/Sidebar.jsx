import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  UploadCloud,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { motion } from "framer-motion";

export default function Sidebar() {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Upload Data", path: "/upload", icon: UploadCloud },
    { name: "Prediction", path: "/predict", icon: BarChart3 },
    { name: "Analytics", path: "/analytics", icon: BarChart3 },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="w-64 h-full glass p-5 flex flex-col">

      {/* 🔷 BRAND */}
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
          M
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-800">MedAI</p>
          <p className="text-xs text-slate-400">Smart Forecasting</p>
        </div>
      </div>

      {/* 🔷 NAVIGATION */}
      <nav className="flex-1 space-y-2">

        {menuItems.map((item, i) => (
          <NavLink key={item.path} to={item.path}>
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all
                ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "text-slate-600 hover:bg-white/50"
                }`}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </motion.div>
            )}
          </NavLink>
        ))}

      </nav>

      {/* 🔷 LOGOUT */}
      <div className="pt-6 border-t border-white/30">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-slate-500 hover:text-red-500 hover:bg-red-50/60 rounded-xl transition-all"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Logout</span>
        </motion.button>
      </div>
    </div>
  );
}