import express from "express";
import {
  createBooking,
  getMyBookings,
  getBookingsForOwner,
  updateBookingStatus,
} from "../controllers/bookingController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createBooking);
router.get("/me", protect, getMyBookings);
router.get("/owner", protect, getBookingsForOwner);
router.put("/:id", protect, updateBookingStatus);

export default router;
