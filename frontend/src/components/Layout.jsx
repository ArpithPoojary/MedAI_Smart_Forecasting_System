import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">

      {/* 🔷 SIDEBAR */}
      <Sidebar />

      {/* 🔷 MAIN AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* 🔷 NAVBAR */}
        <Navbar />

        {/* 🔷 PAGE CONTENT */}
        <motion.main
          key={location.pathname} // 🔥 enables page transition
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
        >
          <Outlet />
        </motion.main>

      </div>
    </div>
  );
}