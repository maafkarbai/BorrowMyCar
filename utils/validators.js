// utils/validators.js (Updated Phone Validation)
import { body, param, query, validationResult } from "express-validator";
import rateLimit from "express-rate-limit";
import { validateUAEPhone } from "./phoneUtils.js";

// User validation rules
export const validateSignup = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("phone").custom((value) => {
    if (!validateUAEPhone(value)) {
      throw new Error(
        "Please provide a valid UAE phone number (e.g., 0501234567)"
      );
    }
    return true;
  }),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("role")
    .optional()
    .isIn(["renter", "owner"])
    .withMessage("Role must be either renter or owner"),
];

export const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Car validation rules
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
  body("price")
    .isFloat({ min: 50, max: 5000 })
    .withMessage("Price must be between AED 50 and AED 5000 per day"),
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
    .isIn(["Cash", "Card", "BankTransfer", "DigitalWallet"])
    .withMessage("Please select a valid payment method"),
  body("pickupLocation")
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Pickup location must be between 5 and 200 characters"),
  body("returnLocation")
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Return location must be between 5 and 200 characters"),
  body("deliveryRequested")
    .optional()
    .isBoolean()
    .withMessage("Delivery requested must be true or false"),
  body("deliveryAddress")
    .optional()
    .trim()
    .isLength({ min: 10, max: 300 })
    .withMessage("Delivery address must be between 10 and 300 characters"),
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

export const validateCarFilters = [
  query("city")
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
  query("minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum price must be a positive number"),
  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum price must be a positive number"),
  query("year")
    .optional()
    .isInt({ min: 2010, max: new Date().getFullYear() + 1 })
    .withMessage("Year must be between 2010 and current year"),
  query("transmission")
    .optional()
    .isIn(["Automatic", "Manual", "CVT", "Semi-Automatic"])
    .withMessage("Please select a valid transmission type"),
  query("fuelType")
    .optional()
    .isIn(["Petrol", "Diesel", "Electric", "Hybrid", "Plug-in Hybrid"])
    .withMessage("Please select a valid fuel type"),
  query("seatingCapacity")
    .optional()
    .isInt({ min: 2, max: 8 })
    .withMessage("Seating capacity must be between 2 and 8"),
  query("sortBy")
    .optional()
    .isIn(["createdAt", "price", "year", "totalBookings", "averageRating"])
    .withMessage("Please select a valid sort field"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort order must be asc or desc"),
];

// Parameter validation
export const validateMongoId = [
  param("id").isMongoId().withMessage("Please provide a valid ID"),
];

// Custom validation functions
export const customValidations = {
  // Check if end date is after start date
  isEndDateAfterStartDate: (endDate, { req }) => {
    if (
      req.body.startDate &&
      new Date(endDate) <= new Date(req.body.startDate)
    ) {
      throw new Error("End date must be after start date");
    }
    return true;
  },

  // Check if date is not in the past
  isNotPastDate: (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(date) < today) {
      throw new Error("Date cannot be in the past");
    }
    return true;
  },

  // Check UAE phone number format
  isValidUAEPhone: (phone) => {
    if (!validateUAEPhone(phone)) {
      throw new Error(
        "Please provide a valid UAE phone number (e.g., 0501234567)"
      );
    }
    return true;
  },

  // Check UAE plate number format
  isValidUAEPlate: (plateNumber) => {
    const uaePlateRegex = /^[A-Z]{1,3}[0-9]{1,5}$/;
    if (!uaePlateRegex.test(plateNumber.toUpperCase())) {
      throw new Error(
        "Please provide a valid UAE plate number (e.g., A12345, ABC123)"
      );
    }
    return true;
  },
};

// Express validator error handler middleware
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formattedErrors,
      code: "VALIDATION_ERROR",
    });
  }
  next();
};

// Rate limiting configurations
// General rate limiter
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
