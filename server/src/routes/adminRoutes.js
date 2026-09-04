const express = require("express");

const {
  getPendingDoctors,
  approveDoctor,
  rejectDoctor,
} = require("../controllers/adminController");

const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// All admin routes require authentication + ADMIN role
router.use(protect, authorize("ADMIN"));

// Pending doctors
router.get("/doctors/pending", getPendingDoctors);

// Approve doctor
router.patch("/doctors/:doctorId/approve", approveDoctor);

// Reject doctor
router.patch("/doctors/:doctorId/reject", rejectDoctor);

module.exports = router;