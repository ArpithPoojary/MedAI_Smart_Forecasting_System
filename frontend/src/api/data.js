import API from "./api";

// ================= COMMON HANDLER =================
const handleRequest = async (request) => {
  try {
    const response = await request;

    // ✅ Always return clean data
    return response?.data ?? {};

  } catch (err) {
    console.error("API Error:", err);

    // 🔐 Token expired / unauthorized
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    // Backend error message
    if (err.response?.data) {
      throw err.response.data;
    }

    // Network fallback
    throw { detail: "Network error. Please try again." };
  }
};


// ================= DASHBOARD =================
export const getDashboard = () =>
  handleRequest(API.get("/dashboard/"));


// ================= ANALYTICS =================
export const getAnalytics = () =>
  handleRequest(API.get("/analytics/"));


// ================= UPLOAD =================
export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return handleRequest(
    API.post("/upload/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
  );
};


// ================= 🔮 SINGLE PREDICTION =================
export const getPrediction = (month, day, category, medicine_name) =>
  handleRequest(
    API.get("/predict/predict", {
      params: { month, day, category, medicine_name },
    })
  );


// ================= 🚀 AI INSIGHTS (MAIN) =================
export const getPredictionInsights = async () => {
  const data = await handleRequest(API.get("/predict/insights"));

  // ✅ Normalize response (VERY IMPORTANT)
  return {
    restock: data?.restock ?? [],
    expiry: data?.expiry ?? [],
    overstock: data?.overstock ?? [],
    chart: data?.chart ?? [],
    critical_alert: data?.critical_alert ?? { count: 0 }
  };
};


// ================= WEATHER =================
export const getWeather = () =>
  handleRequest(API.get("/weather/"));


// ================= SETTINGS =================
export const changePassword = (data) =>
  handleRequest(API.post("/auth/change-password", data));