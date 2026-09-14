const express = require("express");
const {
  createOrder,
  verifySignature,
  handleFailure,
} = require("../controllers/paymentController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// All payment endpoints require PATIENT role authorization
router.use(protect, authorize("PATIENT"));

router.post("/create-order", createOrder);
router.post("/verify-signature", verifySignature);
router.post("/handle-failure", handleFailure);

module.exports = router;
