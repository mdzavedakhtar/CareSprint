const express = require("express");

const {
  getOverview,
  getPendingDoctors,
  getAllDoctors,
  getDoctorDocuments,
  approveDoctor,
  rejectDoctor,
  requestCorrectionDoctor,
  suspendDoctor,
  reactivateDoctor,
  getPatients,
  updateUserStatus,
  getBookings,
  getActiveVisits,
  getPayments,
  getReviews,
  getComplaints,
  getAnalytics,
  getAuditLogs,
} = require("../controllers/adminController");

const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// All admin routes strictly require authentication + ADMIN role
router.use(protect, authorize("ADMIN"));

// Overview
router.get("/overview", getOverview);

// Doctor verification & management
router.get("/doctors/pending", getPendingDoctors);
router.get("/doctors", getAllDoctors);
router.get("/doctors/:doctorId/documents", getDoctorDocuments);
router.patch("/doctors/:doctorId/approve", approveDoctor);
router.patch("/doctors/:doctorId/reject", rejectDoctor);
router.patch("/doctors/:doctorId/request-correction", requestCorrectionDoctor);
router.patch("/doctors/:doctorId/suspend", suspendDoctor);
router.patch("/doctors/:doctorId/reactivate", reactivateDoctor);

// Patients & Users management
router.get("/patients", getPatients);
router.patch("/users/:userId/status", updateUserStatus);

// Bookings & Active Visits
router.get("/bookings", getBookings);
router.get("/visits/active", getActiveVisits);

// Payments & Financials
router.get("/payments", getPayments);

// Reviews & Complaints
router.get("/reviews", getReviews);
router.get("/complaints", getComplaints);

// Analytics & System Audit Logs
router.get("/analytics", getAnalytics);
router.get("/audit-logs", getAuditLogs);

module.exports = router;