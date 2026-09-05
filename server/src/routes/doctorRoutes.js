const express = require("express");

const {
  getDashboard,
  getProfile,
  updateAvailability,
  getRequests,
  respondToRequest,
  updateVisitStatus,
  createPrescription,
  getEarnings,
  getHistory,
} = require("../controllers/doctorController");

const {
  protect,
  authorize,
} = require("../middleware/auth");

const router = express.Router();

router.use(
  protect,
  authorize("DOCTOR")
);

router.get(
  "/dashboard",
  getDashboard
);

router.get(
  "/profile",
  getProfile
);

router.patch(
  "/availability",
  updateAvailability
);

router.get(
  "/requests",
  getRequests
);

router.patch(
  "/requests/:bookingId",
  respondToRequest
);

router.patch(
  "/visits/:bookingId/status",
  updateVisitStatus
);

router.post(
  "/visits/:bookingId/prescription",
  createPrescription
);

router.get(
  "/earnings",
  getEarnings
);

router.get(
  "/history",
  getHistory
);

module.exports = router;