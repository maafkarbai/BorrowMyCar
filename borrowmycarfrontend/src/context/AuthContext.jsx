// src/context/AuthProvider.jsx - COMPLETE FIX
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

// Safe localStorage access
const getStorageItem = (key) => {
  try {
    return typeof window !== 'undefined' && window.localStorage 
      ? localStorage.getItem(key) 
      : null;
  } catch (error) {
    console.warn('localStorage access failed:', error);
    return null;
  }
};

const setStorageItem = (key, value) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, value);
    }
  } catch (error) {
    console.warn('localStorage setItem failed:', error);
  }
};

const removeStorageItem = (key) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.warn('localStorage removeItem failed:', error);
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  token: getStorageItem("token"),
  loading: true,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is logged in on app start
  useEffect(() => {
    const token = getStorageItem("token");
    if (token) {
      getCurrentUser();
    } else {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const getCurrentUser = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      const res = await API.get("/auth/profile");
      console.log("Get current user response:", res.data);

      // Handle different response formats
      let user = null;
      if (res.data.data?.user) {
        user = res.data.data.user;
      } else if (res.data.user) {
        user = res.data.user;
      } else if (res.data.data && !res.data.data.user) {
        user = res.data.data;
      }

      if (user) {
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: {
            user,
            token: getStorageItem("token"),
          },
        });
      } else {
        throw new Error("No user data received");
      }
    } catch (error) {
      console.error("Get current user error:", error);

      // Clear invalid tokens
      removeStorageItem("token");
      removeStorageItem("user");

      dispatch({ type: "LOGOUT" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const login = async (credentials) => {
    dispatch({ type: "LOGIN_START" });

    try {
      console.log("Login attempt with:", { email: credentials.email });

      const res = await API.post("/auth/login", {
        email: credentials.email.trim(),
        password: credentials.password,
      });

      console.log("Login response:", res.data);

      // Robust handling of different response formats
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
        // Store authentication data
        setStorageItem("token", token);
        setStorageItem("user", JSON.stringify(user));

        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user, token },
        });

        return { success: true, user };
      } else {
        console.error("Invalid login response format:", res.data);
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
        setStorageItem("token", token);
        setStorageItem("user", JSON.stringify(user));

        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user, token },
        });

        return { success: true, user };
      } else {
        // Signup successful but no immediate login (approval required)
        dispatch({ type: "SET_LOADING", payload: false });
        return { success: true, requiresApproval: true };
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
    // Clear local storage
    removeStorageItem("token");
    removeStorageItem("user");

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

    // Update localStorage
    setStorageItem("user", JSON.stringify(userData));
  };

  const value = {
    ...state,
    login,
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
