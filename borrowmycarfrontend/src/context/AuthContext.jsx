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

// Cookie-based authentication - no local storage needed
// Tokens are now stored in HTTP-only cookies on the server

const initialState = {
  isAuthenticated: false,
  user: null,
  token: null, // No longer stored in frontend
  loading: true,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is logged in on app start (cookie-based)
  useEffect(() => {
    getCurrentUser();
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
            token: null, // No token needed on frontend
          },
        });
      } else {
        throw new Error("No user data received");
      }
    } catch (error) {
      console.error("Get current user error:", error);

      // No storage to clear - cookies are HTTP-only
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
        rememberMe: credentials.rememberMe,
      });

      console.log("Login response:", res.data);

      // Robust handling of different response formats
      let token = null;
      let user = null;

      // Cookie-based auth - only need user data in response
      if (res.data.user) {
        // Direct format: { user }
        user = res.data.user;
        token = "cookie-based"; // Placeholder
      } else if (res.data.data?.user) {
        // Nested format: { data: { user } }
        user = res.data.data.user;
        token = "cookie-based"; // Placeholder
      } else if (res.data.success && res.data.user) {
        // Success format: { success: true, user }
        user = res.data.user;
      }

      if (user) {
        // No storage needed - cookies are handled automatically
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user, token: null },
        });

        return { success: true, user };
      } else {
        console.error("Invalid login response format:", res.data);
        throw new Error("Invalid response format - missing user data");
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

      // Handle signup response (cookie-based)
      let user = null;

      if (res.data.user) {
        user = res.data.user;
      } else if (res.data.data?.user) {
        user = res.data.data.user;
      } else if (res.data.success) {
        user = res.data.user || res.data.data?.user;
      }

      if (user) {
        // No storage needed - cookies are handled automatically
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user, token: null },
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

  const logout = async () => {
    try {
      // Call logout endpoint to clear HTTP-only cookie
      await API.post("/auth/logout");
    } catch (error) {
      console.warn("Logout endpoint error:", error);
      // Continue with logout even if endpoint fails
    }

    // Clear state (no storage to clear)
    dispatch({ type: "LOGOUT" });
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const updateUser = (userData) => {
    // Update user in state (no storage needed)
    dispatch({ type: "UPDATE_USER", payload: userData });
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
