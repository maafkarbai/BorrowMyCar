// controllers/authController.js - Enhanced with Profile Picture Management
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import {
  uploadImagesToCloud,
  deleteImagesFromCloud,
} from "../utils/cloudUploader.js";
import { formatUAEPhone, validateUAEPhone } from "../utils/phoneUtils.js";

// Enhanced async error handler
const handleAsyncErrorLocal = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Token generator
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

// Enhanced data sanitizer
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

// FIXED validation function
const validateUserData = (data, isSignup = false) => {
  const errors = [];

  if (isSignup) {
    // Name validation
    if (!data.name || data.name.length < 2) {
      errors.push("Name must be at least 2 characters long");
    }

    // Email validation
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push("Please provide a valid email address");
    }

    // FIXED: Phone validation with better error messaging
    if (!data.phone) {
      errors.push("Phone number is required");
    } else if (!validateUAEPhone(data.phone)) {
      console.log("Phone validation failed for:", data.phone);
      console.log("Clean phone:", data.phone.replace(/\D/g, ""));
      errors.push("Please provide a valid UAE phone number (e.g., 0501234567)");
    }

    // Password validation
    if (!data.password || data.password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }

    // Role validation
    if (data.role && !["renter", "owner"].includes(data.role)) {
      errors.push("Role must be either 'renter' or 'owner'");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// FIXED SIGNUP CONTROLLER
export const signup = handleAsyncErrorLocal(async (req, res) => {
  console.log("=== SIGNUP DEBUG ===");
  console.log("Request body:", req.body);
  console.log(
    "Request files:",
    req.files ? Object.keys(req.files) : "No files"
  );

  // Sanitize input data
  const userData = sanitizeUserData(req.body);
  console.log("Sanitized data:", userData);

  const {
    name,
    email,
    phone,
    password,
    role = "renter",
    preferredCity,
  } = userData;

  // COMPREHENSIVE validation with detailed logging
  const validationResult = validateUserData(userData, true);
  if (!validationResult.isValid) {
    console.log("Validation errors:", validationResult.errors);
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: validationResult.errors,
      code: "VALIDATION_ERROR",
      debug: {
        receivedPhone: phone,
        cleanPhone: phone ? phone.replace(/\D/g, "") : null,
        phoneIsValid: phone ? validateUAEPhone(phone) : false,
      },
    });
  }

  // Format phone number for storage
  const formattedPhone = formatUAEPhone(phone);
  console.log("Phone formatting:", {
    original: phone,
    formatted: formattedPhone,
  });

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { phone: formattedPhone }],
  });

  if (existingUser) {
    console.log(
      "User already exists:",
      existingUser.email === email ? "email" : "phone"
    );
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
      console.log("Processing file uploads...");

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
        console.log("Uploaded driving license");
      }

      if (req.files.emiratesId) {
        const [emiratesIdUrl] = await uploadImagesToCloud(req.files.emiratesId);
        documentUrls.emiratesIdUrl = emiratesIdUrl;
        console.log("Uploaded Emirates ID");
      }

      if (req.files.visa) {
        const [visaUrl] = await uploadImagesToCloud(req.files.visa);
        documentUrls.visaUrl = visaUrl;
        console.log("Uploaded visa");
      }

      if (req.files.passport) {
        const [passportUrl] = await uploadImagesToCloud(req.files.passport);
        documentUrls.passportUrl = passportUrl;
        console.log("Uploaded passport");
      }

      if (req.files.profileImage) {
        const [profileImageUrl] = await uploadImagesToCloud(
          req.files.profileImage
        );
        documentUrls.profileImage = profileImageUrl;
        console.log("Uploaded profile image");
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

  // Create user with formatted phone
  const userCreateData = {
    name,
    email,
    phone: formattedPhone, // Use formatted phone
    password,
    role,
    preferredCity,
    ...documentUrls,
    isApproved: false, // Requires admin approval
  };

  console.log("Creating user with data:", {
    ...userCreateData,
    password: "[HIDDEN]",
  });

  const user = await User.create(userCreateData);
  console.log("User created successfully:", user._id);

  const token = generateToken(user);

  // Return response with both root-level and nested data for compatibility
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

// UPDATE USER PROFILE - ENHANCED with Profile Picture Support
export const updateProfile = handleAsyncErrorLocal(async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = sanitizeUserData(req.body);

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updates.password;
    delete updates.email;
    delete updates.role;
    delete updates.isApproved;

    // Validate name if provided
    if (updates.name && updates.name.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters long",
        code: "INVALID_NAME",
      });
    }

    // Validate preferred city if provided
    const validCities = [
      "Dubai",
      "Abu Dhabi",
      "Sharjah",
      "Ajman",
      "Fujairah",
      "Ras Al Khaimah",
      "Umm Al Quwain",
    ];
    if (updates.preferredCity && !validCities.includes(updates.preferredCity)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid UAE city",
        code: "INVALID_CITY",
      });
    }

    // Handle profile image upload if provided
    if (req.file) {
      try {
        console.log("Processing profile image upload:", req.file);
        const user = await User.findById(userId);

        // Delete old profile image if exists
        if (user.profileImage) {
          await deleteImagesFromCloud([user.profileImage]).catch(console.error);
        }

        // Upload new profile image
        const [profileImageUrl] = await uploadImagesToCloud([req.file]);
        updates.profileImage = profileImageUrl;
        console.log("Profile image uploaded successfully:", profileImageUrl);
      } catch (uploadError) {
        console.error("Profile image upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload profile image",
          code: "UPLOAD_FAILED",
        });
      }
    }

    console.log("Updating user profile with:", updates);

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

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

// NEW: UPDATE PROFILE PICTURE ONLY
export const updateProfilePicture = handleAsyncErrorLocal(async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Profile image file is required",
        code: "NO_FILE_PROVIDED",
      });
    }

    console.log("Processing profile image update:", req.file);
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    // Delete old profile image if exists
    if (user.profileImage) {
      await deleteImagesFromCloud([user.profileImage]).catch(console.error);
      console.log("Deleted old profile image");
    }

    // Upload new profile image
    const [profileImageUrl] = await uploadImagesToCloud([req.file]);
    console.log("New profile image uploaded:", profileImageUrl);

    // Update user with new profile image
    user.profileImage = profileImageUrl;
    await user.save();

    res.json({
      success: true,
      message: "Profile picture updated successfully",
      data: {
        profileImage: profileImageUrl,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isApproved: user.isApproved,
          profileImage: user.profileImage,
          preferredCity: user.preferredCity,
        },
      },
    });
  } catch (error) {
    console.error("Update profile picture error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile picture",
      code: "INTERNAL_ERROR",
    });
  }
});

// NEW: REMOVE PROFILE PICTURE
export const removeProfilePicture = handleAsyncErrorLocal(async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    if (!user.profileImage) {
      return res.status(400).json({
        success: false,
        message: "No profile picture to remove",
        code: "NO_PROFILE_PICTURE",
      });
    }

    console.log("Removing profile picture:", user.profileImage);

    // Delete profile image from cloud storage
    await deleteImagesFromCloud([user.profileImage]).catch(console.error);

    // Remove profile image from user document
    user.profileImage = null;
    await user.save();

    res.json({
      success: true,
      message: "Profile picture removed successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isApproved: user.isApproved,
          profileImage: null,
          preferredCity: user.preferredCity,
        },
      },
    });
  } catch (error) {
    console.error("Remove profile picture error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove profile picture",
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

// UPDATE USER PREFERENCES (for notifications and privacy)
export const updatePreferences = handleAsyncErrorLocal(async (req, res) => {
  try {
    const userId = req.user.id;
    const { notifications, privacy } = req.body;

    const updates = {};

    // Handle notifications preferences
    if (notifications) {
      updates.notificationPreferences = {
        emailBookings: Boolean(notifications.emailBookings),
        emailPromotions: Boolean(notifications.emailPromotions),
        smsBookings: Boolean(notifications.smsBookings),
        smsReminders: Boolean(notifications.smsReminders),
        pushNotifications: Boolean(notifications.pushNotifications),
      };
    }

    // Handle privacy preferences
    if (privacy) {
      updates.privacySettings = {
        profileVisibility: privacy.profileVisibility || "public",
        showPhone: Boolean(privacy.showPhone),
        showEmail: Boolean(privacy.showEmail),
        allowMessages: Boolean(privacy.allowMessages),
      };
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({
      success: true,
      message: "Preferences updated successfully",
      data: {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          notificationPreferences: updatedUser.notificationPreferences,
          privacySettings: updatedUser.privacySettings,
        },
      },
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update preferences",
      code: "INTERNAL_ERROR",
    });
  }
});

// EXPORT USER DATA
export const exportUserData = handleAsyncErrorLocal(async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user data
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        preferredCity: user.preferredCity,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="borrowmycar-data.json"'
    );
    res.json(exportData);
  } catch (error) {
    console.error("Export data error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export data",
      code: "INTERNAL_ERROR",
    });
  }
});

// DELETE USER ACCOUNT
export const deleteAccount = handleAsyncErrorLocal(async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    // Delete profile image from cloud storage
    if (user.profileImage) {
      await deleteImagesFromCloud([user.profileImage]).catch(console.error);
    }

    // Delete document images from cloud storage
    const documentUrls = [
      user.drivingLicenseUrl,
      user.emiratesIdUrl,
      user.visaUrl,
      user.passportUrl,
    ].filter(Boolean);

    if (documentUrls.length > 0) {
      await deleteImagesFromCloud(documentUrls).catch(console.error);
    }

    // Soft delete user (mark as deleted)
    user.deletedAt = new Date();
    user.email = `deleted_${user._id}@borrowmycar.deleted`;
    user.phone = `deleted_${user._id}`;
    await user.save();

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete account",
      code: "INTERNAL_ERROR",
    });
  }
});

// LOGOUT (Optional - mainly client-side)
export const logout = handleAsyncErrorLocal(async (req, res) => {
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
