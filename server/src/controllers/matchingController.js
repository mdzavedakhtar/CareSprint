const mongoose = require("mongoose");

const Booking = require("../models/Booking");
const Patient = require("../models/Patient");

const {
  startMatching,
} = require("../services/matchingEngine");

// ======================================================
// CREATE BOOKING + START MATCHING
// ======================================================

const createBookingAndMatch = async (
  req,
  res,
  next
) => {
  try {
    const userId =
      req.user?.userId ||
      req.user?.id ||
      req.user?._id;

    const {
      symptoms,
      specialization,
      address,
      patientLocation,
      consultationFee,
    } = req.body;

    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (!symptoms?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Symptoms are required",
      });
    }

    if (
      !patientLocation ||
      !Array.isArray(
        patientLocation.coordinates
      ) ||
      patientLocation.coordinates.length !==
        2
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid patient location is required",
      });
    }

    const [
      longitude,
      latitude,
    ] =
      patientLocation.coordinates;

    if (
      !Number.isFinite(
        Number(longitude)
      ) ||
      !Number.isFinite(
        Number(latitude)
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid longitude or latitude",
      });
    }

    if (
      Number(longitude) < -180 ||
      Number(longitude) > 180 ||
      Number(latitude) < -90 ||
      Number(latitude) > 90
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Coordinates are outside valid range",
      });
    }

    // --------------------------------------------------
    // PATIENT
    // --------------------------------------------------

    const patient =
      await Patient.findOne({
        userId,
      });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message:
          "Patient profile not found",
      });
    }

    // --------------------------------------------------
    // CREATE BOOKING
    // --------------------------------------------------

    const booking =
      await Booking.create({
        patientId:
          patient._id,

        doctorId: null,

        symptoms:
          symptoms.trim(),

        specializationRequired:
          specialization?.trim() ||
          null,

        address:
          address || {},

        patientLocation: {
          type: "Point",

          coordinates: [
            Number(longitude),
            Number(latitude),
          ],
        },

        consultationFee:
          Number(
            consultationFee || 0
          ),

        status: "MATCHING",

        paymentStatus:
          "PENDING",

        requestedAt:
          new Date(),
      });

    // --------------------------------------------------
    // START MATCHING
    // --------------------------------------------------

    const result =
      await startMatching(
        booking._id
      );

    if (!result.success) {
      return res.status(409).json({
        success: false,

        message:
          result.reason ||
          "No matching doctor available",

        booking:
          result.booking,
      });
    }

    return res.status(201).json({
      success: true,

      message:
        "Doctor matching started",

      booking:
        result.booking,

      candidates:
        result.candidates,
    });
  } catch (error) {
    console.error(
      "Create booking and match error:",
      error
    );

    next(error);
  }
};

// ======================================================
// GET BOOKING MATCH STATUS
// ======================================================

const getMatchingStatus = async (
  req,
  res,
  next
) => {
  try {
    const userId =
      req.user?.userId ||
      req.user?.id ||
      req.user?._id;

    const {
      bookingId,
    } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        bookingId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid booking ID",
      });
    }

    const patient =
      await Patient.findOne({
        userId,
      });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message:
          "Patient profile not found",
      });
    }

    const booking =
      await Booking.findOne({
        _id: bookingId,

        patientId:
          patient._id,
      })
        .populate({
          path: "doctorId",
          populate: {
            path: "userId",
            select:
              "name phone email profileImage",
          },
        });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message:
          "Booking not found",
      });
    }

    return res.json({
      success: true,

      booking: {
        id: booking._id,

        status:
          booking.status,

        doctor:
          booking.doctorId,

        distanceKm:
          booking.distanceKm,

        etaMinutes:
          booking.etaMinutes,

        matchScore:
          booking.matchScore,

        responseDeadline:
          booking.responseDeadline,

        dispatchAttempt:
          booking.dispatchAttempt,

        candidates:
          booking.matchingCandidates,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBookingAndMatch,
  getMatchingStatus,
};