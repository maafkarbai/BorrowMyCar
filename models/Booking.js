// models/Booking.js (Complete Fixed Version)
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    renter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    car: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true,
    },

    // Booking dates
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalDays: {
      type: Number,
      required: true,
      min: 1,
    },

    // Pricing
    dailyRate: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    securityDeposit: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    totalPayable: { type: Number, required: true }, // totalAmount + securityDeposit + deliveryFee

    // Status tracking
    status: {
      type: String,
      enum: [
        "pending", // Waiting owner approval
        "approved", // Owner approved, payment pending
        "confirmed", // Payment confirmed, booking active
        "active", // Car picked up, rental in progress
        "completed", // Car returned, booking finished
        "cancelled", // Cancelled by renter/owner
        "rejected", // Rejected by owner
        "expired", // Booking expired without approval
      ],
      default: "pending",
    },

    // Payment details
    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "BankTransfer", "DigitalWallet"],
      required: true,
      default: "Cash",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "partial"],
      default: "pending",
    },
    transactionId: { type: String }, // For card payments

    // Pickup/Return details
    pickupLocation: { type: String, required: true },
    returnLocation: { type: String, required: true },
    pickupTime: { type: Date },
    returnTime: { type: Date },
    actualReturnTime: { type: Date },

    // Delivery options
    deliveryRequested: { type: Boolean, default: false },
    deliveryAddress: { type: String },

    // Communication
    renterNotes: { type: String, maxlength: 500 },
    ownerNotes: { type: String, maxlength: 500 },
    adminNotes: { type: String, maxlength: 500 },

    // Car condition tracking
    preRentalCondition: { type: String }, // Photos/notes before rental
    postRentalCondition: { type: String }, // Photos/notes after return
    damageReported: { type: Boolean, default: false },
    damageDescription: { type: String },

    // Cancellation
    cancellationReason: { type: String },
    cancelledBy: {
      type: String,
      enum: ["renter", "owner", "admin", "system"],
    },
    cancellationFee: { type: Number, default: 0 },

    // Review system
    renterReview: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, maxlength: 500 },
      reviewedAt: { type: Date },
    },
    ownerReview: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, maxlength: 500 },
      reviewedAt: { type: Date },
    },

    // System tracking
    approvedAt: { type: Date },
    confirmedAt: { type: Date },
    completedAt: { type: Date },
    expiresAt: { type: Date }, // Auto-expire pending bookings after 24h
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
bookingSchema.index({ renter: 1, status: 1 });
bookingSchema.index({ car: 1, status: 1 });
bookingSchema.index({ startDate: 1, endDate: 1 });
bookingSchema.index({ status: 1, expiresAt: 1 }); // For cleanup jobs

// Calculate total days before saving
bookingSchema.pre("save", function () {
  if (this.isModified("startDate") || this.isModified("endDate")) {
    const diffTime = this.endDate - this.startDate;
    this.totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (this.totalDays < 1) {
      throw new Error("End date must be after start date");
    }
  }

  // Calculate totalPayable
  if (
    this.isModified("totalAmount") ||
    this.isModified("securityDeposit") ||
    this.isModified("deliveryFee")
  ) {
    this.totalPayable =
      (this.totalAmount || 0) +
      (this.securityDeposit || 0) +
      (this.deliveryFee || 0);
  }
});

export const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
