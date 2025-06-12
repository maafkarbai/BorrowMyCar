// controllers/carController.js - FIXED with consistent price handling
import Car from "../models/Car.js";
import Booking from "../models/Booking.js";
import {
  uploadImagesToCloud,
  deleteImagesFromCloud,
} from "../utils/cloudUploader.js";
import { handleAsyncError } from "../utils/errorHandler.js";

// Enhanced car data sanitizer with FIXED field mapping
const sanitizeCarData = (data) => {
  const sanitized = {};

  // Basic fields
  if (data.title) sanitized.title = data.title.toString().trim();
  if (data.description)
    sanitized.description = data.description.toString().trim();
  if (data.city) sanitized.city = data.city.toString().trim();
  if (data.make) sanitized.make = data.make.toString().trim();
  if (data.model) sanitized.model = data.model.toString().trim();
  if (data.color) sanitized.color = data.color.toString().trim();
  if (data.plateNumber)
    sanitized.plateNumber = data.plateNumber.toString().toUpperCase().trim();

  // CRITICAL FIX: Handle both pricePerDay (frontend) and price (backend)
  if (data.pricePerDay) {
    sanitized.price = parseFloat(data.pricePerDay);
  } else if (data.price) {
    sanitized.price = parseFloat(data.price);
  }

  // Numeric fields
  if (data.year) sanitized.year = parseInt(data.year);
  if (data.mileage) sanitized.mileage = parseInt(data.mileage);
  if (data.seatingCapacity)
    sanitized.seatingCapacity = parseInt(data.seatingCapacity);

  // Enum fields
  if (data.transmission)
    sanitized.transmission = data.transmission.toString().trim();
  if (data.fuelType) sanitized.fuelType = data.fuelType.toString().trim();
  if (data.specifications)
    sanitized.specifications = data.specifications.toString().trim();

  // Array fields
  if (data.features) {
    sanitized.features = Array.isArray(data.features)
      ? data.features.map((f) => f.toString().trim())
      : [data.features.toString().trim()];
  }

  // Date fields
  if (data.availabilityFrom) sanitized.availabilityFrom = data.availabilityFrom;
  if (data.availabilityTo) sanitized.availabilityTo = data.availabilityTo;

  return sanitized;
};

// CREATE CAR - FIXED
export const createCar = handleAsyncError(async (req, res) => {
  const user = req.user;

  // Check if user is approved
  if (!user.isApproved) {
    return res.status(403).json({
      success: false,
      message: "Your account must be approved before listing cars",
      code: "ACCOUNT_NOT_APPROVED",
    });
  }

  // Role-based authorization
  if (user.role !== "owner") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Only car owners can list vehicles.",
      code: "INSUFFICIENT_PERMISSIONS",
    });
  }

  // Extract and sanitize input data
  const carData = sanitizeCarData(req.body);
  console.log("Sanitized car data:", carData);

  // VALIDATION: Ensure price is set
  if (!carData.price || carData.price <= 0) {
    return res.status(400).json({
      success: false,
      message: "Valid price per day is required",
      code: "INVALID_PRICE",
    });
  }

  // Handle images upload - REQUIRE MINIMUM 3 IMAGES
  let imageUrls = [];
  if (req.files && req.files.length > 0) {
    if (req.files.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Minimum 3 images required",
        code: "INSUFFICIENT_IMAGES",
      });
    }

    try {
      imageUrls = await uploadImagesToCloud(req.files);
    } catch (uploadError) {
      console.error("Image upload error:", uploadError);
      return res.status(500).json({
        success: false,
        message: "Failed to upload images. Please try again.",
        code: "IMAGE_UPLOAD_FAILED",
      });
    }
  } else {
    return res.status(400).json({
      success: false,
      message: "Car images are required",
      code: "MISSING_IMAGES",
    });
  }

  // Create car document
  const newCar = new Car({
    ...carData,
    images: imageUrls,
    owner: user.id,
    status: "active", // Set to active instead of pending for demo
  });

  const savedCar = await newCar.save();
  await savedCar.populate("owner", "name email phone");

  // Add pricePerDay for frontend compatibility
  const responseData = {
    ...savedCar.toObject(),
    pricePerDay: savedCar.price,
  };

  res.status(201).json({
    success: true,
    message: "Car listed successfully!",
    data: { car: responseData },
  });
});

// GET CARS - FIXED to handle both price fields
export const getCars = handleAsyncError(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    city,
    priceMin,
    priceMax,
    makeModel,
    make,
    year,
    transmission,
    fuelType,
    seatingCapacity,
    features,
    deliveryAvailable,
    sortBy = "createdAt",
    sortOrder = "desc",
    search,
  } = req.query;

  console.log("GET Cars query params:", req.query);

  // Build filter object
  const filter = { status: "active" };

  // City filter
  if (city) filter.city = city;

  // Price range filter
  if (priceMin || priceMax) {
    filter.price = {};
    if (priceMin) filter.price.$gte = parseFloat(priceMin);
    if (priceMax) filter.price.$lte = parseFloat(priceMax);
  }

  // Car specifications
  if (make) filter.make = new RegExp(make, "i");
  if (makeModel) {
    filter.$or = [
      { make: new RegExp(makeModel, "i") },
      { model: new RegExp(makeModel, "i") },
      { title: new RegExp(makeModel, "i") },
    ];
  }
  if (year) filter.year = parseInt(year);
  if (transmission) filter.transmission = transmission;
  if (fuelType) filter.fuelType = fuelType;
  if (seatingCapacity) filter.seatingCapacity = parseInt(seatingCapacity);

  // Features filter
  if (features) {
    const featureArray = Array.isArray(features) ? features : [features];
    filter.features = { $in: featureArray };
  }

  // Search in title, description, make, and model
  if (search) {
    filter.$or = [
      { title: new RegExp(search, "i") },
      { description: new RegExp(search, "i") },
      { make: new RegExp(search, "i") },
      { model: new RegExp(search, "i") },
    ];
  }

  // Only show available cars
  filter.availabilityTo = { $gte: new Date() };

  console.log("Cars filter:", filter);

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

  // Execute query with LEAN for better performance
  const [cars, totalCount] = await Promise.all([
    Car.find(filter)
      .populate("owner", "name email phone averageRating")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Car.countDocuments(filter),
  ]);

  console.log(`Found ${cars.length} cars out of ${totalCount} total`);

  // ADD pricePerDay field for frontend compatibility
  const enhancedCars = cars.map((car) => ({
    ...car,
    pricePerDay: car.price, // Frontend expects this field
  }));

  const totalPages = Math.ceil(totalCount / parseInt(limit));

  res.json({
    success: true,
    data: {
      cars: enhancedCars,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
        limit: parseInt(limit),
      },
    },
  });
});

// Get single car by ID - FIXED
export const getCarById = handleAsyncError(async (req, res) => {
  const { id } = req.params;

  let car = await Car.findById(id)
    .populate(
      "owner",
      "name email phone profileImage averageRating totalBookings createdAt"
    )
    .lean();

  if (!car || car.status === "deleted") {
    return res.status(404).json({
      success: false,
      message: "Car not found",
      code: "CAR_NOT_FOUND",
    });
  }

  // Check if car is still available
  const today = new Date();
  if (new Date(car.availabilityTo) < today) {
    return res.status(410).json({
      success: false,
      message: "This car listing has expired",
      code: "LISTING_EXPIRED",
    });
  }

  // CRITICAL FIX: Add pricePerDay for frontend compatibility
  car.pricePerDay = car.price;

  res.json({
    success: true,
    data: { car },
  });
});

// UPDATE CAR
export const updateCar = handleAsyncError(async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  // Find the car and check ownership
  const car = await Car.findById(id);
  if (!car) {
    return res.status(404).json({
      success: false,
      message: "Car not found",
      code: "CAR_NOT_FOUND",
    });
  }

  // Check ownership
  if (car.owner.toString() !== user.id) {
    return res.status(403).json({
      success: false,
      message: "You can only update your own cars",
      code: "UNAUTHORIZED",
    });
  }

  // Sanitize update data
  const updateData = sanitizeCarData(req.body);

  // Handle new images if provided
  if (req.files && req.files.length > 0) {
    try {
      // Delete old images
      if (car.images && car.images.length > 0) {
        await deleteImagesFromCloud(car.images).catch(console.error);
      }

      // Upload new images
      const newImageUrls = await uploadImagesToCloud(req.files);
      updateData.images = newImageUrls;
    } catch (uploadError) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload new images",
        code: "IMAGE_UPLOAD_FAILED",
      });
    }
  }

  // Update the car
  const updatedCar = await Car.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate("owner", "name email phone");

  // Add pricePerDay for frontend compatibility
  const responseData = {
    ...updatedCar.toObject(),
    pricePerDay: updatedCar.price,
  };

  res.json({
    success: true,
    message: "Car updated successfully",
    data: { car: responseData },
  });
});

// DELETE CAR (Soft delete)
export const deleteCar = handleAsyncError(async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  // Find the car and check ownership
  const car = await Car.findById(id);
  if (!car) {
    return res.status(404).json({
      success: false,
      message: "Car not found",
      code: "CAR_NOT_FOUND",
    });
  }

  // Check ownership
  if (car.owner.toString() !== user.id) {
    return res.status(403).json({
      success: false,
      message: "You can only delete your own cars",
      code: "UNAUTHORIZED",
    });
  }

  // Check for active bookings
  const activeBookings = await Booking.find({
    car: id,
    status: { $in: ["pending", "approved", "confirmed", "active"] },
  });

  if (activeBookings.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Cannot delete car with active bookings",
      code: "ACTIVE_BOOKINGS_EXIST",
    });
  }

  // Soft delete (mark as deleted)
  car.status = "deleted";
  car.deletedAt = new Date();
  await car.save();

  // Optional: Delete images from cloud storage
  if (car.images && car.images.length > 0) {
    deleteImagesFromCloud(car.images).catch(console.error);
  }

  res.json({
    success: true,
    message: "Car deleted successfully",
  });
});

// GET CARS BY OWNER
export const getCarsByOwner = handleAsyncError(async (req, res) => {
  const { ownerId } = req.params;
  const {
    page = 1,
    limit = 12,
    status = "active",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build filter
  const filter = { owner: ownerId };
  if (status !== "all") {
    filter.status = status;
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

  // Execute query
  const [cars, totalCount] = await Promise.all([
    Car.find(filter)
      .populate("owner", "name email phone profileImage")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Car.countDocuments(filter),
  ]);

  // Add pricePerDay for frontend compatibility
  const enhancedCars = cars.map((car) => ({
    ...car,
    pricePerDay: car.price,
  }));

  const totalPages = Math.ceil(totalCount / parseInt(limit));

  res.json({
    success: true,
    data: {
      cars: enhancedCars,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
        limit: parseInt(limit),
      },
    },
  });
});

// GET MY CARS (for authenticated owner)
export const getMyCars = handleAsyncError(async (req, res) => {
  const user = req.user;
  const {
    page = 1,
    limit = 12,
    status = "active",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build filter for current user's cars
  const filter = { owner: user.id };
  if (status !== "all") {
    filter.status = status;
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

  // Execute query
  const [cars, totalCount] = await Promise.all([
    Car.find(filter).sort(sortOptions).skip(skip).limit(parseInt(limit)).lean(),
    Car.countDocuments(filter),
  ]);

  // Add pricePerDay and booking stats
  const enhancedCars = await Promise.all(
    cars.map(async (car) => {
      // Get booking stats for each car
      const bookingStats = await Booking.aggregate([
        { $match: { car: car._id } },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            totalEarnings: { $sum: "$totalPayable" },
            activeBookings: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      "$status",
                      ["pending", "approved", "confirmed", "active"],
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);

      const stats = bookingStats[0] || {
        totalBookings: 0,
        totalEarnings: 0,
        activeBookings: 0,
      };

      return {
        ...car,
        pricePerDay: car.price,
        bookingStats: stats,
      };
    })
  );

  const totalPages = Math.ceil(totalCount / parseInt(limit));

  res.json({
    success: true,
    data: {
      cars: enhancedCars,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
        limit: parseInt(limit),
      },
    },
  });
});
