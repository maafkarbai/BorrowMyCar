// index.js (Updated)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB, checkDBHealth } from "./config/db.js";
import { globalErrorHandler } from "./utils/errorHandler.js";
import { generalLimiter } from "./utils/validators.js";
import { checkCloudinaryHealth } from "./utils/cloudinary.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import carRoutes from "./routes/carRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";

dotenv.config();

const app = express();

// Connect to database
connectDB();

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200,
};

// Global middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Security middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Apply rate limiting to all routes
app.use(generalLimiter);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/cars", carRoutes);
app.use("/api/bookings", bookingRoutes);

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    const [dbHealth, cloudinaryHealth] = await Promise.all([
      checkDBHealth(),
      checkCloudinaryHealth(),
    ]);

    res.json({
      success: true,
      message: "BorrowMyCar API is running",
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth,
        cloudinary: cloudinaryHealth,
        server: {
          status: "running",
          environment: process.env.NODE_ENV || "development",
          version: process.env.npm_package_version || "1.0.0",
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Health check failed",
      error: error.message,
    });
  }
});

// API info endpoint
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to BorrowMyCar API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      cars: "/api/cars",
      bookings: "/api/bookings",
      health: "/api/health",
    },
    documentation: "https://api.borrowmycar.com/docs", // Update with actual docs URL
  });
});

// Handle undefined routes
app.all("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    code: "ROUTE_NOT_FOUND",
  });
});

// Global error handler (must be last middleware)
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📝 API Documentation: http://localhost:${PORT}/api`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
});

// Handle server shutdown gracefully
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received");
  console.log("🔧 Shutting down gracefully");
  server.close(() => {
    console.log("💥 Process terminated");
  });
});

process.on("unhandledRejection", (err) => {
  console.error("💥 UNHANDLED PROMISE REJECTION! Shutting down...");
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

export default app;
