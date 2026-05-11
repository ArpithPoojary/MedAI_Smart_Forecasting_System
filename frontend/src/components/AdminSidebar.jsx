import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

export default function AdminSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <aside
      className="
        w-64 h-full 
        bg-white/80 backdrop-blur-xl 
        flex flex-col 
        px-5 py-6
        shadow-lg
      "
    >

      {/* ================= LOGO ================= */}
      <div className="mb-10 flex items-center gap-3">
        <div className="
          w-11 h-11 rounded-xl 
          bg-gradient-to-br from-indigo-500 to-blue-600 
          text-white flex items-center justify-center 
          font-bold shadow-md
        ">
          👑
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-800 leading-tight">
            Admin Panel
          </h2>
          <p className="text-xs text-slate-400">
            Management
          </p>
        </div>
      </div>

      {/* ================= NAV ================= */}
      <nav className="flex flex-col gap-2 text-sm">

        {/* DASHBOARD */}
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            `relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
              isActive
                ? "text-blue-600 font-medium bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`
          }
        >
          {({ isActive }) => (
            <>
              {/* ACTIVE INDICATOR */}
              {isActive && (
                <motion.span
                  layoutId="active-pill"
                  className="absolute left-0 top-0 h-full w-1 rounded-r bg-blue-500"
                />
              )}

              <LayoutDashboard size={18} />
              Dashboard
            </>
          )}
        </NavLink>

        {/* USERS */}
        <NavLink
          to="/admin/users"
          className={({ isActive }) =>
            `relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
              isActive
                ? "text-blue-600 font-medium bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="active-pill"
                  className="absolute left-0 top-0 h-full w-1 rounded-r bg-blue-500"
                />
              )}

              <Users size={18} />
              Users
            </>
          )}
        </NavLink>

      </nav>

      {/* ================= FOOTER ================= */}
      <div className="mt-auto pt-6 space-y-4">

        {/* SOFT DIVIDER */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className="
            flex items-center gap-3 text-sm 
            text-slate-500 
            hover:text-red-500 
            hover:bg-red-50
            px-3 py-2 rounded-lg
            transition-all duration-200
          "
        >
          <LogOut size={16} />
          Logout
        </button>

        {/* INFO */}
        <p className="text-xs text-slate-400 px-1">
          Admin Access
        </p>
      </div>
    </aside>
  );
}