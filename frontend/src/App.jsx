import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import { initAuth } from "./api/auth"; // 🔥 IMPORTANT

// 🔐 Public Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// 📊 User Pages
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Prediction from "./pages/Prediction";

// 👑 Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import Users from "./pages/admin/Users";

// 🧩 Layouts
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";

// 🔒 Route Protection
import PrivateRoute from "./routes/PrivateRoute";

export default function App() {
  const { user, token, loading } = useAuth();

  const role = user?.role || localStorage.getItem("role"); // 🔥 fallback
  const isAuthenticated = !!token;

  // 🔥 INIT TOKEN ON LOAD
  useEffect(() => {
    initAuth();
  }, []);

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // ================= REDIRECT LOGIC =================
  const getRedirectPath = () => {
    if (!isAuthenticated) return "/";
    return role === "admin" ? "/admin" : "/dashboard";
  };

  return (
    <BrowserRouter>
      <Toaster position="top-right" />

      <Routes>

        {/* ================= PUBLIC ================= */}

        <Route
          path="/"
          element={
            isAuthenticated
              ? <Navigate to={getRedirectPath()} replace />
              : <Login />
          }
        />

        <Route
          path="/register"
          element={
            isAuthenticated
              ? <Navigate to={getRedirectPath()} replace />
              : <Register />
          }
        />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ================= USER ================= */}
        <Route
          element={
            <PrivateRoute>
              {role !== "admin"
                ? <Layout />
                : <Navigate to="/admin" replace />}
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/predict" element={<Prediction />} />
        </Route>

        {/* ================= ADMIN ================= */}
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              {role === "admin"
                ? <AdminLayout />
                : <Navigate to="/dashboard" replace />}
            </PrivateRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<Users />} />
        </Route>

        {/* ================= FALLBACK ================= */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}