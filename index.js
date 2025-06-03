import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan"; // ✅ Add this
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import carRoutes from "./routes/carRoutes.js";

dotenv.config();
connectDB();

const app = express();

// ✅ Use middleware
app.use(cors());
app.use(express.json());

// ✅ Logging middleware for all requests
app.use(morgan("dev")); // Use 'dev' for concise logs like: GET /api/cars 200 32ms

// ✅ Log incoming requests in detail (optional)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/cars", carRoutes);

// ✅ Start server with startup message
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(
    `✅ Server running on http://localhost:${PORT} [ENV: ${
      process.env.NODE_ENV || "development"
    }]`
  )
);
