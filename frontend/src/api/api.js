import axios from "axios";

// =======================================================
// ================= BASE INSTANCE =======================
// =======================================================

const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000",

  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
  },
});

// =======================================================
// ================= TOKEN HELPERS =======================
// =======================================================

const getToken = () => {
  return localStorage.getItem("token");
};

const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
};

// =======================================================
// ================= SET AUTH TOKEN ======================
// =======================================================

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("token", token);

    API.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${token}`;

  } else {
    clearAuth();

    delete API.defaults.headers.common[
      "Authorization"
    ];
  }
};

// =======================================================
// ================= INIT TOKEN ==========================
// =======================================================

const initToken = () => {
  try {
    const token = getToken();

    if (token) {
      API.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;
    }

  } catch (error) {
    console.error(
      "Token initialization failed:",
      error
    );
  }
};

initToken();

// =======================================================
// ================= REQUEST INTERCEPTOR =================
// =======================================================

API.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

// =======================================================
// ================= RESPONSE INTERCEPTOR ================
// =======================================================

API.interceptors.response.use(
  (response) => response,

  (error) => {
    const status =
      error?.response?.status;

    // ===================================================
    // SESSION EXPIRED
    // ===================================================

    if (status === 401) {
      console.warn(
        "⚠️ Session expired"
      );

      clearAuth();

      window.location.href = "/";

      return Promise.reject({
        status: 401,
        message:
          "Session expired. Please login again.",
      });
    }

    // ===================================================
    // TIMEOUT
    // ===================================================

    if (
      error.code ===
      "ECONNABORTED"
    ) {
      return Promise.reject({
        status: 408,
        message:
          "Request timed out",
      });
    }

    // ===================================================
    // NETWORK ERROR
    // ===================================================

    if (!error.response) {
      return Promise.reject({
        status: 500,
        message:
          "Backend server not reachable",
      });
    }

    // ===================================================
    // STANDARDIZED ERROR
    // ===================================================

    return Promise.reject({
      status,

      message:
        error.response?.data
          ?.detail ||
        error.response?.data
          ?.message ||
        error.message ||
        "Something went wrong",
    });
  }
);

// =======================================================
// ================= AUTH APIs ===========================
// =======================================================

export const loginUser = async (
  credentials
) => {
  const form =
    new URLSearchParams();

  form.append(
    "username",
    credentials.username
  );

  form.append(
    "password",
    credentials.password
  );

  const response =
    await API.post(
      "/auth/login",
      form,
      {
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
      }
    );

  const token =
    response?.data?.access_token;

  if (token) {
    setAuthToken(token);
  }

  return response.data;
};

export const registerUser = (
  data
) =>
  API.post(
    "/auth/register",
    data
  );

export const changePassword = (
  data
) =>
  API.post(
    "/auth/change-password",
    data
  );

// =======================================================
// ================= DASHBOARD APIs ======================
// =======================================================

export const getDashboard = () =>
  API.get("/dashboard/");

// =======================================================
// ================= UPLOAD APIs =========================
// =======================================================

export const uploadFile = (
  file
) => {
  const formData =
    new FormData();

  formData.append("file", file);

  return API.post(
    "/upload/",
    formData,
    {
      headers: {
        "Content-Type":
          "multipart/form-data",
      },

      timeout: 60000,
    }
  );
};

// =======================================================
// ================= UPLOAD HISTORY ======================
// =======================================================

export const getUploadHistory =
  () =>
    API.get(
      "/upload-history/"
    );

export const deleteUploadHistory =
  (id) =>
    API.delete(
      `/upload-history/${id}`
    );

// =======================================================
// ================= PREDICTION APIs =====================
// =======================================================

export const getPrediction = (
  params
) =>
  API.get("/predict", {
    params,
  });

export const getPredictionInsights =
  () =>
    API.get(
      "/predict/insights"
    );

// =======================================================
// ================= WEATHER APIs ========================
// =======================================================

export const getWeather = () =>
  API.get("/weather");

// =======================================================
// ================= ADMIN APIs ==========================
// =======================================================

export const getAdminUsers = () =>
  API.get("/admin/users");

export const deleteUser = (
  userId
) =>
  API.delete(
    `/admin/user/${userId}`
  );

export const getAdminUploads =
  () =>
    API.get(
      "/admin/uploads"
    );

export const getAdminUploadsPaginated =
  (params) =>
    API.get(
      "/admin/uploads",
      {
        params,
      }
    );

export const getAdminStats = () =>
  API.get("/admin/stats");

export const getAdminModels = () =>
  API.get("/admin/models");

// =======================================================
// ================= CHART APIs ==========================
// =======================================================

export const getUploadTrend = (
  range = "7d"
) =>
  API.get(
    "/admin/upload-trend",
    {
      params: { range },
    }
  );

export const getModelMAE = () =>
  API.get("/admin/model-mae");

// =======================================================
// ================= EXPORT ==============================
// =======================================================

export default API;