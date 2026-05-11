import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";

import AdminSidebar from "./AdminSidebar";
import AdminNavbar from "./AdminNavbar";

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-hidden">

      {/* ================= SIDEBAR ================= */}
      <aside className="
        w-64 
        bg-white/80 
        backdrop-blur-xl 
        shadow-[4px_0_20px_rgba(0,0,0,0.04)]
        flex flex-col
      ">
        <AdminSidebar />
      </aside>

      {/* ================= MAIN ================= */}
      <div className="flex-1 flex flex-col">

        {/* ================= NAVBAR ================= */}
        <div className="
          sticky top-0 z-30 
          bg-white/80 
          backdrop-blur-xl 
          shadow-sm
        ">
          <AdminNavbar />

          {/* 🔥 SOFT DIVIDER (instead of border) */}
          <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>

        {/* ================= CONTENT ================= */}
        <motion.main
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 overflow-y-auto px-8 py-6"
        >
          {/* 🔥 PERFECT WIDTH + SPACING */}
          <div className="max-w-[1400px] mx-auto space-y-8">
            <Outlet />
          </div>
        </motion.main>

      </div>
    </div>
  );
}