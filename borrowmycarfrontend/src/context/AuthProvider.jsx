// src/context/AuthProvider.jsx - FIXED with better error handling
import { createContext, useContext, useReducer, useEffect } from "react";
import API from "../api";

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, loading: true, error: null };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };
    case "LOGIN_FAILURE":
      return {
        ...state,
        loading: false,
        error: action.payload,
        isAuthenticated: false,
        user: null,
        token: null,
      };
    case "LOGOUT":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null,
        loading: false,
      };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "UPDATE_USER":
      return { ...state, user: action.payload };
    default:
      return state;
  }
};

// Helper functions for token storage
const getStoredToken = () => {
  // Since we're using HTTP-only cookies, token storage is not used
  // This function exists for backwards compatibility only
  return localStorage.getItem("token") || sessionStorage.getItem("token");
};

const getStoredUser = () => {
  try {
    const userData = localStorage.getItem("user") || sessionStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};

const storeAuthData = (token, user, rememberMe = false) => {
  // Always store user data for the session
  // Since we're using HTTP-only cookies for authentication, we mainly need user data
  const storage = rememberMe ? localStorage : sessionStorage;
  // Store user data in chosen storage, but don't store token (it's in HTTP-only cookie)
  storage.setItem("user", JSON.stringify(user));
  
  // Clear from other storage to avoid conflicts  
  const otherStorage = rememberMe ? sessionStorage : localStorage;
  otherStorage.removeItem("token");
  otherStorage.removeItem("user");
};

const clearAuthData = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
};

// Initialize state with stored data
const storedUser = getStoredUser();

const initialState = {
  isAuthenticated: !!storedUser,
  user: storedUser,
  token: null, // Token is in HTTP-only cookie, not accessible to JS
  loading: true,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is logged in on app start
  useEffect(() => {
    const user = getStoredUser();
    
    console.log("🚀 App startup - checking auth state:");
    console.log("  - Stored user:", user ? "present" : "absent");
    
    // Always check with server since auth is cookie-based
    console.log("  - Checking authentication with server...");
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const res = await API.get("/auth/profile");
      console.log("Get current user response:", res.data);

      // Handle different response formats robustly
      let user = null;
      if (res.data.data?.user) {
        user = res.data.data.user;
      } else if (res.data.user) {
        user = res.data.user;
      } else if (res.data.data && !res.data.data.user) {
        user = res.data.data;
      }

      if (user) {
        // Store the user data if we don't have it stored yet
        if (!getStoredUser()) {
          console.log("  - Storing user data from server response");
          // Store in sessionStorage by default for cookie-based auth
          sessionStorage.setItem("user", JSON.stringify(user));
        }
        
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: {
            user,
            token: "cookie-session", // Placeholder since token is in HTTP-only cookie
          },
        });
      } else {
        throw new Error("No user data received");
      }
    } catch (error) {
      console.error("Get current user error:", error);
      // Clear invalid tokens
      clearAuthData();
      dispatch({ type: "LOGOUT" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const login = async (credentials) => {
    dispatch({ type: "LOGIN_START" });

    try {
      console.log("🔐 Login attempt with:", { 
        email: credentials.email, 
        rememberMe: credentials.rememberMe,
        rememberMeType: typeof credentials.rememberMe,
        credentialsKeys: Object.keys(credentials)
      });
      
      const requestBody = {
        email: credentials.email.trim(),
        password: credentials.password,
        rememberMe: credentials.rememberMe,
      };
      
      console.log("📤 Request body:", { ...requestBody, password: '[HIDDEN]' });
      
      const res = await API.post("/auth/login", requestBody);

      console.log("Login response:", res.data);

      // FIXED: Robust handling of different response formats
      let token = null;
      let user = null;

      // Try different response structures
      if (res.data.token && res.data.user) {
        // Direct format: { token, user }
        token = res.data.token;
        user = res.data.user;
      } else if (res.data.data?.token && res.data.data?.user) {
        // Nested format: { data: { token, user } }
        token = res.data.data.token;
        user = res.data.data.user;
      } else if (res.data.success && res.data.token) {
        // Success format: { success: true, token, user }
        token = res.data.token;
        user = res.data.user;
      } else if (res.data.accessToken) {
        // Alternative token field
        token = res.data.accessToken;
        user = res.data.user || res.data.data?.user;
      }

      if (token && user) {
        // Store user data with rememberMe preference (token is in HTTP-only cookie)
        const shouldRemember = Boolean(credentials.rememberMe);
        console.log("Storing user data - rememberMe:", shouldRemember);
        storeAuthData(token, user, shouldRemember);

        console.log("User data stored. Checking storage:");
        console.log("localStorage user:", localStorage.getItem("user") ? "present" : "absent");
        console.log("sessionStorage user:", sessionStorage.getItem("user") ? "present" : "absent");

        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user, token },
        });

        return { success: true, user };
      } else {
        console.error("Invalid login response format:", res.data);
        console.error("Expected: { token, user } but got:", { 
          hasToken: !!token, 
          hasUser: !!user,
          responseKeys: Object.keys(res.data)
        });
        throw new Error("Invalid response format - missing token or user data");
      }
    } catch (error) {
      console.error("Login error:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Login failed. Please check your credentials.";

      dispatch({ type: "LOGIN_FAILURE", payload: message });
      return { success: false, error: message };
    }
  };

  const signup = async (userData) => {
    dispatch({ type: "LOGIN_START" });

    try {
      const formData = new FormData();

      // Append form fields (exclude confirmPassword and files)
      Object.keys(userData).forEach((key) => {
        if (
          key !== "confirmPassword" &&
          key !== "files" &&
          typeof userData[key] !== "object"
        ) {
          formData.append(key, userData[key]);
        }
      });

      // Append files if they exist
      if (userData.files) {
        Object.keys(userData.files).forEach((key) => {
          if (userData.files[key]) {
            formData.append(key, userData.files[key]);
          }
        });
      }

      console.log("Signup attempt...");
      const res = await API.post("/auth/signup", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Signup response:", res.data);

      // Handle signup response (same robust logic as login)
      let token = null;
      let user = null;

      if (res.data.token && res.data.user) {
        token = res.data.token;
        user = res.data.user;
      } else if (res.data.data?.token && res.data.data?.user) {
        token = res.data.data.token;
        user = res.data.data.user;
      } else if (res.data.success) {
        token = res.data.token;
        user = res.data.user || res.data.data?.user;
      }

      if (token && user) {
        storeAuthData(token, user, false); // Signup doesn't need rememberMe

        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user, token },
        });

        return { success: true, user };
      } else {
        // Signup successful but no immediate login (approval required)
        dispatch({ type: "SET_LOADING", payload: false });
        return {
          success: true,
          requiresApproval: true,
          message:
            res.data.message ||
            "Account created successfully. Awaiting admin approval.",
        };
      }
    } catch (error) {
      console.error("Signup error:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Registration failed. Please try again.";

      dispatch({ type: "LOGIN_FAILURE", payload: message });
      return { success: false, error: message };
    }
  };

  const logout = () => {
    // Clear auth data from both storages
    clearAuthData();

    // Clear state
    dispatch({ type: "LOGOUT" });

    // Optional: Call logout endpoint
    try {
      API.post("/auth/logout").catch(() => {
        // Ignore logout endpoint errors
      });
    } catch {
      // Ignore errors
    }
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const updateUser = (userData) => {
    // Update user in state
    dispatch({ type: "UPDATE_USER", payload: userData });

    // Update in current storage location
    const currentStorage = localStorage.getItem("user") ? localStorage : sessionStorage;
    if (currentStorage) {
      currentStorage.setItem("user", JSON.stringify(userData));
    }
  };

  // Direct login method for when we already have token and user data (e.g., after email verification)
  const loginWithToken = (token, user, rememberMe = false) => {
    try {
      if (!user) {
        throw new Error("User data is required");
      }

      console.log("Direct login with user:", { user: user.name, email: user.email });

      // Store user data only (token is in HTTP-only cookie)
      storeAuthData(token, user, rememberMe);

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user, token: "cookie-session" },
      });

      return { success: true, user };
    } catch (error) {
      console.error("Direct login error:", error);
      dispatch({ type: "LOGIN_FAILURE", payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const value = {
    ...state,
    login,
    loginWithToken,
    signup,
    logout,
    clearError,
    getCurrentUser,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthProvider;
