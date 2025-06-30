import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthProvider";
import Logo from "./assets/BorrowMyCar.png";
import { Helmet } from "react-helmet-async";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "", rememberMe: false });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ 
      ...form, 
      [name]: type === "checkbox" ? checked : value 
    });
    if (error) setError(""); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!form.email || !form.password) {
      setError("Please fill in all fields");
      return;
    }

    setError("");

    try {
      const result = await login({
        email: form.email.trim(),
        password: form.password,
        rememberMe: form.rememberMe
      });

      if (result.success) {
        // Redirect to homepage or dashboard
        navigate("/", { replace: true });
      } else {
        setError(result.error || "Login failed. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - BorrowMyCar</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
        {/* Left Side - Form */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md space-y-8">
            {/* Header */}
            <div>
              <div className="mx-auto h-20 sm:h-24 w-48 sm:w-64 flex items-center justify-center">
                <img
                  src={Logo}
                  alt="BorrowMyCar Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="space-y-2 text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Welcome Back
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Sign in to your{" "}
                  <span className="font-semibold text-green-500">
                    BorrowMyCar
                  </span>{" "}
                  account
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Email address"
                    required
                    autoComplete="email"
                    className="input w-full text-sm sm:text-base"
                  />
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Password"
                    required
                    autoComplete="current-password"
                    className="input w-full text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-lg p-3">
                  {error}
                </div>
              )}

              {/* Remember Me & Forgot Password */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={form.rememberMe}
                    onChange={handleChange}
                    className="w-4 h-4 text-green-500 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <span className="ml-2 text-gray-700">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="accent-color hover:text-green-700 hover:underline transition-colors duration-200"
                >
                  Forgot your password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 text-sm sm:text-base focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>

              {/* Sign Up Link */}
              <p className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  to="/auth"
                  className="font-semibold accent-color hover:text-green-700 hover:underline transition-colors duration-200"
                >
                  Sign up here
                </Link>
              </p>
            </form>
          </div>
        </div>

        {/* Right Side - Welcome Section */}
        <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-8">
          <div className="text-center max-w-md space-y-6">
            <div className="relative">
              <div className="mx-auto w-64 h-48 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl shadow-lg flex items-center justify-center">
                <div className="text-white text-6xl">🚗</div>
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl xl:text-3xl font-bold text-gray-800">
                Welcome Back! 👋
              </h2>
              <p className="text-gray-600 text-lg">
                Ready to hit the road again?
              </p>
              <p className="text-sm text-gray-500">
                Access your bookings, browse available cars, and manage your
                rentals.
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Welcome Section */}
        <div className="lg:hidden bg-gradient-to-r from-green-50 to-emerald-50 p-6 text-center border-t">
          <div className="flex items-center justify-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center text-2xl">
              🚗
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-800">Ready to drive?</p>
              <p className="text-sm text-gray-600">
                Your next adventure awaits
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
