const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const patientRoutes = require("./routes/patientRoutes");
const matchingRoutes = require("./routes/matchingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const { sanitizeNoSQL } = require("./middleware/sanitize");

require("./models");

const app = express();

// ==========================================
// Security & Headers
// ==========================================

app.use(helmet());

// Strict CORS Configuration
const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

// ==========================================
// Body Parser & NoSQL Injection Protection
// ==========================================

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeNoSQL);

// ==========================================
// Cookies
// ==========================================

app.use(cookieParser());

// ==========================================
// Rate Limiting
// ==========================================

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", limiter);

app.use("/api/v1/auth", authRoutes);

app.use(
  "/api/v1/patient",
  patientRoutes
);

app.use(
  "/api/v1/doctor",
  doctorRoutes
);

app.use(
  "/api/v1/matching",
  matchingRoutes
);

app.use(
  "/api/v1/payment",
  paymentRoutes
);

app.use(
  "/api/v1/notifications",
  notificationRoutes
);

// ==========================================
// Basic API Health Check
// ==========================================

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CareSprint API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1/admin", adminRoutes);

// ==========================================
// MongoDB Database Health Check
// ==========================================

app.get("/api/v1/db-health", (req, res) => {
  const state = mongoose.connection.readyState;

  if (state === 1) {
    return res.status(200).json({
      success: true,
      database: "MongoDB",
      status: "connected",
      databaseName: mongoose.connection.name,
      host: mongoose.connection.host,
    });
  }

  return res.status(503).json({
    success: false,
    database: "MongoDB",
    status: "disconnected",
  });
});

// ==========================================
// 404 Handler
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ==========================================
// Global Error Handler
// ==========================================

app.use((err, req, res, _next) => {
  console.error("[ServerError]:", err.message || err);

  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === "production";

  res.status(statusCode).json({
    success: false,
    message: isProduction && statusCode === 500 ? "Internal server error" : (err.message || "Internal server error"),
    ...(isProduction ? {} : { stack: err.stack }),
  });
});

module.exports = app;