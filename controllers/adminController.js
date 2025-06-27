// controllers/adminController.js - Admin panel functionality
import User from "../models/User.js";
import Car from "../models/Car.js";
import Booking from "../models/Booking.js";
import { handleAsyncError } from "../utils/errorHandler.js";

// ADMIN DASHBOARD STATS
export const getAdminStats = handleAsyncError(async (req, res) => {
  try {
    const [
      totalUsers,
      totalOwners,
      totalRenters,
      approvedUsers,
      pendingUsers,
      totalCars,
      activeCars,
      pendingCars,
      totalBookings,
      activeBookings,
      completedBookings,
      thisMonthBookings,
      totalRevenue,
    ] = await Promise.all([
      User.countDocuments({ deletedAt: null }),
      User.countDocuments({ role: "owner", deletedAt: null }),
      User.countDocuments({ role: "renter", deletedAt: null }),
      User.countDocuments({ isApproved: true, deletedAt: null }),
      User.countDocuments({ isApproved: false, deletedAt: null }),
      Car.countDocuments({ deletedAt: null }),
      Car.countDocuments({ status: "active", deletedAt: null }),
      Car.countDocuments({ status: "pending", deletedAt: null }),
      Booking.countDocuments(),
      Booking.countDocuments({
        status: { $in: ["pending", "approved", "confirmed", "active"] },
      }),
      Booking.countDocuments({ status: "completed" }),
      Booking.countDocuments({
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      }),
      Booking.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$totalPayable" } } },
      ]),
    ]);

    // Calculate 5-star ratio
    const ratingsStats = await Booking.aggregate([
      {
        $match: {
          $or: [
            { "renterReview.rating": { $exists: true } },
            { "ownerReview.rating": { $exists: true } },
          ],
        },
      },
      {
        $project: {
          ratings: {
            $concatArrays: [
              { $ifNull: [["$renterReview.rating"], []] },
              { $ifNull: [["$ownerReview.rating"], []] },
            ],
          },
        },
      },
      { $unwind: "$ratings" },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          fiveStarRatings: {
            $sum: { $cond: [{ $eq: ["$ratings", 5] }, 1, 0] },
          },
        },
      },
    ]);

    const fiveStarRatio =
      ratingsStats.length > 0
        ? (ratingsStats[0].fiveStarRatings / ratingsStats[0].totalRatings) * 100
        : 0;

    const stats = {
      users: {
        total: totalUsers,
        owners: totalOwners,
        renters: totalRenters,
        approved: approvedUsers,
        pending: pendingUsers,
      },
      cars: {
        total: totalCars,
        active: activeCars,
        pending: pendingCars,
      },
      bookings: {
        total: totalBookings,
        active: activeBookings,
        completed: completedBookings,
        thisMonth: thisMonthBookings,
      },
      revenue: {
        total: totalRevenue[0]?.total || 0,
      },
      metrics: {
        fiveStarRatio: Math.round(fiveStarRatio),
      },
    };

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin statistics",
      error: error.message,
    });
  }
});

// GET ALL USERS (ADMIN ONLY)
export const getAllUsers = handleAsyncError(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    role,
    isApproved,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build filter
  const filter = { deletedAt: null };
  if (role) filter.role = role;
  if (isApproved !== undefined) filter.isApproved = isApproved === "true";
  if (search) {
    filter.$or = [
      { name: new RegExp(search, "i") },
      { email: new RegExp(search, "i") },
      { phone: new RegExp(search, "i") },
    ];
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

  const [users, totalCount] = await Promise.all([
    User.find(filter)
      .select("-password")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    User.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / parseInt(limit));

  res.json({
    success: true,
    data: {
      users,
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

// APPROVE/REJECT USER
export const updateUserApproval = handleAsyncError(async (req, res) => {
  const { userId } = req.params;
  const { isApproved, reason } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  user.isApproved = isApproved;
  if (!isApproved && reason) {
    user.rejectionReason = reason;
  }

  await user.save();

  res.json({
    success: true,
    message: `User ${isApproved ? "approved" : "rejected"} successfully`,
    data: { user: user },
  });
});

// GET ALL CARS (ADMIN)
export const getAllCars = handleAsyncError(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    city,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build filter
  const filter = { deletedAt: null };
  if (status) filter.status = status;
  if (city) filter.city = city;
  if (search) {
    filter.$or = [
      { title: new RegExp(search, "i") },
      { make: new RegExp(search, "i") },
      { model: new RegExp(search, "i") },
    ];
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

  const [cars, totalCount] = await Promise.all([
    Car.find(filter)
      .populate("owner", "name email phone")
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
    },
  });
});

// APPROVE/REJECT CAR
export const updateCarApproval = handleAsyncError(async (req, res) => {
  const { carId } = req.params;
  const { status, reason, adminNotes } = req.body;

  const car = await Car.findById(carId);
  if (!car) {
    return res.status(404).json({
      success: false,
      message: "Car not found",
    });
  }

  car.status = status;
  if (reason) car.rejectionReason = reason;
  if (adminNotes) car.adminNotes = adminNotes;

  await car.save();

  res.json({
    success: true,
    message: `Car ${status} successfully`,
    data: { car },
  });
});

// GET ALL BOOKINGS (ADMIN)
export const getAllBookings = handleAsyncError(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    paymentStatus,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build filter
  const filter = {};
  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

  const [bookings, totalCount] = await Promise.all([
    Booking.find(filter)
      .populate("renter", "name email phone")
      .populate("car", "title make model year city")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Booking.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / parseInt(limit));

  res.json({
    success: true,
    data: {
      bookings,
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

// DELETE USER (ADMIN)
export const deleteUser = handleAsyncError(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Soft delete
  user.deletedAt = new Date();
  user.email = `deleted_${user._id}@deleted.com`;
  user.phone = `deleted_${user._id}`;
  await user.save();

  res.json({
    success: true,
    message: "User deleted successfully",
  });
});

// DELETE CAR (ADMIN)
export const deleteCar = handleAsyncError(async (req, res) => {
  const { carId } = req.params;

  const car = await Car.findById(carId);
  if (!car) {
    return res.status(404).json({
      success: false,
      message: "Car not found",
    });
  }

  // Check for active bookings
  const activeBookings = await Booking.find({
    car: carId,
    status: { $in: ["pending", "approved", "confirmed", "active"] },
  });

  if (activeBookings.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Cannot delete car with active bookings",
    });
  }

  // Soft delete
  car.deletedAt = new Date();
  car.status = "deleted";
  await car.save();

  res.json({
    success: true,
    message: "Car deleted successfully",
  });
});

// VERIFY DRIVING LICENSE MANUALLY
export const verifyDrivingLicense = handleAsyncError(async (req, res) => {
  const { userId } = req.params;
  const { verified, notes } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Add verification status (you might want to add this field to User model)
  user.licenseVerified = verified;
  if (notes) user.licenseVerificationNotes = notes;

  await user.save();

  res.json({
    success: true,
    message: `Driving license ${verified ? "verified" : "rejected"}`,
    data: { user },
  });
});