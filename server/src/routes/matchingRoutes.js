const express = require("express");

const {
  createBookingAndMatch,
  getMatchingStatus,
} = require("../controllers/matchingController");

const {
  protect,
  authorize,
} = require("../middleware/auth");

const router =
  express.Router();

// ======================================================
// PATIENT ONLY
// ======================================================

router.use(
  protect,
  authorize("PATIENT")
);

// ======================================================
// CREATE BOOKING + MATCH
// ======================================================

router.post(
  "/bookings",
  createBookingAndMatch
);

// ======================================================
// MATCHING STATUS
// ======================================================

router.get(
  "/bookings/:bookingId/matching",
  getMatchingStatus
);

module.exports = router;