import { Car } from "../models/Car.js";
import { Booking } from "../models/Booking.js";
import {
  uploadImagesToCloud,
  deleteImagesFromCloud,
} from "../utils/cloudUploader.js";
import { handleAsyncError } from "../utils/errorHandler.js";
// Enhanced car data sanitizer
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

  // Numeric fields
  if (data.price) sanitized.price = parseFloat(data.price);
  if (data.year) sanitized.year = parseInt(data.year);
  if (data.mileage) sanitized.mileage = parseInt(data.mileage);
  if (data.seatingCapacity)
    sanitized.seatingCapacity = parseInt(data.seatingCapacity);
  if (data.securityDeposit)
    sanitized.securityDeposit = parseFloat(data.securityDeposit);
  if (data.deliveryFee) sanitized.deliveryFee = parseFloat(data.deliveryFee);
  if (data.minimumRentalDays)
    sanitized.minimumRentalDays = parseInt(data.minimumRentalDays);
  if (data.maximumRentalDays)
    sanitized.maximumRentalDays = parseInt(data.maximumRentalDays);

  // Enum fields
  if (data.transmission)
    sanitized.transmission = data.transmission.toString().trim();
  if (data.fuelType) sanitized.fuelType = data.fuelType.toString().trim();
  if (data.specifications)
    sanitized.specifications = data.specifications.toString().trim();

  // Boolean fields
  if (data.isInstantApproval !== undefined)
    sanitized.isInstantApproval = Boolean(data.isInstantApproval);
  if (data.deliveryAvailable !== undefined)
    sanitized.deliveryAvailable = Boolean(data.deliveryAvailable);
  if (data.insuranceIncluded !== undefined)
    sanitized.insuranceIncluded = Boolean(data.insuranceIncluded);

  // Array fields
  if (data.features) {
    sanitized.features = Array.isArray(data.features)
      ? data.features.map((f) => f.toString().trim())
      : [data.features.toString().trim()];
  }

  if (data.pickupLocations) {
    sanitized.pickupLocations = Array.isArray(data.pickupLocations)
      ? data.pickupLocations.map((loc) => loc.toString().trim())
      : [data.pickupLocations.toString().trim()];
  }

  // Date fields
  if (data.availabilityFrom) sanitized.availabilityFrom = data.availabilityFrom;
  if (data.availabilityTo) sanitized.availabilityTo = data.availabilityTo;

  return sanitized;
};

// Enhanced car validation
const validateCarData = (data, isPartial = false) => {
  const errors = [];

  if (!isPartial) {
    // Required fields for new car
    if (!data.title || data.title.length < 3) {
      errors.push("Title must be at least 3 characters long");
    }
    if (!data.description || data.description.length < 10) {
      errors.push("Description must be at least 10 characters long");
    }
    if (!data.city) {
      errors.push("City is required");
    }
    if (!data.make || data.make.length < 2) {
      errors.push("Car make is required");
    }
    if (!data.model || data.model.length < 1) {
      errors.push("Car model is required");
    }
    if (!data.color) {
      errors.push("Car color is required");
    }
    if (!data.plateNumber) {
      errors.push("Plate number is required");
    }
    if (!data.price || data.price <= 0) {
      errors.push("Price per day must be greater than 0");
    }
    if (!data.year || data.year < 2010) {
      errors.push("Car year must be 2010 or newer");
    }
    if (!data.mileage || data.mileage < 0) {
      errors.push("Mileage must be 0 or greater");
    }
    if (
      !data.seatingCapacity ||
      data.seatingCapacity < 2 ||
      data.seatingCapacity > 8
    ) {
      errors.push("Seating capacity must be between 2 and 8");
    }
    if (!data.availabilityFrom) {
      errors.push("Availability start date is required");
    }
    if (!data.availabilityTo) {
      errors.push("Availability end date is required");
    }
  }

  // Validate price range
  if (data.price && (data.price < 50 || data.price > 5000)) {
    errors.push("Price must be between AED 50 and AED 5000 per day");
  }

  // Validate plate number format
  if (data.plateNumber && !/^[A-Z]{1,3}[0-9]{1,5}$/.test(data.plateNumber)) {
    errors.push("Invalid UAE plate number format");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ENHANCED CREATE CAR
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
  const from = new Date(carData.availabilityFrom);
  const to = new Date(carData.availabilityTo);
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

  // Check for duplicate plate number
  const existingCar = await Car.findOne({
    plateNumber: carData.plateNumber,
    status: { $ne: "deleted" },
  });

  if (existingCar) {
    return res.status(400).json({
      success: false,
      message: "A car with this plate number is already listed",
      code: "DUPLICATE_PLATE_NUMBER",
    });
  }

  // Image validation and upload (minimum 3 images required)
  let imageUrls = [];
  if (req.files && req.files.length > 0) {
    if (req.files.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Minimum 3 images required",
        code: "INSUFFICIENT_IMAGES",
      });
    }

    if (req.files.length > 10) {
      return res.status(400).json({
        success: false,
        message: "Maximum 10 images allowed",
        code: "TOO_MANY_IMAGES",
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

  // Check listing limit
  const existingCarsCount = await Car.countDocuments({
    owner: user.id,
    status: { $ne: "deleted" },
  });
  const maxCarsPerOwner = 20;

  if (existingCarsCount >= maxCarsPerOwner) {
    await deleteImagesFromCloud(imageUrls).catch(console.error);
    return res.status(400).json({
      success: false,
      message: `Maximum ${maxCarsPerOwner} cars allowed per owner`,
      code: "LISTING_LIMIT_EXCEEDED",
    });
  }

  // Create car document
  const newCar = new Car({
    ...carData,
    images: imageUrls,
    owner: user.id,
    status: "pending", // Requires admin approval
  });

  const savedCar = await newCar.save();
  await savedCar.populate("owner", "name email phone");

  res.status(201).json({
    success: true,
    message: "Car listed successfully. Awaiting admin approval.",
    data: {
      car: savedCar,
      totalCars: existingCarsCount + 1,
      remainingSlots: maxCarsPerOwner - (existingCarsCount + 1),
    },
  });
});

// ENHANCED GET CARS with improved filtering
export const getCars = handleAsyncError(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    city,
    minPrice,
    maxPrice,
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

  // Build filter object
  const filter = { status: "active" };

  // City filter
  if (city) filter.city = city;

  // Price range filter
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }

  // Car specifications
  if (make) filter.make = new RegExp(make, "i");
  if (year) filter.year = parseInt(year);
  if (transmission) filter.transmission = transmission;
  if (fuelType) filter.fuelType = fuelType;
  if (seatingCapacity) filter.seatingCapacity = parseInt(seatingCapacity);

  // Features filter
  if (features) {
    const featureArray = Array.isArray(features) ? features : [features];
    filter.features = { $in: featureArray };
  }

  // Delivery filter
  if (deliveryAvailable === "true") filter.deliveryAvailable = true;

  // Search in title, description, make, and model
  if (search) {
    filter.$or = [
      { title: new RegExp(search, "i") },
      { description: new RegExp(search, "i") },
      { make: new RegExp(search, "i") },
      { model: new RegExp(search, "i") },
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
      .populate("owner", "name email phone averageRating")
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
      appliedFilters: {
        city,
        minPrice,
        maxPrice,
        make,
        year,
        transmission,
        fuelType,
        seatingCapacity,
        features,
        deliveryAvailable,
        search,
      },
    },
  });
});

// Get single car by ID (unchanged but enhanced)
export const getCarById = handleAsyncError(async (req, res) => {
  const { id } = req.params;

  const car = await Car.findById(id)
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

  res.json({
    success: true,
    data: { car },
  });
});

// Enhanced update car
export const updateCar = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const car = await Car.findById(id);
  if (!car || car.status === "deleted") {
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
  const validationResult = validateCarData(updates, true);

  if (!validationResult.isValid) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: validationResult.errors,
      code: "VALIDATION_ERROR",
    });
  }

  // Check for duplicate plate number if plate number is being updated
  if (updates.plateNumber && updates.plateNumber !== car.plateNumber) {
    const existingCar = await Car.findOne({
      plateNumber: updates.plateNumber,
      _id: { $ne: id },
      status: { $ne: "deleted" },
    });

    if (existingCar) {
      return res.status(400).json({
        success: false,
        message: "A car with this plate number is already listed",
        code: "DUPLICATE_PLATE_NUMBER",
      });
    }
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

  // If critical details changed, require admin re-approval
  const criticalFields = ["plateNumber", "make", "model", "year"];
  const requiresReapproval = criticalFields.some(
    (field) => updates[field] && updates[field] !== car[field]
  );

  if (requiresReapproval) {
    updates.status = "pending";
  }

  // Update car
  const updatedCar = await Car.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).populate("owner", "name email phone");

  res.json({
    success: true,
    message: requiresReapproval
      ? "Car updated successfully. Pending admin re-approval due to critical changes."
      : "Car updated successfully",
    data: { car: updatedCar },
  });
});

// Delete car (soft delete)
export const deleteCar = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const car = await Car.findById(id);
  if (!car || car.status === "deleted") {
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

  // Check for active bookings
  const activeBookings = await Booking.countDocuments({
    car: id,
    status: { $in: ["pending", "approved", "confirmed", "active"] },
  });

  if (activeBookings > 0) {
    return res.status(400).json({
      success: false,
      message: "Cannot delete car with active bookings",
      code: "ACTIVE_BOOKINGS_EXIST",
    });
  }

  // Soft delete
  await Car.findByIdAndUpdate(id, {
    status: "deleted",
    deletedAt: new Date(),
  });

  res.json({
    success: true,
    message: "Car listing deleted successfully",
  });
});

// Get cars by owner (enhanced)
export const getCarsByOwner = handleAsyncError(async (req, res) => {
  const { ownerId } = req.params;
  const { page = 1, limit = 10, status = "active" } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = { owner: ownerId };
  if (status !== "all") {
    filter.status = status;
  }

  const [cars, totalCount] = await Promise.all([
    Car.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Car.countDocuments(filter),
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
