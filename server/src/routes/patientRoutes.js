const express = require("express");

const {
  getDashboard,
  getProfile,
  updateProfile,
  updateLocation,
  getDoctors,
  getDoctorDetails,
  getBookings,
  getBookingDetails,
  createBooking,
  cancelBooking,
  getLiveTracking,
  getPrescriptions,
  getReviews,
  getDoctorReviews,
  createReview,
  getNotifications,
} = require("../controllers/patientController");

const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Require PATIENT role authorization for all routes
router.use(protect, authorize("PATIENT"));

// Dashboard
router.get("/dashboard", getDashboard);

// Profile & Location
router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
router.patch("/location", updateLocation);

// Doctor Discovery
router.get("/doctors", getDoctors);
router.get("/doctors/:doctorId", getDoctorDetails);
router.get("/doctors/:doctorId/reviews", getDoctorReviews);

// Bookings / Visits / Tracking
router.get("/bookings", getBookings);
router.post("/bookings", createBooking);
router.get("/bookings/:bookingId", getBookingDetails);
router.get("/bookings/:bookingId/tracking", getLiveTracking);
router.patch("/bookings/:bookingId/cancel", cancelBooking);

// Prescriptions
router.get("/prescriptions", getPrescriptions);

// Reviews
router.get("/reviews", getReviews);
router.post("/reviews", createReview);

// Notifications
router.get("/notifications", getNotifications);

module.exports = router;
