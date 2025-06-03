import express from 'express';
import {
  createCar,
  getAllCars,
  getCarById,
  updateCar,
  deleteCar,
} from '../controllers/carController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { body } from 'express-validator';
import { validationResult } from 'express-validator';
import multer from 'multer';
import { storage } from '../utils/cloudinary.js';

const carValidationRules = [
  body('title').notEmpty().withMessage('Title is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('pricePerDay').isNumeric().withMessage('Price must be a number'),
  body('availabilityFrom').isDate().withMessage('Invalid start date'),
  body('availabilityTo').isDate().withMessage('Invalid end date'),
];

const router = express.Router();
const upload = multer({ storage });

router.post(
  '/',
  protect,
  upload.array('images', 3), // max 3 images
  carValidationRules,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
  async (req, res, next) => {
    // Inject uploaded image URLs into body
    req.body.images = req.files.map(file => file.path);
      if (!req.body.images || req.body.images.length === 0) {
    req.body.images = ['https://via.placeholder.com/300'];
  }
    next();
  },
  createCar
);


router.get('/', getAllCars);                    // GET  /api/cars
router.get('/:id', getCarById);                 // GET  /api/cars/:id
router.put('/:id', protect, updateCar);         // PUT  /api/cars/:id
router.delete('/:id', protect, deleteCar);      // DELETE /api/cars/:id

export default router;
