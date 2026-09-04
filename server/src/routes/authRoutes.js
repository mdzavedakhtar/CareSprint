const express = require("express");

const {
  registerPatient,
  verifyPatientOTP,
  login,
  getMe,
  logout,
} = require("../controllers/authController");

const { registerDoctor } = require("../controllers/doctorAuthController");

const { protect } = require("../middleware/auth");

const router = express.Router();

// Patient
router.post("/patient/register", registerPatient);
router.post("/patient/verify-otp", verifyPatientOTP);

// Doctor
router.post("/doctor/register", registerDoctor);

// Common authentication
router.post("/login", login);
router.post("/logout", logout);

// Protected
router.get("/me", protect, getMe);

module.exports = router;