// utils/validators.js - FIXED VERSION
import { body, param, query, validationResult } from "express-validator";
import rateLimit from "express-rate-limit";
import { validateUAEPhone } from "./phoneUtils.js";

// FIXED User validation rules
export const validateSignup = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  // FIXED: More flexible phone validation
  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .custom((value) => {
      console.log("Validating phone in validator:", value);

      if (!value) {
        throw new Error("Phone number is required");
      }

      // Clean the phone number
      const cleanPhone = value.replace(/\D/g, "");
      console.log("Clean phone in validator:", cleanPhone);

      if (!validateUAEPhone(value)) {
        console.log("Phone validation failed in validator for:", value);
        throw new Error(
          "Please provide a valid UAE phone number (e.g., 0501234567)"
        );
      }

      console.log("Phone validation passed in validator");
      return true;
    }),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  body("role")
    .optional()
    .isIn(["renter", "owner"])
    .withMessage("Role must be either renter or owner"),

  body("preferredCity")
    .optional()
    .isIn([
      "Dubai",
      "Abu Dhabi",
      "Sharjah",
      "Ajman",
      "Fujairah",
      "Ras Al Khaimah",
      "Umm Al Quwain",
    ])
    .withMessage("Please select a valid UAE city"),
];

export const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Car validation rules (unchanged)
export const validateCreateCar = [
  body("title")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
  body("city")
    .isIn([
      "Dubai",
      "Abu Dhabi",
      "Sharjah",
      "Ajman",
      "Fujairah",
      "Ras Al Khaimah",
      "Umm Al Quwain",
    ])
    .withMessage("Please select a valid UAE city"),
  body("make")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Car make is required"),
  body("model")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Car model is required"),
  body("year")
    .isInt({ min: 2010, max: new Date().getFullYear() + 1 })
    .withMessage("Car year must be between 2010 and current year"),
  // Handle both price and pricePerDay
  body("price")
    .optional()
    .isFloat({ min: 50, max: 5000 })
    .withMessage("Price must be between AED 50 and AED 5000 per day"),
  body("pricePerDay")
    .optional()
    .isFloat({ min: 50, max: 5000 })
    .withMessage("Price per day must be between AED 50 and AED 5000 per day"),
  body("mileage")
    .isInt({ min: 0, max: 500000 })
    .withMessage("Mileage must be between 0 and 500,000 km"),
  body("seatingCapacity")
    .isInt({ min: 2, max: 8 })
    .withMessage("Seating capacity must be between 2 and 8"),
  body("plateNumber")
    .matches(/^[A-Z]{1,3}[0-9]{1,5}$/)
    .withMessage("Please provide a valid UAE plate number"),
  body("transmission")
    .isIn(["Automatic", "Manual", "CVT", "Semi-Automatic"])
    .withMessage("Please select a valid transmission type"),
  body("fuelType")
    .isIn(["Petrol", "Diesel", "Electric", "Hybrid", "Plug-in Hybrid"])
    .withMessage("Please select a valid fuel type"),
  body("availabilityFrom")
    .isISO8601()
    .withMessage("Please provide a valid availability start date"),
  body("availabilityTo")
    .isISO8601()
    .withMessage("Please provide a valid availability end date"),
];

// Booking validation rules
export const validateCreateBooking = [
  body("carId").isMongoId().withMessage("Please provide a valid car ID"),
  body("startDate")
    .isISO8601()
    .withMessage("Please provide a valid start date"),
  body("endDate").isISO8601().withMessage("Please provide a valid end date"),
  body("paymentMethod")
    .optional()
    .isIn(["Cash", "Card", "BankTransfer", "DigitalWallet", "credit_card", "debit_card", "cash_on_delivery", "cash", "bank_transfer", "paypal"])
    .withMessage("Please select a valid payment method"),
  body("pickupLocation")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Pickup location must not exceed 200 characters"),
  body("returnLocation")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Return location must not exceed 200 characters"),
  body("deliveryRequested")
    .optional()
    .isBoolean()
    .withMessage("Delivery requested must be true or false"),
  body("deliveryAddress")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Delivery address must not exceed 300 characters"),
  body("renterNotes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes must not exceed 500 characters"),
];

export const validateUpdateBookingStatus = [
  body("status")
    .isIn([
      "pending",
      "approved",
      "rejected",
      "cancelled",
      "confirmed",
      "active",
      "completed",
    ])
    .withMessage("Please provide a valid booking status"),
  body("ownerNotes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Owner notes must not exceed 500 characters"),
  body("rejectionReason")
    .optional()
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage("Rejection reason must be between 10 and 200 characters"),
];

export const validateAddReview = [
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("comment")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Comment must not exceed 500 characters"),
];

// Query parameter validation
export const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
];

// Enhanced validation error handler with better debugging
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log("=== VALIDATION ERRORS ===");
    console.log("Request body:", req.body);
    console.log("Validation errors:", errors.array());

    const formattedErrors = errors.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formattedErrors,
      code: "VALIDATION_ERROR",
      debug: {
        totalErrors: formattedErrors.length,
        requestBody: req.body,
      },
    });
  }

  console.log("✅ Validation passed");
  next();
};

// Rate limiting configurations
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Car data validation function
export const validateCarData = (carData) => {
  const errors = [];
  const currentYear = new Date().getFullYear();

  // Required fields
  if (!carData.title || carData.title.trim().length === 0) {
    errors.push('Title is required');
  }
  if (!carData.make || carData.make.trim().length === 0) {
    errors.push('Make is required');
  }
  if (!carData.model || carData.model.trim().length === 0) {
    errors.push('Model is required');
  }
  if (!carData.year) {
    errors.push('Year is required');
  }
  if (!carData.price) {
    errors.push('Price is required');
  }

  // Validate year range
  if (carData.year && (carData.year < 1990 || carData.year > currentYear + 1)) {
    errors.push('Year must be between 1990 and current year + 1');
  }

  // Validate price
  if (carData.price && carData.price <= 0) {
    errors.push('Price must be greater than 0');
  }

  // Validate seating capacity
  if (carData.seatingCapacity && (carData.seatingCapacity < 2 || carData.seatingCapacity > 12)) {
    errors.push('Seating capacity must be between 2 and 12');
  }

  // Validate transmission
  const validTransmissions = ['Manual', 'Automatic', 'CVT'];
  if (carData.transmission && !validTransmissions.includes(carData.transmission)) {
    errors.push('Transmission must be one of: Manual, Automatic, CVT');
  }

  // Validate fuel type
  const validFuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
  if (carData.fuelType && !validFuelTypes.includes(carData.fuelType)) {
    errors.push('Fuel type must be one of: Petrol, Diesel, Hybrid, Electric');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Car data sanitization function
export const sanitizeCarData = (carData) => {
  const sanitized = {};

  // String fields - trim whitespace
  const stringFields = ['title', 'description', 'make', 'model', 'color', 'transmission', 'fuelType', 'city'];
  stringFields.forEach(field => {
    if (carData[field] !== undefined) {
      if (field === 'plateNumber') {
        // Special handling for plate number - uppercase
        sanitized[field] = carData[field].toString().trim().toUpperCase();
      } else {
        sanitized[field] = carData[field].toString().trim();
      }
    }
  });

  // Numeric fields - convert to numbers
  const numericFields = ['year', 'price', 'seatingCapacity', 'mileage'];
  numericFields.forEach(field => {
    if (carData[field] !== undefined) {
      const num = parseFloat(carData[field]);
      if (!isNaN(num)) {
        sanitized[field] = field === 'year' || field === 'seatingCapacity' || field === 'mileage' ? 
          parseInt(carData[field]) : num;
      }
    }
  });

  // Handle plate number separately
  if (carData.plateNumber !== undefined) {
    sanitized.plateNumber = carData.plateNumber.toString().trim().toUpperCase();
  }

  // Handle array fields (features)
  if (carData.features !== undefined) {
    if (Array.isArray(carData.features)) {
      sanitized.features = carData.features;
    } else {
      sanitized.features = [carData.features];
    }
  }

  // Copy other fields as-is
  Object.keys(carData).forEach(key => {
    if (sanitized[key] === undefined) {
      sanitized[key] = carData[key];
    }
  });

  return sanitized;
};
