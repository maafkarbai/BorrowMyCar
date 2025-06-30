// src/Signup.jsx - Updated with UAE Phone Input
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "./api";
import PhoneInput from "./components/PhoneInput";

const Signup = () => {
  const location = useLocation();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "renter",
    preferredCity: "Dubai",
  });

  const [files, setFiles] = useState({
    drivingLicense: null,
    emiratesId: null,
    visa: null,
    passport: null,
    profileImage: null,
  });

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const _navigate = useNavigate();

  // Handle role from navigation state
  useEffect(() => {
    const selectedRole = location.state?.role;
    if (selectedRole) {
      setForm(prev => ({ ...prev, role: selectedRole }));
    } else {
      // If no role is selected, redirect back to role selection
      _navigate("/auth", { replace: true });
    }
  }, [location.state, _navigate]);

  const uaeCities = [
    "Dubai",
    "Abu Dhabi",
    "Sharjah",
    "Ajman",
    "Fujairah",
    "Ras Al Khaimah",
    "Umm Al Quwain",
  ];

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
        return { text: "Very Weak", color: "text-red-500", bg: "bg-red-500" };
      case 2:
        return { text: "Weak", color: "text-orange-500", bg: "bg-orange-500" };
      case 3:
        return { text: "Fair", color: "text-yellow-500", bg: "bg-yellow-500" };
      case 4:
        return { text: "Good", color: "text-green-500", bg: "bg-green-500" };
      case 5:
        return { text: "Strong", color: "text-green-600", bg: "bg-green-600" };
      default:
        return { text: "", color: "", bg: "" };
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }

    // Check password strength
    if (name === "password") {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  // Special handler for phone input
  const handlePhoneChange = (phoneValue) => {
    setForm({ ...form, phone: phoneValue });

    // Clear phone error when user starts typing
    if (errors.phone) {
      setErrors({ ...errors, phone: "" });
    }
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    const file = selectedFiles[0];

    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, [name]: "File size must be less than 5MB" });
        return;
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        setErrors({
          ...errors,
          [name]: "Only JPEG, PNG, and WebP files are allowed",
        });
        return;
      }

      setFiles({ ...files, [name]: file });
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!form.name.trim() || form.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Validate UAE phone number
    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else {
      const phoneDigits = form.phone.replace(/\D/g, "");
      // UAE mobile: 0501234567 (10 digits starting with 05)
      // UAE landline: 043001234 (9 digits starting with 04/02/03/06/07/09)
      const validMobile = /^05[0-9]{8}$/.test(phoneDigits);
      const validLandline = /^0[2-4679][0-9]{7}$/.test(phoneDigits);

      if (!validMobile && !validLandline) {
        newErrors.phone =
          "Please enter a valid UAE phone number (e.g., 0501234567)";
      }
    }

    if (!form.password || form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!files.drivingLicense) {
      newErrors.drivingLicense = "Driving license is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep1() || !validateStep2()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const formData = new FormData();

      // Append form data (exclude confirmPassword)
      Object.keys(form).forEach((key) => {
        if (key !== "confirmPassword") {
          formData.append(key, form[key]);
        }
      });

      // Append files
      Object.keys(files).forEach((key) => {
        if (files[key]) {
          formData.append(key, files[key]);
        }
      });

      console.log("Submitting registration...");
      const response = await API.post("/auth/signup", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Registration response:", response.data);

      // Registration successful
      setStep(4); // Success step
    } catch (error) {
      console.error("Registration error:", error);
      if (error.response) {
        // Server responded with error status
        const message =
          error.response.data?.message ||
          error.response.data?.error ||
          "Registration failed";
        setErrors({ submit: message });
      } else if (error.request) {
        // Network error
        setErrors({
          submit: "Network error. Please check your connection and try again.",
        });
      } else {
        // Other error
        setErrors({
          submit: "An unexpected error occurred. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const strengthText = getPasswordStrengthText();

  // Step 1: Basic Information
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          Create Your Account
        </h2>
        <p className="text-gray-600">Let's start with your basic information</p>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Full Name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
              errors.name ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email Address *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="your.email@example.com"
            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
              errors.email ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        {/* Phone - Using the new PhoneInput component */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            UAE Phone Number *
          </label>
          <PhoneInput
            value={form.phone}
            onChange={handlePhoneChange}
            error={errors.phone}
            placeholder="0501234567"
            required={true}
          />
        </div>

        {/* Role Display (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Selected Role
          </label>
          <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
            {form.role === "renter" ? "🚗 Rent cars from others" : "🔑 List my car for rent"}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            <Link to="/auth" className="text-green-600 hover:underline">
              Change selection
            </Link>
          </p>
        </div>

        {/* Preferred City */}
        <div>
          <label
            htmlFor="preferredCity"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Preferred City *
          </label>
          <select
            id="preferredCity"
            name="preferredCity"
            value={form.preferredCity}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            {uaeCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password *
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              className={`w-full px-3 py-2 pr-10 border rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {form.password && (
            <div className="mt-2 space-y-2">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`h-2 flex-1 rounded ${
                      level <= passwordStrength
                        ? strengthText.bg
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
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Confirm Password *
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Repeat your password"
            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
              errors.confirmPassword ? "border-red-500" : "border-gray-300"
            }`}
          />

          {/* Password Match Indicator */}
          {form.confirmPassword && (
            <div className="mt-1">
              {form.password === form.confirmPassword ? (
                <p className="text-xs text-green-600">✓ Passwords match</p>
              ) : (
                <p className="text-xs text-red-600">✗ Passwords do not match</p>
              )}
            </div>
          )}
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">
              {errors.confirmPassword}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  // Step 2: Document Upload
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Upload Documents</h2>
        <p className="text-gray-600">
          We need to verify your identity for safety
        </p>
      </div>

      <div className="space-y-4">
        {/* Driving License - Required */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            UAE Driving License *{" "}
            <span className="text-green-600 text-xs ml-1">(Required)</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 transition-colors">
            <input
              type="file"
              name="drivingLicense"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="drivingLicense"
            />
            <label htmlFor="drivingLicense" className="cursor-pointer">
              {files.drivingLicense ? (
                <div className="text-green-600">
                  <p className="font-medium">✓ {files.drivingLicense.name}</p>
                  <p className="text-xs">Click to change</p>
                </div>
              ) : (
                <div className="text-gray-500">
                  <p className="font-medium">📄 Upload Driving License</p>
                  <p className="text-xs">Click to select file</p>
                </div>
              )}
            </label>
          </div>
          {errors.drivingLicense && (
            <p className="text-red-500 text-xs mt-1">{errors.drivingLicense}</p>
          )}
        </div>
        {/* Emirates ID - Optional */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Emirates ID{" "}
            <span className="text-gray-500 text-xs ml-1">(Optional)</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 transition-colors">
            <input
              type="file"
              name="emiratesId"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="emiratesId"
            />
            <label htmlFor="emiratesId" className="cursor-pointer">
              {files.emiratesId ? (
                <div className="text-green-600">
                  <p className="font-medium">✓ {files.emiratesId.name}</p>
                  <p className="text-xs">Click to change</p>
                </div>
              ) : (
                <div className="text-gray-500">
                  <p className="font-medium">🆔 Upload Emirates ID</p>
                  <p className="text-xs">Click to select file</p>
                </div>
              )}
            </label>
          </div>
        </div>
        {/* Profile Image - Optional */}
        // src/Signup.jsx - Enhanced Profile Picture Upload Section // Replace
        the profile image section in renderStep2() with this enhanced version:
        {/* Profile Image - Enhanced */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Photo{" "}
            <span className="text-gray-500 text-xs ml-1">(Optional)</span>
          </label>

          {/* Profile Picture Preview and Upload */}
          <div className="flex items-center space-x-4">
            {/* Preview */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 flex items-center justify-center">
                {files.profileImage ? (
                  <img
                    src={URL.createObjectURL(files.profileImage)}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                    onLoad={() => URL.revokeObjectURL(files.profileImage)}
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-200 to-gray-300">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Remove button for preview */}
              {files.profileImage && (
                <button
                  type="button"
                  onClick={() => setFiles({ ...files, profileImage: null })}
                  className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg transition-colors"
                  title="Remove image"
                >
                  ×
                </button>
              )}
            </div>

            {/* Upload Area */}
            <div className="flex-1">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 transition-colors">
                <input
                  type="file"
                  name="profileImage"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="profileImage"
                />
                <label htmlFor="profileImage" className="cursor-pointer">
                  {files.profileImage ? (
                    <div className="text-green-600">
                      <p className="font-medium">✓ {files.profileImage.name}</p>
                      <p className="text-xs">Click to change</p>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <svg
                        className="w-8 h-8 mx-auto mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      <p className="font-medium">Upload Profile Photo</p>
                      <p className="text-xs">PNG, JPG, WebP up to 5MB</p>
                    </div>
                  )}
                </label>
              </div>

              {/* Profile Image Error */}
              {errors.profileImage && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.profileImage}
                </p>
              )}
            </div>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            💡 <strong>Tip:</strong> A clear profile photo helps build trust
            with other users
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-blue-500 text-lg">ℹ️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Document Guidelines
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc space-y-1 ml-4">
                <li>All files must be less than 5MB</li>
                <li>Accepted formats: JPEG, PNG, WebP</li>
                <li>Ensure documents are clear and readable</li>
                <li>Your information will be kept secure and private</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 3: Review and Submit
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          Review Your Information
        </h2>
        <p className="text-gray-600">
          Please review your details before submitting
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div>
          <h3 className="font-medium text-gray-900 mb-3">
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Name:</span>
              <span className="ml-2 font-medium">{form.name}</span>
            </div>
            <div>
              <span className="text-gray-500">Email:</span>
              <span className="ml-2 font-medium">{form.email}</span>
            </div>
            <div>
              <span className="text-gray-500">Phone:</span>
              <span className="ml-2 font-medium">
                🇦🇪 +971{form.phone.replace(/^0/, "")}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Role:</span>
              <span className="ml-2 font-medium capitalize">{form.role}</span>
            </div>
            <div>
              <span className="text-gray-500">Preferred City:</span>
              <span className="ml-2 font-medium">{form.preferredCity}</span>
            </div>
          </div>
        </div>

        <hr className="border-gray-200" />

        <div>
          <h3 className="font-medium text-gray-900 mb-3">Uploaded Documents</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <span className="text-green-600">✓</span>
              <span className="ml-2">
                Driving License: {files.drivingLicense?.name}
              </span>
            </div>
            {files.emiratesId && (
              <div className="flex items-center">
                <span className="text-green-600">✓</span>
                <span className="ml-2">
                  Emirates ID: {files.emiratesId.name}
                </span>
              </div>
            )}
            {files.profileImage && (
              <div className="flex items-center">
                <span className="text-green-600">✓</span>
                <span className="ml-2">
                  Profile Photo: {files.profileImage.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-yellow-500 text-lg">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Account Approval Required
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              Your account will be reviewed by our team within 24-48 hours.
              You'll receive an email notification once approved.
            </p>
          </div>
        </div>
      </div>

      {errors.submit && (
        <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-lg p-3">
          {errors.submit}
        </div>
      )}
    </div>
  );

  // Step 4: Success
  const renderStep4 = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
        <span className="text-green-600 text-4xl">✓</span>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          Registration Successful!
        </h2>
        <p className="text-gray-600">
          Welcome to BorrowMyCar! Your account has been created successfully.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">What's Next?</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>📧 Check your email for verification instructions</p>
          <p>⏱️ Our team will review your documents within 24-48 hours</p>
          <p>🎉 You'll receive approval notification via email</p>
        </div>
      </div>

      <div className="space-y-3">
        <Link
          to="/login"
          className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
        >
          Sign In to Your Account
        </Link>
        <Link
          to="/"
          className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
        >
          Return to Homepage
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Left Side - Progress & Branding */}
      <div className="lg:flex-1 lg:max-w-md bg-gradient-to-br from-green-50 to-emerald-100 p-8">
        <div className="max-w-md mx-auto space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl shadow-lg flex items-center justify-center text-2xl">
              🚗
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              BorrowMyCar
            </h1>
            <p className="text-gray-600">Your trusted car sharing platform</p>
          </div>

          {/* Progress Indicator */}
          {step < 4 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">
                Registration Progress
              </h3>
              <div className="space-y-3">
                {[
                  { step: 1, label: "Basic Information", icon: "👤" },
                  { step: 2, label: "Document Upload", icon: "📄" },
                  { step: 3, label: "Review & Submit", icon: "✅" },
                ].map((item) => (
                  <div key={item.step} className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        step >= item.step
                          ? "bg-green-500 text-white"
                          : step === item.step - 1
                          ? "bg-green-100 text-green-600 border-2 border-green-500"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {step > item.step ? "✓" : item.step}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${
                          step >= item.step ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        {item.label}
                      </p>
                    </div>
                    <span className="text-lg">{item.icon}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Why Choose Us?</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>24/7 customer support</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>Flexible rental periods</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>Secure payment processing</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Form Container */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}

            {/* Navigation Buttons */}
            {step < 4 && (
              <div className="flex space-x-4">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    Back
                  </button>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
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
                        Creating Account...
                      </span>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                )}
              </div>
            )}
          </form>

          {/* Login Link */}
          {step < 4 && (
            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-green-600 hover:text-green-500 hover:underline transition-colors"
              >
                Sign in here
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
