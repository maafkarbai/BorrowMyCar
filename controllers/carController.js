import Car from "../models/Car.js";
import {
  uploadImagesToCloud,
  deleteImagesFromCloud,
} from "../utils/cloudUploader.js";

// Simple async error handler
const handleAsyncError = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Simple data sanitizer
const sanitizeCarData = (data) => {
  const sanitized = {};
  if (data.title) sanitized.title = data.title.toString().trim();
  if (data.description)
    sanitized.description = data.description.toString().trim();
  if (data.city) sanitized.city = data.city.toString().trim();
  if (data.transmission)
    sanitized.transmission = data.transmission.toString().trim();
  if (data.fuelType) sanitized.fuelType = data.fuelType.toString().trim();
  if (data.specifications)
    sanitized.specifications = data.specifications.toString().trim();
  if (data.pricePerDay) sanitized.pricePerDay = parseFloat(data.pricePerDay);
  if (data.year) sanitized.year = parseInt(data.year);
  if (data.mileage) sanitized.mileage = parseInt(data.mileage);
  if (data.availabilityFrom) sanitized.availabilityFrom = data.availabilityFrom;
  if (data.availabilityTo) sanitized.availabilityTo = data.availabilityTo;
  return sanitized;
};

// Simple validator
const validateCarData = (data, isPartial = false) => {
  const errors = [];

  if (!isPartial) {
    if (!data.title || data.title.length < 3) {
      errors.push("Title must be at least 3 characters long");
    }
    if (!data.description || data.description.length < 10) {
      errors.push("Description must be at least 10 characters long");
    }
    if (!data.city || data.city.length < 2) {
      errors.push("City is required");
    }
    if (!data.pricePerDay || data.pricePerDay <= 0) {
      errors.push("Price per day must be greater than 0");
    }
    if (!data.availabilityFrom) {
      errors.push("Availability start date is required");
    }
    if (!data.availabilityTo) {
      errors.push("Availability end date is required");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Create car listing
export const createCar = handleAsyncError(async (req, res) => {
  const user = req.user;

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
  const {
    title,
    description,
    city,
    pricePerDay,
    availabilityFrom,
    availabilityTo,
    transmission,
    fuelType,
    year,
    mileage,
    specifications,
  } = carData;

  // Comprehensive validation
  const validationResult = validateCarData(carData);
  if (!validationResult.isValid) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: validationResult.errors,
      code: "VALIDATION_ERROR",
    });
  }

  // Enhanced date validation
  const from = new Date(availabilityFrom);
  const to = new Date(availabilityTo);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (from < today) {
    return res.status(400).json({
      success: false,
      message: "Availability start date cannot be in the past",
      code: "INVALID_START_DATE",
    });
  }

  if (from >= to) {
    return res.status(400).json({
      success: false,
      message: "End date must be after start date",
      code: "INVALID_DATE_RANGE",
    });
  }

  // Maximum availability period validation (e.g., 1 year)
  const maxDays = 365;
  const daysDiff = Math.ceil((to - from) / (1000 * 60 * 60 * 24));
  if (daysDiff > maxDays) {
    return res.status(400).json({
      success: false,
      message: `Maximum availability period is ${maxDays} days`,
      code: "AVAILABILITY_TOO_LONG",
    });
  }

  // Image validation and upload
  let imageUrls = [];
  if (req.files && req.files.length > 0) {
    // Validate file count
    if (req.files.length > 10) {
      return res.status(400).json({
        success: false,
        message: "Maximum 10 images allowed",
        code: "TOO_MANY_IMAGES",
      });
    }

    // Validate file types and sizes
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (let file of req.files) {
      if (!validTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "Only JPEG, PNG images are allowed",
          code: "INVALID_FILE_TYPE",
        });
      }
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: "Each image must be less than 5MB",
          code: "FILE_TOO_LARGE",
        });
      }
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
  }

  // Check if user has reached listing limit (e.g., 20 cars per owner)
  const existingCarsCount = await Car.countDocuments({ owner: user.id });
  const maxCarsPerOwner = 20;

  if (existingCarsCount >= maxCarsPerOwner) {
    // Clean up uploaded images if limit exceeded
    if (imageUrls.length > 0) {
      await deleteImagesFromCloud(imageUrls).catch(console.error);
    }

    return res.status(400).json({
      success: false,
      message: `Maximum ${maxCarsPerOwner} cars allowed per owner`,
      code: "LISTING_LIMIT_EXCEEDED",
    });
  }

  // Create car document
  const newCar = new Car({
    title: title.trim(),
    description: description.trim(),
    city: city.trim(),
    pricePerDay: parseFloat(pricePerDay),
    availabilityFrom,
    availabilityTo,
    transmission: transmission || "Automatic",
    fuelType: fuelType || "Petrol",
    year: year ? parseInt(year) : null,
    mileage: mileage ? parseInt(mileage) : null,
    specifications: specifications || "GCC Specs",
    images: imageUrls,
    owner: user.id,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Save to database
  const savedCar = await newCar.save();

  // Populate owner details for response
  await savedCar.populate("owner", "name email phone");

  res.status(201).json({
    success: true,
    message: "Car listed successfully",
    data: {
      car: savedCar,
      totalCars: existingCarsCount + 1,
      remainingSlots: maxCarsPerOwner - (existingCarsCount + 1),
    },
  });
});

// Get all cars with filtering and pagination
export const getCars = handleAsyncError(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    city,
    minPrice,
    maxPrice,
    year,
    transmission,
    fuelType,
    sortBy = "createdAt",
    sortOrder = "desc",
    search,
  } = req.query;

  // Build filter object
  const filter = { status: "active" };

  if (city) filter.city = new RegExp(city, "i");
  if (minPrice)
    filter.pricePerDay = { ...filter.pricePerDay, $gte: parseFloat(minPrice) };
  if (maxPrice)
    filter.pricePerDay = { ...filter.pricePerDay, $lte: parseFloat(maxPrice) };
  if (year) filter.year = parseInt(year);
  if (transmission) filter.transmission = transmission;
  if (fuelType) filter.fuelType = fuelType;

  // Search in title and description
  if (search) {
    filter.$or = [
      { title: new RegExp(search, "i") },
      { description: new RegExp(search, "i") },
    ];
  }

  // Only show available cars (end date not passed)
  filter.availabilityTo = { $gte: new Date() };

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

  // Execute query
  const [cars, totalCount] = await Promise.all([
    Car.find(filter)
      .populate("owner", "name email phone rating")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Car.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / parseInt(limit));

  res.json({
    success: true,
    data: {
      cars,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
        limit: parseInt(limit),
      },
      filters: {
        city,
        minPrice,
        maxPrice,
        year,
        transmission,
        fuelType,
        search,
      },
    },
  });
});

// Get single car by ID
export const getCarById = handleAsyncError(async (req, res) => {
  const { id } = req.params;

  const car = await Car.findById(id)
    .populate("owner", "name email phone rating joinedDate")
    .lean();

  if (!car) {
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

  res.json({
    success: true,
    data: { car },
  });
});

// Update car listing
export const updateCar = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const car = await Car.findById(id);
  if (!car) {
    return res.status(404).json({
      success: false,
      message: "Car not found",
      code: "CAR_NOT_FOUND",
    });
  }

  // Authorization check
  if (car.owner.toString() !== user.id) {
    return res.status(403).json({
      success: false,
      message: "You can only update your own car listings",
      code: "UNAUTHORIZED_UPDATE",
    });
  }

  // Sanitize and validate updates
  const updates = sanitizeCarData(req.body);
  const validationResult = validateCarData(updates, true); // partial validation for updates

  if (!validationResult.isValid) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: validationResult.errors,
      code: "VALIDATION_ERROR",
    });
  }

  // Handle new images if provided
  if (req.files && req.files.length > 0) {
    try {
      // Delete old images
      if (car.images && car.images.length > 0) {
        await deleteImagesFromCloud(car.images).catch(console.error);
      }

      // Upload new images
      updates.images = await uploadImagesToCloud(req.files);
    } catch (uploadError) {
      console.error("Image upload error:", uploadError);
      return res.status(500).json({
        success: false,
        message: "Failed to upload images",
        code: "IMAGE_UPLOAD_FAILED",
      });
    }
  }

  // Update car
  updates.updatedAt = new Date();
  const updatedCar = await Car.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).populate("owner", "name email phone");

  res.json({
    success: true,
    message: "Car updated successfully",
    data: { car: updatedCar },
  });
});

// Delete car listing
export const deleteCar = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const car = await Car.findById(id);
  if (!car) {
    return res.status(404).json({
      success: false,
      message: "Car not found",
      code: "CAR_NOT_FOUND",
    });
  }

  // Authorization check
  if (car.owner.toString() !== user.id) {
    return res.status(403).json({
      success: false,
      message: "You can only delete your own car listings",
      code: "UNAUTHORIZED_DELETE",
    });
  }

  // Delete images from cloud
  if (car.images && car.images.length > 0) {
    await deleteImagesFromCloud(car.images).catch(console.error);
  }

  // Soft delete (mark as inactive) instead of hard delete
  await Car.findByIdAndUpdate(id, {
    status: "deleted",
    deletedAt: new Date(),
  });

  res.json({
    success: true,
    message: "Car listing deleted successfully",
  });
});

// Get cars by owner
export const getCarsByOwner = handleAsyncError(async (req, res) => {
  const { ownerId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [cars, totalCount] = await Promise.all([
    Car.find({ owner: ownerId, status: "active" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Car.countDocuments({ owner: ownerId, status: "active" }),
  ]);

  res.json({
    success: true,
    data: {
      cars,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        limit: parseInt(limit),
      },
    },
  });
});
