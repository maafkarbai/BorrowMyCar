// models/Booking.js (Complete Replacement)
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
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalDays: { type: Number, required: true, min: 1 },

    // Pricing
    dailyRate: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    securityDeposit: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    totalPayable: { type: Number, required: true },

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "confirmed",
        "active",
        "completed",
        "cancelled",
        "rejected",
        "expired",
      ],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "BankTransfer", "DigitalWallet"],
      default: "Cash",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "partial"],
      default: "pending",
    },

    // Locations
    pickupLocation: { type: String, required: true },
    returnLocation: { type: String, required: true },
    deliveryRequested: { type: Boolean, default: false },
    deliveryAddress: { type: String },

    // Notes
    renterNotes: { type: String, maxlength: 500 },
    ownerNotes: { type: String, maxlength: 500 },

    // Cancellation
    cancellationReason: { type: String },
    cancelledBy: { type: String, enum: ["renter", "owner", "admin", "system"] },
    cancellationFee: { type: Number, default: 0 },
    rejectionReason: { type: String },

    // Reviews
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

    // Timestamps
    approvedAt: { type: Date },
    confirmedAt: { type: Date },
    completedAt: { type: Date },
    expiresAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to calculate totalDays and totalPayable
bookingSchema.pre("save", function () {
  if (this.isModified("startDate") || this.isModified("endDate")) {
    const diffTime = this.endDate - this.startDate;
    this.totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

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

const Booking = mongoose.model("Booking", bookingSchema);

export { Booking };
export default Booking;
