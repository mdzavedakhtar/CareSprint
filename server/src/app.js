const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");

require("./models");

const app = express();

// ==========================================
// Security
// ==========================================

app.use(helmet());

// ==========================================
// CORS
// ==========================================

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// ==========================================
// Body Parser
// ==========================================

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

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

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

module.exports = app;