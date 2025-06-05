// controllers/authController.js (Complete Fixed Version)
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import {
  uploadImagesToCloud,
  deleteImagesFromCloud,
} from "../utils/cloudUploader.js";

// Enhanced async error handler
const handleAsyncErrorLocal = (fn) => {
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

// SIGNUP CONTROLLER
export const signup = handleAsyncErrorLocal(async (req, res) => {
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

  // Return consistent response structure
  res.status(201).json({
    success: true,
    message: "Account created successfully. Awaiting admin approval.",
    token, // Root level token
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isApproved: user.isApproved,
      profileImage: user.profileImage,
    },
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

// LOGIN CONTROLLER
export const login = handleAsyncErrorLocal(async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt for:", email);

  // Input validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide email and password",
      code: "MISSING_CREDENTIALS",
    });
  }

  try {
    // Find user and include password for comparison
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      console.log("User not found:", email);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      console.log("Invalid password for user:", email);
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
    console.log("Login successful for:", email);

    // Return token at root level for frontend compatibility
    res.status(200).json({
      success: true,
      message: "Login successful",
      token, // Root level token (frontend expects this)
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
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
});

// GET USER PROFILE
export const getProfile = handleAsyncErrorLocal(async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isApproved: user.isApproved,
          profileImage: user.profileImage,
          preferredCity: user.preferredCity,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        },
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      code: "INTERNAL_ERROR",
    });
  }
});

// UPDATE USER PROFILE
export const updateProfile = handleAsyncErrorLocal(async (req, res) => {
  try {
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
      data: {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: updatedUser.role,
          isApproved: updatedUser.isApproved,
          profileImage: updatedUser.profileImage,
          preferredCity: updatedUser.preferredCity,
        },
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      code: "INTERNAL_ERROR",
    });
  }
});

// CHANGE PASSWORD
export const changePassword = handleAsyncErrorLocal(async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
        code: "MISSING_FIELDS",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
        code: "INVALID_PASSWORD",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    const isPasswordValid = await user.matchPassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
        code: "INVALID_CURRENT_PASSWORD",
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
      code: "INTERNAL_ERROR",
    });
  }
});

// LOGOUT (Optional - mainly client-side)
export const logout = handleAsyncErrorLocal(async (req, res) => {
  // Since we're using stateless JWT, logout is mainly handled on the client side
  // But we can track logout time if needed
  try {
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
      code: "INTERNAL_ERROR",
    });
  }
});

// EXPORT ALTERNATIVE NAMES FOR COMPATIBILITY
export const register = signup; // Alternative name for signup
