const express = require("express");

const {
  getDashboard,

  getProfile,
  updateProfile,

  getVerificationDocuments,
  addVerificationDocument,

  updateAvailability,

  getRequests,
  acceptRequest,
  rejectRequest,

  getVisitDetails,

  startVisit,
  markArrived,
  startConsultation,
  completeConsultation,

  createPrescription,

  getEarnings,
  getHistory,
  updateLocation,
} = require("../controllers/doctorController");

const {
  protect,
  authorize,
  requireDoctorApproval,
} = require("../middleware/auth");

const router = express.Router();

// ======================================================
// DOCTOR AUTHENTICATION
// ======================================================

router.use(
  protect,
  authorize("DOCTOR")
);

// Profile and Verification Documents are accessible to pending doctors
router.get(
  "/profile",
  getProfile
);

router.patch(
  "/profile",
  updateProfile
);

router.get(
  "/verification-documents",
  getVerificationDocuments
);

router.post(
  "/verification-documents",
  addVerificationDocument
);

// Operational routes require approved doctor status
router.use(requireDoctorApproval);

// ======================================================
// DASHBOARD
// ======================================================

router.get(
  "/dashboard",
  getDashboard
);

// ======================================================
// AVAILABILITY & LOCATION
// ======================================================

router.patch(
  "/availability",
  updateAvailability
);

router.patch(
  "/location",
  updateLocation
);

// ======================================================
// INCOMING REQUESTS
// ======================================================

router.get(
  "/requests",
  getRequests
);

// Accept request
router.patch(
  "/requests/:bookingId/accept",
  acceptRequest
);

// Reject request
router.patch(
  "/requests/:bookingId/reject",
  rejectRequest
);

// ======================================================
// VISIT
// ======================================================

// Get visit details
router.get(
  "/visits/:bookingId",
  getVisitDetails
);

// Start visit
router.patch(
  "/visits/:bookingId/start",
  startVisit
);

// Mark doctor arrived
router.patch(
  "/visits/:bookingId/arrived",
  markArrived
);

// Start consultation
router.patch(
  "/visits/:bookingId/consultation",
  startConsultation
);

// Complete consultation
router.patch(
  "/visits/:bookingId/complete",
  completeConsultation
);

// ======================================================
// PRESCRIPTION
// ======================================================

router.post(
  "/visits/:bookingId/prescription",
  createPrescription
);

// ======================================================
// EARNINGS
// ======================================================

router.get(
  "/earnings",
  getEarnings
);

// ======================================================
// VISIT HISTORY
// ======================================================

router.get(
  "/history",
  getHistory
);

module.exports = router;