import { useState } from "react";
import API from "./api";
import { Link, useNavigate } from "react-router-dom";
import ButtonAccent from "./components/ButtonAccent";
import { Helmet } from "react-helmet";
import Logo from "./assets/BorrowMyCar.png"; // Assuming you have a logo image

const Signup = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (error) setError(""); // Clear error when user starts typing

    // Check password strength
    if (name === "password") {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return { text: "Very Weak", color: "text-red-500" };
      case 2:
        return { text: "Weak", color: "text-orange-500" };
      case 3:
        return { text: "Fair", color: "text-yellow-500" };
      case 4:
        return { text: "Good", color: "text-green-500" };
      case 5:
        return { text: "Strong", color: "text-green-600" };
      default:
        return { text: "", color: "" };
    }
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!form.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (!agreedToTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await API.post("/auth/signup", form);
      localStorage.setItem("token", res.data.token);
      navigate("/");
    } catch (err) {
      setError(
        err?.response?.data?.message || "Signup failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const strengthText = getPasswordStrengthText();

  return (
    <>
      <Helmet>
        <title>Sign Up - BorrowMyCar</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
        <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-8">
          <div className="text-center max-w-md space-y-6">
            <div className="relative">
              <div className="mx-auto w-64 h-48 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl shadow-lg flex items-center justify-center">
                <div className="text-white text-6xl">🚗</div>
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl xl:text-3xl font-bold text-gray-800">
                Join BorrowMyCar! 🎉
              </h2>
              <p className="text-gray-600 text-lg">
                Start your car sharing journey
              </p>
              <p className="text-sm text-gray-500">
                Access thousands of cars in your area, earn money by sharing
                your vehicle, and join our growing community.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="mx-auto h-20 sm:h-24 w-48 sm:w-64 flex items-center justify-center">
                <img
                  src={Logo}
                  alt="BorrowMyCar Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Create Account
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Join{" "}
                  <span className="font-semibold text-green-500">
                    BorrowMyCar
                  </span>{" "}
                  and start sharing rides
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-6">
              <div className="space-y-4">
                {/* Name Input */}
                <div>
                  <label htmlFor="name" className="sr-only">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Full Name"
                    required
                    autoComplete="name"
                    className="input w-full text-sm sm:text-base"
                  />
                </div>

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
                    autoComplete="new-password"
                    className="input w-full text-sm sm:text-base"
                  />
                  {/* Password Strength Indicator */}
                  {form.password && (
                    <div className="mt-2 space-y-2">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-2 flex-1 rounded ${
                              level <= passwordStrength
                                ? level <= 2
                                  ? "bg-red-500"
                                  : level <= 3
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                                : "bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs ${strengthText.color}`}>
                        Password strength: {strengthText.text}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label htmlFor="confirmPassword" className="sr-only">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm Password"
                    required
                    autoComplete="new-password"
                    className="input w-full text-sm sm:text-base"
                  />
                  {/* Password Match Indicator */}
                  {form.confirmPassword && (
                    <div className="mt-1">
                      {form.password === form.confirmPassword ? (
                        <p className="text-xs text-green-600">
                          ✓ Passwords match
                        </p>
                      ) : (
                        <p className="text-xs text-red-600">
                          ✗ Passwords do not match
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Role Selection */}
                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    I want to:
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="input w-full text-sm sm:text-base"
                  >
                    <option value="user">Borrow cars</option>
                    <option value="owner">Lend my car</option>
                    <option value="both">Both borrow and lend</option>
                  </select>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 mt-1 text-green-500 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                />
                <label htmlFor="terms" className="ml-3 text-sm text-gray-600">
                  I agree to the{" "}
                  <button
                    type="button"
                    className="accent-color hover:text-green-700 hover:underline"
                  >
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    className="accent-color hover:text-green-700 hover:underline"
                  >
                    Privacy Policy
                  </button>
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-lg p-3">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <ButtonAccent
                text={isLoading ? "Creating account..." : "Create Account"}
                onClick={handleSubmit}
                disabled={isLoading}
              />

              {/* Login Link */}
              <p className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  type="button"
                  to="/login"
                  className="font-semibold accent-color hover:text-green-700 hover:underline transition-colors duration-200"
                >
                  Sign in here
                </Link>
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
              <p className="font-semibold text-gray-800">
                Ready to get started?
              </p>
              <p className="text-sm text-gray-600">
                Your car sharing journey begins now
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
