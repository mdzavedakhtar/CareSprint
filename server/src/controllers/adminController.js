const Doctor = require("../models/Doctor");
const User = require("../models/User");
const Patient = require("../models/Patient");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Review = require("../models/Review");
const AuditLog = require("../models/AuditLog");

// Helper to log admin actions
const logAdminAction = async (req, action, resource, resourceId, metadata = {}) => {
  try {
    await AuditLog.create({
      userId: req.user?.userId || req.user?.id || req.user?._id,
      actor: req.user?.userId || req.user?.id || req.user?._id,
      role: "ADMIN",
      action,
      resource,
      resourceId,
      metadata,
      ipAddress: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
      userAgent: req.headers["user-agent"] || "CareSprint Admin Client",
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
};

// ======================================================
// OVERVIEW & DASHBOARD
// ======================================================

const getOverview = async (req, res, next) => {
  try {
    const totalDoctors = await Doctor.countDocuments();
    const pendingDoctors = await Doctor.countDocuments({ verificationStatus: "PENDING" });
    const approvedDoctors = await Doctor.countDocuments({ verificationStatus: "APPROVED" });
    const totalPatients = await Patient.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const activeVisits = await Booking.countDocuments({
      status: { $in: ["ACCEPTED", "DOCTOR_ON_THE_WAY", "ARRIVED", "CONSULTATION"] },
    });
    const completedBookings = await Booking.find({ status: "COMPLETED", paymentStatus: "PAID" }).select("consultationFee");
    const totalRevenue = completedBookings.reduce((sum, b) => sum + Number(b.consultationFee || 0), 0);
    const complaints = await Booking.countDocuments({ status: "REJECTED" });

    return res.status(200).json({
      success: true,
      overview: {
        totalDoctors,
        pendingDoctors,
        approvedDoctors,
        totalPatients,
        totalBookings,
        activeVisits,
        totalRevenue,
        complaints,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// DOCTOR VERIFICATION & MANAGEMENT
// ======================================================

const getPendingDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find({ verificationStatus: "PENDING" })
      .populate("userId", "-password -otp -otpExpires")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: doctors.length,
      doctors,
    });
  } catch (error) {
    next(error);
  }
};

const getAllDoctors = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) {
      filter.verificationStatus = req.query.status;
    }

    const total = await Doctor.countDocuments(filter);
    const doctors = await Doctor.find(filter)
      .populate("userId", "-password -otp -otpExpires")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      doctors,
    });
  } catch (error) {
    next(error);
  }
};

const getDoctorDocuments = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const doctor = await Doctor.findById(doctorId).populate("userId", "-password -otp -otpExpires");

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    return res.status(200).json({
      success: true,
      verificationStatus: doctor.verificationStatus,
      documents: doctor.verificationDocuments || [],
      doctor,
    });
  } catch (error) {
    next(error);
  }
};

const approveDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    if (doctor.verificationStatus === "APPROVED") {
      return res.status(400).json({ success: false, message: "Doctor is already approved" });
    }

    doctor.verificationStatus = "APPROVED";
    doctor.availabilityStatus = "OFFLINE"; // Must NOT automatically force availability to AVAILABLE
    doctor.verificationNotes = null;
    doctor.verifiedAt = new Date();
    doctor.verifiedBy = req.user.userId;
    await doctor.save();

    await User.findByIdAndUpdate(doctor.userId, { isActive: true, isVerified: true });

    await logAdminAction(req, "DOCTOR_APPROVED", "Doctor", doctor._id, { doctorId: doctor._id });

    return res.status(200).json({
      success: true,
      message: "Doctor approved successfully",
      doctor,
    });
  } catch (error) {
    next(error);
  }
};

const requestCorrectionDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({ success: false, message: "Correction request reason is required" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    doctor.verificationStatus = "CORRECTION_REQUESTED";
    doctor.verificationNotes = reason.trim();
    await doctor.save();

    await logAdminAction(req, "DOCTOR_CORRECTION_REQUESTED", "Doctor", doctor._id, { reason });

    return res.status(200).json({
      success: true,
      message: "Correction requested from doctor",
      doctor,
    });
  } catch (error) {
    next(error);
  }
};

const rejectDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({ success: false, message: "Rejection reason is required" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    doctor.verificationStatus = "REJECTED";
    doctor.verificationNotes = reason.trim();
    doctor.verifiedAt = new Date();
    doctor.verifiedBy = req.user.userId;
    await doctor.save();

    await User.findByIdAndUpdate(doctor.userId, { isActive: false });

    await logAdminAction(req, "DOCTOR_REJECTED", "Doctor", doctor._id, { reason });

    return res.status(200).json({
      success: true,
      message: "Doctor rejected successfully",
      doctor,
    });
  } catch (error) {
    next(error);
  }
};

const suspendDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    doctor.verificationStatus = "SUSPENDED";
    doctor.availabilityStatus = "OFFLINE";
    await doctor.save();

    await User.findByIdAndUpdate(doctor.userId, { isActive: false });

    await logAdminAction(req, "DOCTOR_SUSPENDED", "Doctor", doctor._id, { doctorId: doctor._id });

    return res.status(200).json({
      success: true,
      message: "Doctor suspended successfully",
      doctor,
    });
  } catch (error) {
    next(error);
  }
};

const reactivateDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    doctor.verificationStatus = "APPROVED";
    await doctor.save();

    await User.findByIdAndUpdate(doctor.userId, { isActive: true, isVerified: true });

    await logAdminAction(req, "DOCTOR_REACTIVATED", "Doctor", doctor._id, { doctorId: doctor._id });

    return res.status(200).json({
      success: true,
      message: "Doctor reactivated successfully",
      doctor,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// PATIENTS & USERS MANAGEMENT
// ======================================================

const getPatients = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const total = await Patient.countDocuments();
    const patients = await Patient.find()
      .populate("userId", "-password -otp -otpExpires")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      patients,
    });
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(userId).select("-password -otp -otpExpires");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.isActive = Boolean(isActive);
    await user.save();

    await logAdminAction(req, isActive ? "USER_ACTIVATED" : "USER_SUSPENDED", "User", user._id, { userId: user._id });

    return res.status(200).json({
      success: true,
      message: `User ${isActive ? "activated" : "suspended"} successfully`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// BOOKINGS & ACTIVE VISITS
// ======================================================

const getBookings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .populate({ path: "patientId", populate: { path: "userId", select: "-password" } })
      .populate({ path: "doctorId", populate: { path: "userId", select: "-password" } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

const getActiveVisits = async (req, res, next) => {
  try {
    const activeVisits = await Booking.find({
      status: { $in: ["ACCEPTED", "DOCTOR_ON_THE_WAY", "ARRIVED", "CONSULTATION"] },
    })
      .populate({ path: "patientId", populate: { path: "userId", select: "name phone email" } })
      .populate({ path: "doctorId", populate: { path: "userId", select: "name phone email" } })
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: activeVisits.length,
      activeVisits,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// PAYMENTS
// ======================================================

const getPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const total = await Payment.countDocuments(filter);
    const payments = await Payment.find(filter)
      .populate({ path: "patientId", populate: { path: "userId", select: "name email phone" } })
      .populate({ path: "doctorId", populate: { path: "userId", select: "name email phone" } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      payments,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// REVIEWS & COMPLAINTS
// ======================================================

const getReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const total = await Review.countDocuments();
    const reviews = await Review.find()
      .populate({ path: "patientId", populate: { path: "userId", select: "name email" } })
      .populate({ path: "doctorId", populate: { path: "userId", select: "name email" } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

const getComplaints = async (req, res, next) => {
  try {
    const rejectedBookings = await Booking.find({
      status: { $in: ["REJECTED", "CANCELLED"] },
    })
      .populate({ path: "patientId", populate: { path: "userId", select: "name phone email" } })
      .populate({ path: "doctorId", populate: { path: "userId", select: "name phone email" } })
      .sort({ updatedAt: -1 });

    const lowReviews = await Review.find({ rating: { $lte: 2 } })
      .populate({ path: "patientId", populate: { path: "userId", select: "name phone email" } })
      .populate({ path: "doctorId", populate: { path: "userId", select: "name phone email" } })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      complaints: {
        rejectedBookings,
        lowReviews,
        count: rejectedBookings.length + lowReviews.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// ANALYTICS & AUDIT LOGS
// ======================================================

const getAnalytics = async (req, res, next) => {
  try {
    const totalRevenue = await Payment.aggregate([
      { $match: { status: "PAID" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const bookingStats = await Booking.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    return res.status(200).json({
      success: true,
      analytics: {
        totalRevenue: totalRevenue[0]?.total || 0,
        bookingStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const skip = (page - 1) * limit;

    const total = await AuditLog.countDocuments();
    const logs = await AuditLog.find()
      .populate("userId", "name email role")
      .populate("actor", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      logs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};