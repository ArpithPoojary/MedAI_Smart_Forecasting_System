import API from "./api";


/* ================= TOKEN HANDLING ================= */

// 🔐 Set token in axios + localStorage
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("token", token);

    // attach token to all requests
    API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    localStorage.removeItem("token");
    delete API.defaults.headers.common["Authorization"];
  }
};


// 🔁 Initialize token on app load (VERY IMPORTANT)
export const initAuth = () => {
  const token = localStorage.getItem("token");
  if (token) {
    setAuthToken(token);
  }
};


/* ================= AUTH ================= */

// 🔐 LOGIN (username OR email)
export const loginUser = async (credentials) => {
  try {
    const form = new URLSearchParams();

    // backend expects "username" field (even for email login)
    form.append("username", credentials.username);
    form.append("password", credentials.password);

    const response = await API.post("/auth/login", form, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const { access_token, user } = response.data;

    // ✅ store token properly
    if (access_token) {
      setAuthToken(access_token);

      localStorage.setItem("role", user?.role || "user");
      localStorage.setItem("user", JSON.stringify(user));
    }

    return response.data;

  } catch (error) {
    console.error("Login error:", error);

    throw error.response?.data?.detail || "Login failed";
  }
};


// 📝 REGISTER
export const registerUser = async (data) => {
  try {
    const response = await API.post("/auth/register", data);
    return response.data;

  } catch (error) {
    console.error("Register error:", error);

    throw error.response?.data?.detail || "Registration failed";
  }
};


/* ================= PASSWORD RESET ================= */

// 📧 SEND OTP
export const forgotPassword = async (email) => {
  try {
    const response = await API.post("/auth/forgot-password", { email });
    return response.data;

  } catch (error) {
    throw error.response?.data?.detail || "Failed to send OTP";
  }
};


// 🔁 RESET PASSWORD
export const resetPassword = async (data) => {
  try {
    const response = await API.post("/auth/reset-password", data);
    return response.data;

  } catch (error) {
    throw error.response?.data?.detail || "Password reset failed";
  }
};


/* ================= LOGOUT ================= */

export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");

  delete API.defaults.headers.common["Authorization"];
};