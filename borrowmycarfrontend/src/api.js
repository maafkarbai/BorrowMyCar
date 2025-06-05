import axios from "axios";

// Create API instance with base URL from environment variables
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 10000, // 10 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to automatically include token
API.interceptors.request.use(
  (req) => {
    const token = localStorage.getItem("token");
    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }

    // Log request for debugging (remove in production)
    console.log(`${req.method?.toUpperCase()} ${req.url}`, {
      data: req.data,
      headers: req.headers,
    });

    return req;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for better error handling
API.interceptors.response.use(
  (response) => {
    // Log successful responses (remove in production)
    console.log(`Response ${response.status}:`, response.data);
    return response;
  },
  (error) => {
    console.error("API Error:", error);

    // Handle token expiration
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Only redirect if not already on login page
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    // Handle network errors
    if (error.code === "ECONNABORTED") {
      error.message = "Request timeout. Please check your connection.";
    } else if (!error.response) {
      error.message = "Network error. Please check your connection.";
    }

    return Promise.reject(error);
  }
);

export default API;
