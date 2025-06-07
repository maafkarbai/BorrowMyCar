// borrowmycarfrontend/src/api.js - COMPLETELY FIXED VERSION
import axios from "axios";

// Create API instance with comprehensive configuration
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 30000, // 30 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to automatically include token and handle requests
API.interceptors.request.use(
  (req) => {
    // Get token from localStorage
    const token = localStorage.getItem("token");
    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }

    // Handle FormData for file uploads
    if (req.data instanceof FormData) {
      delete req.headers["Content-Type"]; // Let browser set it for FormData
    }

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`🚀 ${req.method?.toUpperCase()} ${req.url}`, {
        headers: req.headers,
        data: req.data instanceof FormData ? "FormData" : req.data,
      });
    }

    return req;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for enhanced error handling and token management
API.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`✅ Response ${response.status}:`, response.data);
    }
    return response;
  },
  (error) => {
    console.error("❌ API Error:", error);

    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - clear auth data and redirect
          console.log("🔐 Authentication failed - clearing session");
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          // Only redirect if not already on auth pages
          const currentPath = window.location.pathname;
          if (
            !currentPath.includes("/login") &&
            !currentPath.includes("/signup") &&
            !currentPath.includes("/auth")
          ) {
            // Delay redirect to prevent immediate redirect loops
            setTimeout(() => {
              window.location.href = "/login";
            }, 100);
          }
          break;

        case 403:
          // Forbidden - user doesn't have permission
          console.log("🚫 Access forbidden");
          break;

        case 404:
          // Not found
          console.log("❓ Resource not found");
          break;

        case 422:
          // Validation error
          console.log("⚠️ Validation error:", data.errors);
          break;

        case 429:
          // Rate limit exceeded
          console.log("🐌 Rate limit exceeded");
          break;

        case 500:
          // Server error
          console.log("💥 Server error");
          break;

        default:
          console.log(`❌ HTTP Error ${status}`);
      }

      // Use server error message if available
      if (data?.message) {
        error.message = data.message;
      } else if (data?.error) {
        error.message = data.error;
      }
    } else if (error.code === "ECONNABORTED") {
      // Timeout error
      error.message =
        "Request timeout. Please check your connection and try again.";
    } else if (!error.response) {
      // Network error
      error.message =
        "Network error. Please check your connection and try again.";
    }

    return Promise.reject(error);
  }
);

// Helper functions for common API operations

/**
 * Generic GET request with error handling
 */
export const apiGet = async (url, config = {}) => {
  try {
    const response = await API.get(url, config);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Generic POST request with error handling
 */
export const apiPost = async (url, data = {}, config = {}) => {
  try {
    const response = await API.post(url, data, config);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Generic PUT request with error handling
 */
export const apiPut = async (url, data = {}, config = {}) => {
  try {
    const response = await API.put(url, data, config);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Generic PATCH request with error handling
 */
export const apiPatch = async (url, data = {}, config = {}) => {
  try {
    const response = await API.patch(url, data, config);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Generic DELETE request with error handling
 */
export const apiDelete = async (url, config = {}) => {
  try {
    const response = await API.delete(url, config);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Upload file with progress tracking
 */
export const uploadFile = async (url, formData, onProgress = null) => {
  try {
    const response = await API.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: onProgress,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    // Check if token is expired (basic check)
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch {
    return false;
  }
};

/**
 * Get current user from token
 */
export const getCurrentUser = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.id || payload.userId || payload._id,
      role: payload.role,
      isApproved: payload.isApproved,
      email: payload.email,
      name: payload.name,
    };
  } catch {
    return null;
  }
};

/**
 * Clear authentication data
 */
export const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

/**
 * API Health check
 */
export const checkAPIHealth = async () => {
  try {
    const response = await API.get("/health");
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Refresh token (if your backend supports it)
 */
export const refreshToken = async () => {
  try {
    const response = await API.post("/auth/refresh");
    const { token } = response.data;

    if (token) {
      localStorage.setItem("token", token);
      return { success: true, token };
    }

    throw new Error("No token received");
  } catch (error) {
    clearAuth();
    return { success: false, error: error.message };
  }
};

/**
 * Get user profile
 */
export const getUserProfile = async () => {
  try {
    const response = await API.get("/auth/profile");
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userData) => {
  try {
    const response = await API.patch("/auth/profile", userData);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Change password
 */
export const changePassword = async (passwordData) => {
  try {
    const response = await API.patch("/auth/change-password", passwordData);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Cars API functions
 */
export const getCars = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await API.get(
      `/cars${queryString ? `?${queryString}` : ""}`
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getCar = async (carId) => {
  try {
    const response = await API.get(`/cars/${carId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const createCar = async (carData) => {
  try {
    const response = await API.post("/cars", carData);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Bookings API functions
 */
export const getBookings = async (type = "me") => {
  try {
    const endpoint = type === "owner" ? "/bookings/owner" : "/bookings/me";
    const response = await API.get(endpoint);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const createBooking = async (bookingData) => {
  try {
    const response = await API.post("/bookings", bookingData);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateBooking = async (bookingId, updateData) => {
  try {
    const response = await API.put(`/bookings/${bookingId}`, updateData);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Export the main API instance as default
export default API;
