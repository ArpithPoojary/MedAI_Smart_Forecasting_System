import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/AdminLayout";

export default function Admin() {
  const { user, loading } = useAuth();

  // ⏳ Wait for auth to load
  if (loading) return <div className="p-8">Loading...</div>;

  // 🔐 Block non-admin
  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // ✅ Render layout only
  return <AdminLayout />;
}