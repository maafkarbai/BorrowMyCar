// src/context/AuthContext.jsx
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
      };
    case "LOGIN_FAILURE":
      return {
        ...state,
        loading: false,
        error: action.payload,
        isAuthenticated: false,
      };
    case "LOGOUT":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
      };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem("token"),
  loading: false,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is logged in on app start
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Verify token and get user data
      getCurrentUser();
    }
  }, []);

  const getCurrentUser = async () => {
    try {
      const res = await API.get("/auth/profile");
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          user: res.data.data.user,
          token: localStorage.getItem("token"),
        },
      });
    } catch (error) {
      localStorage.removeItem("token");
      dispatch({ type: "LOGOUT" });
    }
  };

  const login = async (credentials) => {
    dispatch({ type: "LOGIN_START" });
    try {
      const res = await API.post("/auth/login", credentials);
      const { token, user } = res.data.data;

      localStorage.setItem("token", token);
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user, token },
      });

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
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
        if (key !== "confirmPassword" && typeof userData[key] !== "object") {
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

      const res = await API.post("/auth/signup", formData);
      const { token, user } = res.data.data;

      localStorage.setItem("token", token);
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user, token },
      });

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Signup failed";
      dispatch({ type: "LOGIN_FAILURE", payload: message });
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
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
