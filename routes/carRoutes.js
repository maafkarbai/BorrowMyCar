// routes/carRoutes.js (Updated with all routes)
import express from "express";
import {
  createCar,
  getCars,
  getCarById,
  updateCar,
  deleteCar,
  getCarsByOwner,
  getMyCars,
  getCarAvailability,
} from "../controllers/carController.js";
import {
  protect,
  restrictTo,
  requireApproval,
  optionalAuth,
  uploadLimiter,
} from "../middlewares/authMiddleware.js";
import { uploadCarImages } from "../middlewares/multer.js";
import { body, validationResult } from "express-validator";

const router = express.Router();

// Car validation rules to match model fields
const carValidationRules = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),

  body("description")
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),

  body("city")
    .notEmpty()
    .withMessage("City is required")
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

  // Handle both price and pricePerDay from frontend
  body("price")
    .optional()
    .isNumeric()
    .withMessage("Price must be a number")
    .isFloat({ min: 50, max: 5000 })
    .withMessage("Price must be between AED 50 and AED 5000 per day"),

  body("pricePerDay")
    .optional()
    .isNumeric()
    .withMessage("Price per day must be a number")
    .isFloat({ min: 50, max: 5000 })
    .withMessage("Price per day must be between AED 50 and AED 5000"),

  body("make")
    .notEmpty()
    .withMessage("Car make is required")
    .isLength({ min: 2 })
    .withMessage("Car make must be at least 2 characters"),

  body("model").notEmpty().withMessage("Car model is required"),

  body("year")
    .isInt({ min: 2010, max: new Date().getFullYear() + 1 })
    .withMessage("Car year must be between 2010 and current year"),

  body("color").notEmpty().withMessage("Car color is required"),

  body("plateNumber")
    .notEmpty()
    .withMessage("Plate number is required")
    .matches(/^[A-Z]{1,3}[0-9]{1,5}$/)
    .withMessage(
      "Please enter a valid UAE plate number (e.g., A12345, ABC123)"
    ),

  body("transmission")
    .isIn(["Automatic", "Manual", "CVT", "Semi-Automatic"])
    .withMessage("Please select a valid transmission type"),

  body("fuelType")
    .isIn(["Petrol", "Diesel", "Electric", "Hybrid", "Plug-in Hybrid"])
    .withMessage("Please select a valid fuel type"),

  body("mileage")
    .isInt({ min: 0, max: 500000 })
    .withMessage("Mileage must be between 0 and 500,000 km"),

  body("seatingCapacity")
    .isInt({ min: 2, max: 8 })
    .withMessage("Seating capacity must be between 2 and 8"),

  body("availabilityFrom")
    .isISO8601()
    .withMessage("Please provide a valid availability start date"),

  body("availabilityTo")
    .isISO8601()
    .withMessage("Please provide a valid availability end date"),
];

// Enhanced validation error handler
const handleValidationErrors = (req, res, next) => {
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

// PUBLIC ROUTES
// GET /api/cars - Get all cars with filtering
router.get(
  "/",
  optionalAuth, // Optional authentication for personalized results
  getCars
);

// GET /api/cars/:id - Get single car
router.get("/:id", optionalAuth, getCarById);

// GET /api/cars/:id/availability - Get car availability and existing bookings
router.get("/:id/availability", getCarAvailability);

// GET /api/cars/owner/:ownerId - Get cars by specific owner
router.get("/owner/:ownerId", getCarsByOwner);

// PROTECTED ROUTES (Authentication required)
router.use(protect); // Apply protection to all routes below

// GET /api/cars/my/cars - Get current user's cars (Owner only)
router.get("/my/cars", restrictTo("owner"), getMyCars);

// POST /api/cars - Create new car (Owner only)
router.post(
  "/",
  restrictTo("owner"), // Only owners can create cars
  requireApproval, // Account must be approved
  uploadLimiter, // Rate limiting for uploads
  uploadCarImages, // Handle file upload (up to 10 images)
  carValidationRules, // Validate input data
  handleValidationErrors, // Handle validation errors
  createCar // Create car controller
);

// PUT /api/cars/:id - Update car (Owner only, own cars)
router.put(
  "/:id",
  restrictTo("owner"),
  uploadCarImages, // Allow image updates (up to 10 images)
  carValidationRules, // Validate updated data
  handleValidationErrors,
  updateCar
);

// PATCH /api/cars/:id - Partial update car (Owner only, own cars)
router.patch(
  "/:id",
  restrictTo("owner"),
  uploadCarImages, // Allow image updates
  updateCar
);

// DELETE /api/cars/:id - Delete car (Owner only, own cars)
router.delete("/:id", restrictTo("owner"), deleteCar);

export default router;
