// routes/bookingRoutes.js (Fixed - Complete File)
import express from "express";
import {
  createBooking,
  getMyBookings,
  getBookingsForOwner,
  updateBookingStatus,
  getBookingById,
  cancelBooking,
  addReview,
} from "../controllers/bookingController.js";
import {
  protect,
  restrictTo,
  requireApproval,
} from "../middlewares/authMiddleware.js";
import {
  validateCreateBooking,
  validateUpdateBookingStatus,
  validateAddReview,
  validatePagination,
  validateMongoId,
  handleValidationErrors,
} from "../utils/validators.js";

const router = express.Router();

// All booking routes require authentication
router.use(protect);

// Renter routes
router.post(
  "/",
  requireApproval,
  validateCreateBooking,
  handleValidationErrors,
  createBooking
);

router.get(
  "/my-bookings",
  validatePagination,
  handleValidationErrors,
  getMyBookings
);

router.patch(
  "/:id/cancel",
  validateMongoId,
  handleValidationErrors,
  cancelBooking
);

router.post(
  "/:id/review",
  validateMongoId,
  validateAddReview,
  handleValidationErrors,
  addReview
);

// Owner routes
router.get(
  "/owner",
  restrictTo("owner"),
  validatePagination,
  handleValidationErrors,
  getBookingsForOwner
);

router.patch(
  "/:id/status",
  validateMongoId,
  validateUpdateBookingStatus,
  handleValidationErrors,
  updateBookingStatus
);

// Shared routes (both renter and owner can access)
router.get("/:id", validateMongoId, handleValidationErrors, getBookingById);

export default router;
