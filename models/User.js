// models/User.js (Updated with UAE Phone Validation)
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import {
  formatUAEPhone,
  validateUAEPhone,
  displayUAEPhone,
} from "../utils/phoneUtils.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return validateUAEPhone(v);
        },
        message: "Please enter a valid UAE phone number (e.g., 0501234567)",
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // Don't include password by default
    },
    profileImage: {
      type: String,
    },
    role: {
      type: String,
      enum: ["renter", "owner", "admin"],
      default: "renter",
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    // Document URLs
    drivingLicenseUrl: {
      type: String,
      required: true,
    },
    emiratesIdUrl: {
      type: String,
    },
    visaUrl: {
      type: String,
    },
    passportUrl: {
      type: String,
    },
    // User preferences
    preferredCity: {
      type: String,
      enum: [
        "Dubai",
        "Abu Dhabi",
        "Sharjah",
        "Ajman",
        "Fujairah",
        "Ras Al Khaimah",
        "Umm Al Quwain",
      ],
    },
    // Account status
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
    },
    // Soft delete
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ isApproved: 1, role: 1 });
userSchema.index({ role: 1 });
userSchema.index({ deletedAt: 1 });

// Pre-save middleware to format phone number
userSchema.pre("save", function (next) {
  if (this.isModified("phone")) {
    this.phone = formatUAEPhone(this.phone);
  }
  next();
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  try {
    // Hash password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Hide deleted users in queries
userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ deletedAt: null });
  next();
});

// Virtual for displaying phone in local format
userSchema.virtual("phoneDisplay").get(function () {
  return displayUAEPhone(this.phone);
});

// Ensure virtual fields are serialized
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

// Create and export the model
const User = mongoose.model("User", userSchema);

// Export both named and default exports for compatibility
export { User };
export default User;
