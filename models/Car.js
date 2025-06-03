// models/Car.js
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
    },
    description: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    pricePerDay: {
      type: Number,
      required: true,
    },
    availabilityFrom: {
      type: Date,
      required: true,
    },
    availabilityTo: {
      type: Date,
      required: true,
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    // Additional fields for enhanced controller
    transmission: {
      type: String,
      enum: ["Automatic", "Manual", "CVT", "Semi-Automatic"],
      default: "Automatic",
    },
    fuelType: {
      type: String,
      enum: ["Petrol", "Diesel", "Electric", "Hybrid", "Plug-in Hybrid"],
      default: "Petrol",
    },
    year: {
      type: Number,
      min: 1990,
      max: new Date().getFullYear() + 1,
    },
    mileage: {
      type: Number,
      min: 0,
    },
    specifications: {
      type: String,
      enum: [
        "GCC Specs",
        "US Specs",
        "Japanese Specs",
        "European Specs",
        "Canadian Specs",
      ],
      default: "GCC Specs",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "deleted", "pending"],
      default: "active",
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Car = mongoose.model("Car", carSchema); // ✅ named export
export default Car;
