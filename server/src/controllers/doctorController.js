const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Booking = require("../models/Booking");
const Prescription = require("../models/Prescription");

const getDoctor = async (userId) => {
  const doctor = await Doctor.findOne({
    userId,
  });

  if (!doctor) {
    const error = new Error("Doctor profile not found");
    error.statusCode = 404;
    throw error;
  }

  return doctor;
};

// ==========================================
// Doctor Dashboard
// ==========================================

const getDashboard = async (req, res, next) => {
  try {
    const doctor = await getDoctor(req.user.userId);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [
      todayVisits,
      pendingRequests,
      completedBookings,
    ] = await Promise.all([
      Booking.countDocuments({
        doctorId: doctor._id,
        status: {
          $in: [
            "ACCEPTED",
            "DOCTOR_ON_THE_WAY",
            "ARRIVED",
            "CONSULTATION",
          ],
        },
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      }),

      Booking.countDocuments({
        doctorId: doctor._id,
        status: {
          $in: ["REQUESTED", "MATCHING"],
        },
      }),

      Booking.find({
        doctorId: doctor._id,
        status: "COMPLETED",
        paymentStatus: "PAID",
      }).select("consultationFee"),
    ]);

    const earnings = completedBookings.reduce(
      (total, booking) =>
        total + Number(booking.consultationFee || 0),
      0
    );

    return res.status(200).json({
      success: true,
      dashboard: {
        availabilityStatus:
          doctor.availabilityStatus,
        verificationStatus:
          doctor.verificationStatus,
        todayVisits,
        pendingRequests,
        earnings,
        rating: doctor.rating,
        consultationFee:
          doctor.consultationFee,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Doctor Profile
// ==========================================

const getProfile = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({
      userId: req.user.userId,
    }).populate(
      "userId",
      "name email phone profileImage address"
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Availability
// ==========================================

const updateAvailability = async (
  req,
  res,
  next
) => {
  try {
    const {
      availabilityStatus,
    } = req.body;

    const allowedStatuses = [
      "OFFLINE",
      "AVAILABLE",
      "BUSY",
    ];

    if (
      !allowedStatuses.includes(
        availabilityStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid availability status",
      });
    }

    const doctor = await getDoctor(
      req.user.userId
    );

    if (
      doctor.verificationStatus !== "APPROVED"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Doctor must be approved before changing availability",
      });
    }

    doctor.availabilityStatus =
      availabilityStatus;

    await doctor.save();

    return res.status(200).json({
      success: true,
      message: "Availability updated successfully",
      availabilityStatus:
        doctor.availabilityStatus,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Incoming Requests
// ==========================================

const getRequests = async (
  req,
  res,
  next
) => {
  try {
    const doctor = await getDoctor(
      req.user.userId
    );

    const bookings = await Booking.find({
      doctorId: doctor._id,
      status: {
        $in: ["REQUESTED", "MATCHING"],
      },
    })
      .populate(
        "patientId"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      requests: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Accept / Reject Request
// ==========================================

const respondToRequest = async (
  req,
  res,
  next
) => {
  try {
    const { bookingId } = req.params;
    const { action } = req.body;

    if (!["ACCEPT", "REJECT"].includes(action)) {
      return res.status(400).json({
        success: false,
        message:
          "Action must be ACCEPT or REJECT",
      });
    }

    const doctor = await getDoctor(
      req.user.userId
    );

    const booking = await Booking.findOne({
      _id: bookingId,
      doctorId: doctor._id,
      status: {
        $in: ["REQUESTED", "MATCHING"],
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message:
          "Booking request not found or already handled",
      });
    }

    if (action === "ACCEPT") {
      booking.status = "ACCEPTED";
      booking.acceptedAt = new Date();

      doctor.availabilityStatus = "BUSY";

      await doctor.save();
    } else {
      booking.status = "CANCELLED";
      booking.cancellationReason =
        "Doctor rejected the request";
    }

    await booking.save();

    return res.status(200).json({
      success: true,
      message:
        action === "ACCEPT"
          ? "Visit request accepted"
          : "Visit request rejected",
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Visit Status
// ==========================================

const updateVisitStatus = async (
  req,
  res,
  next
) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    const validTransitions = {
      ACCEPTED: ["DOCTOR_ON_THE_WAY"],
      DOCTOR_ON_THE_WAY: ["ARRIVED"],
      ARRIVED: ["CONSULTATION"],
      CONSULTATION: ["COMPLETED"],
    };

    const doctor = await getDoctor(
      req.user.userId
    );

    const booking = await Booking.findOne({
      _id: bookingId,
      doctorId: doctor._id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Visit not found",
      });
    }

    const allowedNext =
      validTransitions[booking.status] || [];

    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change visit from ${booking.status} to ${status}`,
      });
    }

    booking.status = status;

    if (status === "COMPLETED") {
      booking.completedAt = new Date();

      doctor.availabilityStatus =
        "AVAILABLE";

      await doctor.save();
    }

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Visit status updated",
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Prescription
// ==========================================

const createPrescription = async (
  req,
  res,
  next
) => {
  try {
    const {
      bookingId,
      diagnosis,
      medicines,
      instructions,
      followUpDate,
    } = req.body;

    const doctor = await getDoctor(
      req.user.userId
    );

    const booking = await Booking.findOne({
      _id: bookingId,
      doctorId: doctor._id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (
      ![
        "ARRIVED",
        "CONSULTATION",
        "COMPLETED",
      ].includes(booking.status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Prescription can only be created during or after consultation",
      });
    }

    const existingPrescription =
      await Prescription.findOne({
        bookingId,
      });

    if (existingPrescription) {
      return res.status(409).json({
        success: false,
        message:
          "Prescription already exists for this visit",
      });
    }

    const prescription =
      await Prescription.create({
        bookingId,
        patientId: booking.patientId,
        doctorId: doctor._id,
        diagnosis,
        medicines: medicines || [],
        instructions,
        followUpDate:
          followUpDate || null,
      });

    booking.prescriptionId =
      prescription._id;

    await booking.save();

    return res.status(201).json({
      success: true,
      message:
        "Prescription created successfully",
      prescription,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Earnings
// ==========================================

const getEarnings = async (
  req,
  res,
  next
) => {
  try {
    const doctor = await getDoctor(
      req.user.userId
    );

    const completedBookings =
      await Booking.find({
        doctorId: doctor._id,
        status: "COMPLETED",
        paymentStatus: "PAID",
      }).sort({
        completedAt: -1,
      });

    const totalEarnings =
      completedBookings.reduce(
        (total, booking) =>
          total +
          Number(
            booking.consultationFee || 0
          ),
        0
      );

    return res.status(200).json({
      success: true,
      earnings: {
        total: totalEarnings,
        consultations:
          completedBookings.length,
        bookings: completedBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Visit History
// ==========================================

const getHistory = async (
  req,
  res,
  next
) => {
  try {
    const doctor = await getDoctor(
      req.user.userId
    );

    const visits = await Booking.find({
      doctorId: doctor._id,
      status: {
        $in: [
          "COMPLETED",
          "CANCELLED",
        ],
      },
    })
      .populate("patientId")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      visits,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getProfile,
  updateAvailability,
  getRequests,
  respondToRequest,
  updateVisitStatus,
  createPrescription,
  getEarnings,
  getHistory,
};