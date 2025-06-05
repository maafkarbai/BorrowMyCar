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
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem("token"),
  loading: true,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is logged in on app start
  useEffect(() => {
    const token = localStorage.getItem("token");
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

      // Handle profile response format
      const user = res.data.data?.user || res.data.user;

      if (user) {
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: {
            user,
            token: localStorage.getItem("token"),
          },
        });
      } else {
        throw new Error("No user data received");
      }
    } catch (error) {
      console.error("Get current user error:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      dispatch({ type: "LOGOUT" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const login = async (credentials) => {
    dispatch({ type: "LOGIN_START" });
    try {
      const res = await API.post("/auth/login", credentials);

      // ROBUST handling of different response formats
      let token = null;
      let user = null;

      // Check multiple possible response structures
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
      }

      if (token && user) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user, token },
        });

        return { success: true };
      } else {
        throw new Error("Invalid login response format");
      }
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Login failed";

      dispatch({ type: "LOGIN_FAILURE", payload: message });
      return { success: false, error: message };
    }
  };

  const signup = async (userData) => {
    dispatch({ type: "LOGIN_START" });
    try {
      const formData = new FormData();

      // Append form fields
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

      const res = await API.post("/auth/signup", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Handle signup response (same robust logic as login)
      let token = null;
      let user = null;

      if (res.data.token && res.data.user) {
        token = res.data.token;
        user = res.data.user;
      } else if (res.data.data?.token && res.data.data?.user) {
        token = res.data.data.token;
        user = res.data.data.user;
      }

      if (token && user) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user, token },
        });

        return { success: true };
      } else {
        throw new Error("Invalid signup response format");
      }
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Signup failed";

      dispatch({ type: "LOGIN_FAILURE", payload: message });
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    dispatch({ type: "LOGOUT" });
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const value = {
    ...state,
    login,
    signup,
    logout,
    clearError,
    getCurrentUser,
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
