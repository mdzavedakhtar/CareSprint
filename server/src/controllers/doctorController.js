const Doctor = require("../models/Doctor");
const Booking = require("../models/Booking");
const Prescription = require("../models/Prescription");
const Patient = require("../models/Patient");
const Notification = require("../models/Notification");
const { validateCoordinates } = require("../utils/locationService");
const {
  emitBookingAccepted,
  emitBookingRejected,
  emitDoctorOnTheWay,
  emitDoctorArrived,
  emitConsultationStarted,
  emitConsultationCompleted,
  emitPrescriptionCreated,
  emitDoctorLocationUpdated,
} = require("../sockets/socketService");

const getUserId = (req) => {
  return req.user?.userId || req.user?.id || req.user?._id;
};

const getDoctor = async (req) => {
  const userId = getUserId(req);

  return Doctor.findOne({
    userId,
  }).populate("userId", "name email phone");
};

// ======================================================
// DOCTOR DASHBOARD
// ======================================================

const getDashboard = async (req, res) => {
  try {
    const doctor = await getDoctor(req);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const todayVisits = await Booking.countDocuments({
      doctorId: doctor._id,
      createdAt: {
        $gte: start,
        $lte: end,
      },
      status: {
        $in: [
          "ACCEPTED",
          "DOCTOR_ON_THE_WAY",
          "ARRIVED",
          "CONSULTATION",
          "COMPLETED",
        ],
      },
    });

    const pendingRequests = await Booking.countDocuments({
      doctorId: doctor._id,
      status: "REQUESTED",
    });

    const completedBookings = await Booking.find({
      doctorId: doctor._id,
      status: "COMPLETED",
      paymentStatus: "PAID",
    }).select("consultationFee");

    const earnings = completedBookings.reduce(
      (total, booking) =>
        total + Number(booking.consultationFee || 0),
      0
    );

    let activeBooking = null;
    if (doctor.activeBookingId) {
      activeBooking = await Booking.findById(doctor.activeBookingId).populate({
        path: "patientId",
        populate: {
          path: "userId",
          select: "name email phone",
        },
      });
    }

    return res.json({
      success: true,
      dashboard: {
        availabilityStatus: doctor.availabilityStatus,
        verificationStatus: doctor.verificationStatus,
        consultationFee: doctor.consultationFee,
        rating: doctor.rating,
        activeBookingId: doctor.activeBookingId,
        activeBooking,
        doctor: {
          id: doctor._id,
          name: doctor.userId?.name || "Doctor",
          specialization: doctor.specialization,
          qualification: doctor.qualification,
          experience: doctor.experience,
          consultationFee: doctor.consultationFee,
          verificationStatus: doctor.verificationStatus,
          availabilityStatus: doctor.availabilityStatus,
          rating: doctor.rating,
        },
        todayVisits,
        pendingRequests,
        earnings,
      },
    });
  } catch (error) {
    console.error("Doctor dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load doctor dashboard",
    });
  }
};

// ======================================================
// PROFILE
// ======================================================

const getProfile = async (req, res) => {
  try {
    const doctor = await getDoctor(req);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    return res.json({
      success: true,
      doctor,
    });
  } catch (error) {
    console.error("Get doctor profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load doctor profile",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const doctor = await getDoctor(req);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const allowedFields = [
      "specialization",
      "qualification",
      "experience",
      "consultationFee",
      "serviceRadius",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        doctor[field] = req.body[field];
      }
    });

    await doctor.save();

    return res.json({
      success: true,
      message: "Doctor profile updated successfully",
      doctor,
    });
  } catch (error) {
    console.error("Update doctor profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update doctor profile",
    });
  }
};

// ======================================================
// VERIFICATION DOCUMENTS
// ======================================================

const getVerificationDocuments = async (req, res) => {
  try {
    const doctor = await getDoctor(req);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    return res.json({
      success: true,
      verificationStatus: doctor.verificationStatus,
      documents: doctor.verificationDocuments || [],
    });
  } catch (error) {
    console.error("Get documents error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load verification documents",
    });
  }
};

const addVerificationDocument = async (req, res) => {
  try {
    const doctor = await getDoctor(req);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const {
      documentType,
      documentNumber,
      documentUrl,
      documentName,
    } = req.body;

    if (!documentType) {
      return res.status(400).json({
        success: false,
        message: "Document type is required",
      });
    }

    doctor.verificationDocuments.push({
      documentType,
      documentNumber: documentNumber || null,
      documentUrl: documentUrl || null,
      documentName: documentName || null,
      status: "PENDING",
    });

    doctor.verificationStatus = "PENDING";

    await doctor.save();

    return res.status(201).json({
      success: true,
      message: "Verification document added successfully",
      documents: doctor.verificationDocuments,
    });
  } catch (error) {
    console.error("Add document error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add verification document",
    });
  }
};

// ======================================================
// AVAILABILITY
// ======================================================

const updateAvailability = async (req, res) => {
  try {
    const doctor = await getDoctor(req);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const { availabilityStatus } = req.body;

    if (
      !["OFFLINE", "AVAILABLE", "BUSY"].includes(
        availabilityStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid availability status",
      });
    }

    // ==================================================
    // ACTIVE BOOKING LOCK
    // ==================================================
    // Doctor cannot manually become AVAILABLE/OFFLINE
    // while an active booking is locking the doctor.
    if (
      doctor.activeBookingId &&
      availabilityStatus !== "BUSY"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Doctor is locked to an active booking",
      });
    }

    // Doctor must be verified before becoming available.
    if (
      availabilityStatus === "AVAILABLE" &&
      doctor.verificationStatus !== "APPROVED"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Doctor must be verified before becoming available",
      });
    }

    doctor.availabilityStatus = availabilityStatus;

    await doctor.save();

    return res.json({
      success: true,
      message: `Doctor is now ${availabilityStatus}`,
      availabilityStatus:
        doctor.availabilityStatus,
    });
  } catch (error) {
    console.error("Availability error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update availability",
    });
  }
};

const updateLocation = async (req, res, next) => {
  try {
    const doctor = await getDoctor(req);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const { longitude, latitude } = req.body;

    const validation = validateCoordinates(longitude, latitude);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    doctor.location = {
      type: "Point",
      coordinates: [validation.longitude, validation.latitude],
    };
    await doctor.save();

    const DoctorLocation = require("../models/DoctorLocation");
    await DoctorLocation.findOneAndUpdate(
      { doctorId: doctor._id },
      {
        $set: {
          location: {
            type: "Point",
            coordinates: [validation.longitude, validation.latitude],
          },
          isOnline: doctor.availabilityStatus === "AVAILABLE",
          lastUpdatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    if (doctor.activeBookingId) {
      emitDoctorLocationUpdated(doctor.activeBookingId, doctor._id, doctor.location);
    }

    return res.json({
      success: true,
      message: "Doctor location updated successfully",
      location: doctor.location,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// INCOMING REQUESTS
// ======================================================

const getRequests = async (req, res) => {
  try {
    const doctor = await getDoctor(req);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const requests = await Booking.find({
      doctorId: doctor._id,
      status: "REQUESTED",
    })
      .populate({
        path: "patientId",
        populate: {
          path: "userId",
          select: "name email phone",
        },
      })
      .sort({
        requestedAt: -1,
      });

    return res.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load incoming requests",
    });
  }
};

// ======================================================
// ACCEPT REQUEST
// ======================================================

const acceptRequest = async (req, res) => {
  try {
    const doctor = await getDoctor(req);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      doctorId: doctor._id,
      status: { $in: ["REQUESTED", "MATCHING"] },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking request is no longer available",
      });
    }

    // Atomic Doctor Lock Acquire (if not already acquired during dispatch)
    let lockedDoctor = await Doctor.findOneAndUpdate(
      {
        _id: doctor._id,
        availabilityStatus: "AVAILABLE",
        activeBookingId: null,
      },
      {
        $set: {
          availabilityStatus: "BUSY",
          activeBookingId: booking._id,
        },
      },
      { new: true }
    );

    // If lock was already placed on this doctor for this booking during candidate dispatch:
    if (!lockedDoctor) {
      const currentDoc = await Doctor.findById(doctor._id);
      if (
        currentDoc &&
        String(currentDoc.activeBookingId) === String(booking._id)
      ) {
        lockedDoctor = currentDoc;
      } else {
        return res.status(409).json({
          success: false,
          message: "Doctor is no longer available for this booking",
        });
      }
    }

    booking.status = "ACCEPTED";
    booking.acceptedAt = new Date();
    booking.responseDeadline = null;

    if (Array.isArray(booking.matchingCandidates)) {
      const candidate = booking.matchingCandidates.find(
        (c) => String(c.doctorId) === String(doctor._id)
      );
      if (candidate) {
        candidate.response = "ACCEPTED";
        candidate.respondedAt = new Date();
      }
    }

    await booking.save();

    const populated = await Booking.findById(booking._id).populate({
      path: "patientId",
      populate: {
        path: "userId",
        select: "name email phone",
      },
    });

    console.log(`[MATCHING] Booking ${booking._id} accepted by doctor ${doctor._id}`);
    emitBookingAccepted(populated);

    return res.json({
      success: true,
      message: "Consultation request accepted",
      booking: populated,
    });
  } catch (error) {
    console.error("Accept request error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to accept request",
    });
  }
};

// ======================================================
// REJECT REQUEST
// ======================================================

const rejectRequest = async (req, res) => {
  try {
    const doctor = await getDoctor(req);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      doctorId: doctor._id,
      status: { $in: ["REQUESTED", "MATCHING"] },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking request not found",
      });
    }

    const {
      releaseDoctor,
      dispatchNextDoctor,
      markCandidateResponse,
    } = require("../services/matchingEngine");

    // Atomic doctor lock release
    await releaseDoctor(doctor._id, booking._id);

    // Record response in candidate queue
    await markCandidateResponse({
      bookingId: booking._id,
      doctorId: doctor._id,
      response: "REJECTED",
    });

    booking.doctorId = null;
    booking.responseDeadline = null;
    booking.cancellationReason = req.body.reason || "Rejected by doctor";

    console.log(`[MATCHING] Booking ${booking._id} rejected by doctor ${doctor._id}`);
    emitBookingRejected(booking, booking.cancellationReason);

    // If candidate queue exists, dispatch next doctor; otherwise set REJECTED
    if (
      Array.isArray(booking.matchingCandidates) &&
      booking.matchingCandidates.length > 0 &&
      booking.dispatchAttempt < booking.matchingCandidates.length
    ) {
      booking.status = "MATCHING";
      await booking.save();
      await dispatchNextDoctor(booking._id);
    } else {
      booking.status = "REJECTED";
      await booking.save();
    }

    return res.json({
      success: true,
      message: "Consultation request rejected",
    });
  } catch (error) {
    console.error("Reject request error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reject request",
    });
  }
};

// ======================================================
// PATIENT DETAILS
// ======================================================

const getVisitDetails = async (req, res) => {
  try {
    const doctor = await getDoctor(req);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      doctorId: doctor._id,
    })
      .populate({
        path: "patientId",
        populate: {
          path: "userId",
          select: "name email phone",
        },
      })
      .populate("prescriptionId");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Visit not found",
      });
    }

    return res.json({
      success: true,
      booking,
      patient: booking.patientId,
    });
  } catch (error) {
    console.error("Visit details error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load patient details",
    });
  }
};

// ======================================================
// START VISIT
// ======================================================

const startVisit = async (req, res) => {
  try {
    const doctor = await getDoctor(req);

    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      doctorId: doctor._id,
      status: "ACCEPTED",
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Accepted visit not found",
      });
    }

    // Ensure doctor is still locked to this booking.
    if (
      doctor.activeBookingId &&
      doctor.activeBookingId.toString() !==
        booking._id.toString()
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Doctor is locked to another active booking",
      });
    }

    booking.status = "DOCTOR_ON_THE_WAY";

    await booking.save();
    emitDoctorOnTheWay(booking);

    return res.json({
      success: true,
      message: "Visit started",
      booking,
    });
  } catch (error) {
    console.error("Start visit error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to start visit",
    });
  }
};

// ======================================================
// ARRIVED
// ======================================================

const markArrived = async (req, res) => {
  try {
    const doctor = await getDoctor(req);

    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      doctorId: doctor._id,
      status: "DOCTOR_ON_THE_WAY",
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Active visit not found",
      });
    }

    booking.status = "ARRIVED";

    await booking.save();
    emitDoctorArrived(booking);

    return res.json({
      success: true,
      message: "Patient arrival marked",
      booking,
    });
  } catch (error) {
    console.error("Arrived error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update visit",
    });
  }
};

// ======================================================
// START CONSULTATION
// ======================================================

const startConsultation = async (req, res) => {
  try {
    const doctor = await getDoctor(req);

    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      doctorId: doctor._id,
      status: "ARRIVED",
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message:
          "Visit is not ready for consultation",
      });
    }

    booking.status = "CONSULTATION";

    await booking.save();
    emitConsultationStarted(booking);

    return res.json({
      success: true,
      message: "Consultation started",
      booking,
    });
  } catch (error) {
    console.error(
      "Consultation start error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to start consultation",
    });
  }
};

// ======================================================
// COMPLETE CONSULTATION
// ======================================================

const completeConsultation = async (
  req,
  res
) => {
  try {
    const doctor = await getDoctor(req);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      doctorId: doctor._id,
      status: "CONSULTATION",
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Active consultation not found",
      });
    }

    // ==================================================
    // COMPLETE BOOKING
    // ==================================================

    booking.status = "COMPLETED";
    booking.completedAt = new Date();

    await booking.save();
    emitConsultationCompleted(booking);

    // ==================================================
    // RELEASE DOCTOR LOCK
    // ==================================================
    // Only release the doctor if this booking currently
    // owns the active booking lock.
    const releasedDoctor =
      await Doctor.findOneAndUpdate(
        {
          _id: doctor._id,
          activeBookingId: booking._id,
        },
        {
          $set: {
            availabilityStatus: "AVAILABLE",
            activeBookingId: null,
          },
        },
        {
          new: true,
        }
      );

    // Safety fallback:
    // If the booking was completed but the doctor was
    // not locked to this booking, do not silently overwrite
    // another active booking state.
    if (!releasedDoctor) {
      return res.status(409).json({
        success: false,
        message:
          "Consultation completed, but doctor lock could not be released",
        booking,
      });
    }

    return res.json({
      success: true,
      message:
        "Consultation completed successfully",
      booking,
      doctor: {
        availabilityStatus:
          releasedDoctor.availabilityStatus,
        activeBookingId:
          releasedDoctor.activeBookingId,
      },
    });
  } catch (error) {
    console.error(
      "Complete consultation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to complete consultation",
    });
  }
};

// ======================================================
// PRESCRIPTION
// ======================================================

const createPrescription = async (req, res) => {
  try {
    const doctor = await getDoctor(req);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      doctorId: doctor._id,
      status: {
        $in: [
          "CONSULTATION",
          "COMPLETED",
        ],
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Consultation visit not found or unauthorized for prescription creation",
      });
    }

    const {
      diagnosis,
      medicines,
      instructions,
      notes,
      followUpAdvice,
      followUpDate,
    } = req.body;

    let prescription = await Prescription.findOne({ bookingId: booking._id });

    if (prescription) {
      // Update existing prescription
      prescription.diagnosis = diagnosis !== undefined ? diagnosis : prescription.diagnosis;
      prescription.medicines = medicines !== undefined ? medicines : prescription.medicines;
      prescription.instructions = instructions !== undefined ? instructions : prescription.instructions;
      prescription.notes = notes !== undefined ? notes : prescription.notes;
      prescription.followUpAdvice = followUpAdvice !== undefined ? followUpAdvice : prescription.followUpAdvice;
      prescription.followUpDate = followUpDate !== undefined ? followUpDate : prescription.followUpDate;
      await prescription.save();
    } else {
      // Create new prescription
      prescription = await Prescription.create({
        bookingId: booking._id,
        patientId: booking.patientId,
        doctorId: doctor._id,
        diagnosis: diagnosis || "",
        medicines: medicines || [],
        instructions: instructions || "",
        notes: notes || null,
        followUpAdvice: followUpAdvice || null,
        followUpDate: followUpDate || null,
      });

      booking.prescriptionId = prescription._id;
      await booking.save();
    }

    // Emit Socket.IO event
    emitPrescriptionCreated(booking, prescription);

    // Generate In-App Notification for Patient
    try {
      const patient = await Patient.findById(booking.patientId);
      if (patient && patient.userId) {
        const doctorName = doctor.userId?.name || "Your Doctor";
        await Notification.create({
          userId: patient.userId,
          title: "New Digital Prescription Issued",
          message: `Dr. ${doctorName} has issued a digital prescription for your consultation visit.`,
          type: "PRESCRIPTION_READY",
        });
      }
    } catch (notifErr) {
      console.error("Prescription notification error:", notifErr);
    }

    return res.status(201).json({
      success: true,
      message: "Prescription saved successfully",
      prescription,
    });
  } catch (error) {
    console.error("Prescription error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create prescription",
    });
  }
};

// ======================================================
// EARNINGS
// ======================================================

const getEarnings = async (req, res) => {
  try {
    const doctor = await getDoctor(req);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const completed = await Booking.find({
      doctorId: doctor._id,
      status: "COMPLETED",
      paymentStatus: "PAID",
    }).sort({
      completedAt: -1,
    });

    const totalEarnings =
      completed.reduce(
        (sum, booking) =>
          sum +
          Number(
            booking.consultationFee || 0
          ),
        0
      );

    const start = new Date();

    start.setHours(0, 0, 0, 0);

    const today = completed.filter(
      (booking) =>
        booking.completedAt &&
        booking.completedAt >= start
    );

    const todayEarnings =
      today.reduce(
        (sum, booking) =>
          sum +
          Number(
            booking.consultationFee || 0
          ),
        0
      );

    return res.json({
      success: true,

      earnings: {
        total: totalEarnings,
        today: todayEarnings,
        completedVisits: completed.length,
        consultations: completed.length,
        bookings: completed,
      },
    });
  } catch (error) {
    console.error(
      "Earnings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load earnings",
    });
  }
};

// ======================================================
// VISIT HISTORY
// ======================================================

const getHistory = async (req, res) => {
  try {
    const doctor = await getDoctor(req);

    const visits = await Booking.find({
      doctorId: doctor._id,
      status: {
        $in: [
          "COMPLETED",
          "CANCELLED",
        ],
      },
    })
      .populate({
        path: "patientId",
        populate: {
          path: "userId",
          select: "name phone email",
        },
      })
      .populate("prescriptionId")
      .sort({
        createdAt: -1,
      });

    return res.json({
      success: true,
      visits,
    });
  } catch (error) {
    console.error(
      "History error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load visit history",
    });
  }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  getDashboard,

  getProfile,
  updateProfile,

  getVerificationDocuments,
  addVerificationDocument,

  updateAvailability,
  updateLocation,

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
};