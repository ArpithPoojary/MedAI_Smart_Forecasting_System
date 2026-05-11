import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// 🔐 Auth Context
import { AuthProvider } from "./context/AuthContext";

// 🔥 Disable StrictMode (prevents double API calls in dev)
ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);