// models/User.js (Fixed with Correct Soft Delete)
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
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
          return /^(\+971|00971|971)?[0-9]{8,9}$/.test(v);
        },
        message: "Please enter a valid UAE phone number",
      },
    },
    password: { type: String, required: true, minlength: 6 },
    profileImage: { type: String },
    role: {
      type: String,
      enum: ["renter", "owner", "admin"],
      default: "renter",
    },
    isApproved: { type: Boolean, default: false },

    // Document URLs
    drivingLicenseUrl: { type: String, required: true },
    emiratesIdUrl: { type: String },
    visaUrl: { type: String },
    passportUrl: { type: String },

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
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    lastLoginAt: { type: Date },

    // Soft delete
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance (email already has unique index, so skip it)
userSchema.index({ phone: 1 });
userSchema.index({ isApproved: 1, role: 1 });
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// FIXED: Hide deleted users in queries (correct filter)
userSchema.pre(/^find/, function () {
  this.find({ deletedAt: null });
});

export const User = mongoose.model("User", userSchema);
export default User;
