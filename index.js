// index.js - Fixed main server file
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { connectDB, checkDBHealth } from "./config/db.js";
import { globalErrorHandler } from "./utils/errorHandler.js";
import { generalLimiter } from "./utils/validators.js";
import { checkCloudinaryHealth } from "./utils/cloudinary.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import carRoutes from "./routes/carRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

const app = express();

// Connect to database
try {
  await connectDB();
  console.log("✅ Database connected");
} catch (err) {
  console.error("❌ Database connection failed:", err.message);
  console.log("⚠️ Continuing without database - some features may not work");
}

// Enhanced CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:5173", // Vite default
    "http://127.0.0.1:5173",
    process.env.FRONTEND_URL,
    "https://your-production-domain.com", // Add your production domain
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Origin",
    "X-Requested-With",
    "Accept",
    "stripe-signature", // For Stripe webhooks
  ],
};

// Middlewares
app.use(cors(corsOptions));

// Stripe webhook needs raw body
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

// Regular JSON parsing for other routes
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Rate limiting
app.use(generalLimiter);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/cars", carRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);

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
          version: "1.0.0",
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
      payments: "/api/payments",
      health: "/api/health",
    },
    documentation: "https://api.borrowmycar.ae/docs",
  });
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    code: "ROUTE_NOT_FOUND",
  });
});

// Global error handler
app.use(globalErrorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📝 API Info: http://localhost:${PORT}/api`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received. Shutting down...");
  server.close(() => {
    console.log("💥 Server closed.");
  });
});

process.on("unhandledRejection", (err) => {
  console.error("💥 UNHANDLED PROMISE REJECTION!");
  console.error(err);
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION!");
  console.error(err);
  process.exit(1);
});

export default app;
