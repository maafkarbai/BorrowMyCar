import express from "express";
import {
  createCar,
  getCars, // <- use this, not getAllCars
  getCarById,
  updateCar,
  deleteCar,
  getCarsByOwner,
} from "../controllers/carController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { body, validationResult } from "express-validator";
import multer from "multer";
import { storage } from "../utils/cloudinary.js";

const upload = multer({ storage });
const router = express.Router();

const carValidationRules = [
  body("title").notEmpty().withMessage("Title is required"),
  body("city").notEmpty().withMessage("City is required"),
  body("pricePerDay").isNumeric().withMessage("Price must be a number"),
  body("availabilityFrom").isDate().withMessage("Invalid start date"),
  body("availabilityTo").isDate().withMessage("Invalid end date"),
];

// POST /api/cars
router.post(
  "/",
  protect,
  upload.array("images", 3),
  carValidationRules,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  async (req, res, next) => {
    req.body.images = req.files?.map((file) => file.path) || [];
    if (req.body.images.length === 0) {
      req.body.images = ["https://via.placeholder.com/300"];
    }
    next();
  },
  createCar
);

// GET /api/cars
router.get("/", getCars);

// GET /api/cars/:id
router.get("/:id", getCarById);

// PUT /api/cars/:id
router.put("/:id", protect, updateCar);

// DELETE /api/cars/:id
router.delete("/:id", protect, deleteCar);

export default router;
