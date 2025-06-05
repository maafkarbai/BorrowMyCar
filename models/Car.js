// models/Car.js - Fixed with consistent field naming
import mongoose from "mongoose";

const carSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    city: {
      type: String,
      required: true,
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
    // FIXED: Use consistent field name 'price' (not pricePerDay)
    price: {
      type: Number,
      required: true,
      min: 50, // Minimum AED 50 per day
      max: 5000, // Maximum AED 5000 per day
    },
    // Availability
    availabilityFrom: {
      type: Date,
      required: true,
    },
    availabilityTo: {
      type: Date,
      required: true,
    },
    // Car details
    make: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
      min: 2010,
      max: new Date().getFullYear() + 1,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    plateNumber: {
      type: String,
      required: true,
      uppercase: true,
      validate: {
        validator: function (v) {
          return /^[A-Z]{1,3}[0-9]{1,5}$/.test(v);
        },
        message: "Please enter a valid UAE plate number",
      },
    },
    // Technical specs
    transmission: {
      type: String,
      enum: ["Automatic", "Manual", "CVT", "Semi-Automatic"],
      required: true,
      default: "Automatic",
    },
    fuelType: {
      type: String,
      enum: ["Petrol", "Diesel", "Electric", "Hybrid", "Plug-in Hybrid"],
      required: true,
      default: "Petrol",
    },
    mileage: {
      type: Number,
      required: true,
      min: 0,
      max: 500000,
    },
    seatingCapacity: {
      type: Number,
      required: true,
      min: 2,
      max: 8,
    },
    specifications: {
      type: String,
      enum: [
        "GCC Specs",
        "US Specs",
        "Japanese Specs",
        "European Specs",
        "Canadian Specs",
        "Korean Specs",
      ],
      required: true,
      default: "GCC Specs",
    },
    // Features
    features: [
      {
        type: String,
        enum: [
          "GPS Navigation",
          "Bluetooth",
          "USB Charging",
          "Wireless Charging",
          "Sunroof",
          "Leather Seats",
          "Heated Seats",
          "Cooled Seats",
          "Backup Camera",
          "Parking Sensors",
          "Cruise Control",
          "Keyless Entry",
          "Push Start",
          "Auto AC",
          "Dual Zone AC",
          "Premium Sound System",
        ],
      },
    ],
    // Media
    images: [
      {
        type: String,
        required: true,
      },
    ],
    // Booking settings
    isInstantApproval: {
      type: Boolean,
      default: true,
    },
    minimumRentalDays: {
      type: Number,
      default: 1,
      min: 1,
    },
    maximumRentalDays: {
      type: Number,
      default: 30,
      min: 1,
    },
    // Delivery options
    deliveryAvailable: {
      type: Boolean,
      default: false,
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    pickupLocations: [{ type: String }],
    // Insurance & Security
    insuranceIncluded: {
      type: Boolean,
      default: true,
    },
    securityDeposit: {
      type: Number,
      default: 500,
      min: 0,
    },
    // Status and metrics
    status: {
      type: String,
      enum: ["active", "inactive", "deleted", "pending", "maintenance"],
      default: "pending",
    },
    totalBookings: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    // Admin fields
    adminNotes: {
      type: String,
    },
    rejectionReason: {
      type: String,
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

// Indexes for performance and search
carSchema.index({ city: 1, status: 1 });
carSchema.index({ price: 1 });
carSchema.index({ make: 1, model: 1 });
carSchema.index({ availabilityFrom: 1, availabilityTo: 1 });
carSchema.index({ owner: 1 });
carSchema.index({
  title: "text",
  description: "text",
  make: "text",
  model: "text",
});

// Pre-save validation
carSchema.pre("save", function () {
  // Validate date range
  if (this.availabilityTo <= this.availabilityFrom) {
    throw new Error("Availability end date must be after start date");
  }

  // Validate minimum number of images
  if (this.images && this.images.length < 3) {
    throw new Error("At least 3 images are required");
  }
});

// Hide deleted cars in queries
carSchema.pre(/^find/, function () {
  this.find({ deletedAt: null });
});

// Virtual for frontend compatibility
carSchema.virtual("pricePerDay").get(function () {
  return this.price;
});

// Ensure virtual fields are serialized
carSchema.set("toJSON", { virtuals: true });
carSchema.set("toObject", { virtuals: true });

export const Car = mongoose.model("Car", carSchema);
export default Car;
