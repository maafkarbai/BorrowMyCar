// routes/adminRoutes.js - Admin panel routes
import express from "express";
import {
  getAdminStats,
  getAllUsers,
  updateUserApproval,
  getAllCars,
  updateCarApproval,
  getAllBookings,
  deleteUser,
  deleteCar,
  verifyDrivingLicense,
} from "../controllers/adminController.js";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import { body } from "express-validator";
import { handleValidationErrors } from "../utils/validators.js";

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(restrictTo("admin"));

// Dashboard stats
router.get("/stats", getAdminStats);

// User management
router.get("/users", getAllUsers);
router.patch(
  "/users/:userId/approval",
  [
    body("isApproved").isBoolean().withMessage("isApproved must be boolean"),
    body("reason")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Reason must be less than 500 characters"),
  ],
  handleValidationErrors,
  updateUserApproval
);
router.delete("/users/:userId", deleteUser);

// Car management
router.get("/cars", getAllCars);
router.patch(
  "/cars/:carId/approval",
  [
    body("status")
      .isIn(["active", "rejected", "pending"])
      .withMessage("Status must be active, rejected, or pending"),
    body("reason")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Reason must be less than 500 characters"),
    body("adminNotes")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Admin notes must be less than 1000 characters"),
  ],
  handleValidationErrors,
  updateCarApproval
);
router.delete("/cars/:carId", deleteCar);

// Booking management
router.get("/bookings", getAllBookings);

// Document verification
router.patch(
  "/users/:userId/verify-license",
  [
    body("verified").isBoolean().withMessage("verified must be boolean"),
    body("notes")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Notes must be less than 500 characters"),
  ],
  handleValidationErrors,
  verifyDrivingLicense
);

export default router;