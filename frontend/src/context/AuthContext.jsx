import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef
} from "react";
import { jwtDecode } from "jwt-decode";
import { setAuthToken } from "../api/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const logoutTimer = useRef(null);

  // ================= AUTO LOGOUT =================
  const setupAutoLogout = (decoded) => {
    if (!decoded?.exp) return;

    const expiryTime = decoded.exp * 1000 - Date.now();

    if (expiryTime <= 0) {
      logout(true);
      return;
    }

    if (logoutTimer.current) {
      clearTimeout(logoutTimer.current);
    }

    logoutTimer.current = setTimeout(() => {
      console.log("⏰ Token expired → auto logout");
      logout(true);
    }, expiryTime);
  };

  // ================= LOAD USER ON REFRESH =================
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken);

        if (!decoded?.exp || decoded.exp * 1000 < Date.now()) {
          throw new Error("Token expired");
        }

        // ✅ Restore token
        setToken(storedToken);
        setAuthToken(storedToken);

        // ✅ Restore user (prefer stored, fallback to decoded)
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser({
            id: decoded.sub,
            username: decoded.sub,
            role: decoded.role || "user",
          });
        }

        setupAutoLogout(decoded);

      } catch (err) {
        console.error("❌ Invalid token", err);
        logout(false);
      }
    }

    setLoading(false);

    return () => {
      if (logoutTimer.current) {
        clearTimeout(logoutTimer.current);
      }
    };
  }, []);

  // ================= LOGIN =================
  const login = (response) => {
    try {
      // ✅ Extract token
      const newToken = response?.access_token;

      if (!newToken) {
        console.error("❌ No token received:", response);
        return;
      }

      console.log("✅ TOKEN RECEIVED:", newToken);

      const decoded = jwtDecode(newToken);

      const userData = response?.user || {
        id: decoded.sub,
        username: decoded.sub,
        role: decoded.role || "user",
      };

      // ✅ Save to localStorage
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(userData));

      // ✅ Set state
      setToken(newToken);
      setUser(userData);
      setAuthToken(newToken);

      setupAutoLogout(decoded);

    } catch (err) {
      console.error("❌ Login failed", err);
    }
  };

  // ================= LOGOUT =================
  const logout = (redirect = false) => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setToken(null);
    setAuthToken(null);

    if (logoutTimer.current) {
      clearTimeout(logoutTimer.current);
    }

    if (redirect) {
      window.location.replace("/");
    }
  };

  // ================= CONTEXT VALUE =================
  const value = useMemo(() => ({
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    logout
  }), [user, token, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ================= HOOK =================
export const useAuth = () => useContext(AuthContext);