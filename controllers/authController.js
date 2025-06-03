import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import {
  uploadImagesToCloud,
  deleteImagesFromCloud,
} from "../utils/cloudUploader.js";

import { User } from "../models/User.js";

// Enhanced async error handler
const handleAsyncError = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Token generator with enhanced payload
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      isApproved: user.isApproved,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Enhanced data sanitizer for user
const sanitizeUserData = (data) => {
  const sanitized = {};
  if (data.name) sanitized.name = data.name.toString().trim();
  if (data.email) sanitized.email = data.email.toString().toLowerCase().trim();
  if (data.phone) sanitized.phone = data.phone.toString().trim();
  if (data.password) sanitized.password = data.password.toString();
  if (data.role) sanitized.role = data.role.toString().trim();
  if (data.preferredCity)
    sanitized.preferredCity = data.preferredCity.toString().trim();
  return sanitized;
};

// Enhanced user validation
const validateUserData = (data, isSignup = false) => {
  const errors = [];

  if (isSignup) {
    if (!data.name || data.name.length < 2) {
      errors.push("Name must be at least 2 characters long");
    }
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push("Please provide a valid email address");
    }
    if (!data.phone || !/^(\+971|00971|971)?[0-9]{8,9}$/.test(data.phone)) {
      errors.push("Please provide a valid UAE phone number");
    }
    if (!data.password || data.password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }
    if (data.role && !["renter", "owner"].includes(data.role)) {
      errors.push("Role must be either 'renter' or 'owner'");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ENHANCED SIGNUP with document upload
export const signup = handleAsyncError(async (req, res) => {
  // Sanitize input data
  const userData = sanitizeUserData(req.body);
  const {
    name,
    email,
    phone,
    password,
    role = "renter",
    preferredCity,
  } = userData;

  // Validate input
  const validationResult = validateUserData(userData, true);
  if (!validationResult.isValid) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: validationResult.errors,
      code: "VALIDATION_ERROR",
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { phone }],
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message:
        existingUser.email === email
          ? "Email already registered"
          : "Phone number already registered",
      code: "USER_EXISTS",
    });
  }

  // Handle document uploads
  let documentUrls = {};
  if (req.files) {
    try {
      // Validate required documents
      if (!req.files.drivingLicense) {
        return res.status(400).json({
          success: false,
          message: "Driving license is required",
          code: "MISSING_DOCUMENTS",
        });
      }

      // Upload documents to cloud
      if (req.files.drivingLicense) {
        const [drivingLicenseUrl] = await uploadImagesToCloud(
          req.files.drivingLicense
        );
        documentUrls.drivingLicenseUrl = drivingLicenseUrl;
      }

      if (req.files.emiratesId) {
        const [emiratesIdUrl] = await uploadImagesToCloud(req.files.emiratesId);
        documentUrls.emiratesIdUrl = emiratesIdUrl;
      }

      if (req.files.visa) {
        const [visaUrl] = await uploadImagesToCloud(req.files.visa);
        documentUrls.visaUrl = visaUrl;
      }

      if (req.files.passport) {
        const [passportUrl] = await uploadImagesToCloud(req.files.passport);
        documentUrls.passportUrl = passportUrl;
      }

      if (req.files.profileImage) {
        const [profileImageUrl] = await uploadImagesToCloud(
          req.files.profileImage
        );
        documentUrls.profileImage = profileImageUrl;
      }
    } catch (uploadError) {
      console.error("Document upload error:", uploadError);
      return res.status(500).json({
        success: false,
        message: "Failed to upload documents. Please try again.",
        code: "UPLOAD_FAILED",
      });
    }
  }

  // Create user
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role,
    preferredCity,
    ...documentUrls,
    isApproved: false, // Requires admin approval
  });

  const token = generateToken(user);

  res.status(201).json({
    success: true,
    message: "Account created successfully. Awaiting admin approval.",
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isApproved: user.isApproved,
        profileImage: user.profileImage,
      },
    },
  });
});

// ENHANCED LOGIN
export const login = handleAsyncError(async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide email and password",
      code: "MISSING_CREDENTIALS",
    });
  }

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
      code: "INVALID_CREDENTIALS",
    });
  }

  // Check password
  const isPasswordValid = await user.matchPassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
      code: "INVALID_CREDENTIALS",
    });
  }

  // Update last login
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isApproved: user.isApproved,
        profileImage: user.profileImage,
        lastLoginAt: user.lastLoginAt,
      },
    },
  });
});

// Get user profile
export const getProfile = handleAsyncError(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  res.json({
    success: true,
    data: { user },
  });
});

// Update user profile
export const updateProfile = handleAsyncError(async (req, res) => {
  const userId = req.user.id;
  const updates = sanitizeUserData(req.body);

  // Remove sensitive fields that shouldn't be updated via this endpoint
  delete updates.password;
  delete updates.email;
  delete updates.role;
  delete updates.isApproved;

  // Handle profile image upload
  if (req.files && req.files.profileImage) {
    try {
      const user = await User.findById(userId);

      // Delete old profile image if exists
      if (user.profileImage) {
        await deleteImagesFromCloud([user.profileImage]).catch(console.error);
      }

      // Upload new profile image
      const [profileImageUrl] = await uploadImagesToCloud(
        req.files.profileImage
      );
      updates.profileImage = profileImageUrl;
    } catch (uploadError) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload profile image",
        code: "UPLOAD_FAILED",
      });
    }
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  }).select("-password");

  res.json({
    success: true,
    message: "Profile updated successfully",
    data: { user: updatedUser },
  });
});
