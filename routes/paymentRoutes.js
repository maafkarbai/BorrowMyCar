import express from "express";
import {
  createPaymentIntent,
  confirmPayment,
  handleStripeWebhook,
  getPaymentHistory,
} from "../controllers/paymentController.js";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import { body } from "express-validator";
import { handleValidationErrors } from "../utils/validators.js";

const router = express.Router();

// Webhook route (no auth needed, but needs raw body)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

// All other routes require authentication
router.use(protect);

// Payment intent creation (renters only)
router.post(
  "/create-intent",
  restrictTo("renter"),
  [body("bookingId").isMongoId().withMessage("Valid booking ID required")],
  handleValidationErrors,
  createPaymentIntent
);

// Payment confirmation
router.post(
  "/confirm",
  restrictTo("renter"),
  [
    body("paymentIntentId")
      .notEmpty()
      .withMessage("Payment intent ID required"),
    body("bookingId").isMongoId().withMessage("Valid booking ID required"),
  ],
  handleValidationErrors,
  confirmPayment
);

// Payment history
router.get("/history", restrictTo("renter"), getPaymentHistory);

export default router;
