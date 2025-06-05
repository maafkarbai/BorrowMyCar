// routes/authRoutes.js - FIXED VERSION
import express from "express";
import {
  signup,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
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

// PUBLIC ROUTES (No authentication required)
router.post(
  "/signup",
  authLimiter,
  uploadUserDocuments,
  validateSignup,
  handleValidationErrors,
  signup
);

router.post(
  "/register", // Alternative endpoint name
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

// PROTECTED ROUTES (Authentication required)
router.use(protect); // Apply protection to all routes below

router.get("/profile", getProfile);
router.patch("/profile", uploadProfileImage, updateProfile);
router.patch("/change-password", changePassword);
router.post("/logout", logout);

export default router;
