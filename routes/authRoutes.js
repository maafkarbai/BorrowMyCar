// routes/authRoutes.js (Authentication Routes Only)
import express from "express";
import {
  signup,
  login,
  getProfile,
  updateProfile,
} from "../controllers/authController.js";
import { protect, authLimiter } from "../middlewares/authMiddleware.js";
import {
  uploadUserDocuments,
  uploadProfileImage,
} from "../middlewares/multer.js";
import {
  validateSignup,
  validateLogin,
  handleValidationErrors,
} from "../utils/validators.js";

const router = express.Router();

// Public routes with rate limiting
router.post(
  "/signup",
  authLimiter,
  uploadUserDocuments,
  validateSignup,
  handleValidationErrors,
  signup
);

router.post(
  "/login",
  authLimiter,
  validateLogin,
  handleValidationErrors,
  login
);

// Protected routes
router.use(protect); // All routes below require authentication
router.get("/profile", getProfile);
router.patch("/profile", uploadProfileImage, updateProfile);

export default router;
