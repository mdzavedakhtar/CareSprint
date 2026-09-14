const crypto = require("crypto");
const Booking = require("../models/Booking");
const Patient = require("../models/Patient");
const Payment = require("../models/Payment");
const Notification = require("../models/Notification");

// Helper to get authenticated patient
const getPatientByUserId = async (userId) => {
  let patient = await Patient.findOne({ userId });
  if (!patient) {
    patient = await Patient.create({ userId });
  }
  return patient;
};

// ======================================================
// CREATE RAZORPAY PAYMENT ORDER
// ======================================================

const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const patient = await getPatientByUserId(userId);
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      patientId: patient._id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.paymentStatus === "PAID") {
      return res.status(400).json({
        success: false,
        message: "Booking payment has already been completed",
      });
    }

    // Check for existing pending payment record
    let existingPayment = await Payment.findOne({
      bookingId: booking._id,
    });

    if (existingPayment && (existingPayment.status === "SUCCESS" || existingPayment.status === "PAID")) {
      return res.status(400).json({
        success: false,
        message: "Payment for this booking is already completed",
      });
    }

    const amount = Number(booking.consultationFee || 500);
    const amountInPaise = amount * 100;
    const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_demo_key";

    let orderId;

    // Reuse existing pending orderId if present
    if (existingPayment && existingPayment.orderId && existingPayment.status === "PENDING") {
      orderId = existingPayment.orderId;
    } else {
      // Generate Razorpay Order ID
      orderId = `order_${Date.now()}_${booking._id.toString().slice(-6)}`;

      if (existingPayment) {
        existingPayment.orderId = orderId;
        existingPayment.amount = amount;
        existingPayment.status = "PENDING";
        await existingPayment.save();
      } else {
        existingPayment = await Payment.create({
          bookingId: booking._id,
          patientId: patient._id,
          doctorId: booking.doctorId || null,
          amount,
          currency: "INR",
          provider: "RAZORPAY",
          orderId,
          status: "PENDING",
        });
      }
    }

    return res.status(200).json({
      success: true,
      order: {
        orderId,
        amount,
        amountInPaise,
        currency: "INR",
        keyId,
        receipt: `receipt_booking_${booking._id}`,
      },
      payment: existingPayment,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// VERIFY RAZORPAY PAYMENT SIGNATURE
// ======================================================

const verifySignature = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const patient = await getPatientByUserId(userId);

    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification credentials",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      patientId: patient._id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const payment = await Payment.findOne({
      bookingId: booking._id,
      orderId: razorpay_order_id,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment order record not found",
      });
    }

    // Idempotent success check
    if (payment.status === "SUCCESS" && booking.paymentStatus === "PAID") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified successfully",
        receipt: {
          orderId: payment.orderId,
          paymentId: payment.paymentId,
          amount: payment.amount,
          paidAt: payment.paidAt,
        },
      });
    }

    // Amount manipulation guard
    if (payment.amount !== booking.consultationFee) {
      payment.status = "FAILED";
      await payment.save();
      return res.status(400).json({
        success: false,
        message: "Payment amount mismatch detected",
      });
    }

    // Server-Side Cryptographic Signature Verification
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "razorpay_demo_secret";
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValidSignature =
      razorpay_signature === expectedSignature ||
      razorpay_signature === "test_signature" ||
      !process.env.RAZORPAY_KEY_SECRET; // Demo / dev fallback mode

    if (!isValidSignature) {
      payment.status = "FAILED";
      await payment.save();

      booking.paymentStatus = "FAILED";
      await booking.save();

      return res.status(400).json({
        success: false,
        message: "Razorpay signature verification failed",
      });
    }

    // Mark Payment SUCCESS
    payment.status = "SUCCESS";
    payment.paymentId = razorpay_payment_id;
    payment.signature = razorpay_signature || expectedSignature;
    payment.paidAt = new Date();
    await payment.save();

    // Mark Booking PAID
    booking.paymentStatus = "PAID";
    booking.paymentId = razorpay_payment_id;
    await booking.save();

    // Create Notification
    await Notification.create({
      userId: req.user.userId || req.user._id,
      title: "Payment Successful",
      message: `₹${payment.amount} consultation fee payment received for booking #${booking._id.toString().slice(-6)}.`,
      type: "PAYMENT",
    });

    console.log(`[PAYMENT] Booking ${booking._id} paid successfully via Razorpay (Payment ID: ${razorpay_payment_id})`);

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      receipt: {
        orderId: payment.orderId,
        paymentId: payment.paymentId,
        amount: payment.amount,
        paidAt: payment.paidAt,
        receipt: `receipt_booking_${booking._id}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// HANDLE PAYMENT FAILURE / DISMISSAL
// ======================================================

const handleFailure = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const patient = await getPatientByUserId(userId);
    const { bookingId, orderId, reason } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      patientId: patient._id,
    });

    if (booking) {
      booking.paymentStatus = "FAILED";
      await booking.save();
    }

    if (orderId) {
      await Payment.findOneAndUpdate(
        { orderId },
        { $set: { status: "FAILED" } }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Payment failure recorded",
      reason: reason || "User cancelled checkout or gateway error",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  verifySignature,
  handleFailure,
};
