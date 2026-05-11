import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // ⏳ AUTH LOADING STATE
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // 🔒 NOT LOGGED IN
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/"
        state={{ from: location }}
        replace
      />
    );
  }

  // ✅ AUTHORIZED
  return children;
};

export default PrivateRoute;