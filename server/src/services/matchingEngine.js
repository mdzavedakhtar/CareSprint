const mongoose = require("mongoose");
const Doctor = require("../models/Doctor");
const Booking = require("../models/Booking");
const { isAllowedServiceZone } = require("../utils/locationService");

// ======================================================
// CONFIG
// ======================================================

const RESPONSE_WINDOW_MS = 15 * 1000;

const MAX_SEARCH_RADIUS_KM = 50;

const AVERAGE_SPEED_KMH = 20;

const WEIGHTS = {
  distance: 0.25,
  eta: 0.20,
  availability: 0.10,
  specialization: 0.20,
  rating: 0.15,
  responseReliability: 0.10,
};

// ======================================================
// ETA
// ======================================================

const calculateEta = (distanceKm) => {
  if (!Number.isFinite(distanceKm)) {
    return null;
  }

  const travelMinutes =
    (distanceKm / AVERAGE_SPEED_KMH) * 60;

  const bufferMinutes = 2;

  return Math.max(
    3,
    Math.ceil(travelMinutes + bufferMinutes)
  );
};

// ======================================================
// NORMALIZATION
// ======================================================

const normalizeScore = (
  value,
  min,
  max
) => {
  if (value <= min) {
    return 1;
  }

  if (value >= max) {
    return 0;
  }

  return (
    1 -
    (value - min) /
      (max - min)
  );
};

// ======================================================
// SPECIALIZATION
// ======================================================

const calculateSpecializationScore = (
  doctorSpecialization,
  requiredSpecialization
) => {
  if (!requiredSpecialization) {
    return 0.5;
  }

  if (!doctorSpecialization) {
    return 0;
  }

  const doctorValue =
    doctorSpecialization
      .trim()
      .toLowerCase();

  const requiredValue =
    requiredSpecialization
      .trim()
      .toLowerCase();

  if (
    doctorValue === requiredValue
  ) {
    return 1;
  }

  if (
    doctorValue.includes(
      requiredValue
    ) ||
    requiredValue.includes(
      doctorValue
    )
  ) {
    return 0.75;
  }

  return 0;
};

// ======================================================
// MATCH SCORE
// ======================================================

const calculateMatchScore = ({
  distanceKm,
  etaMinutes,
  specializationScore,
  rating,
  responseReliability,
}) => {
  const distanceScore =
    normalizeScore(
      distanceKm,
      0,
      50
    );

  const etaScore =
    normalizeScore(
      etaMinutes,
      0,
      60
    );

  const availabilityScore = 1;

  const ratingScore =
    Math.min(
      Math.max(
        Number(rating || 0) / 5,
        0
      ),
      1
    );

  const responseScore =
    Math.min(
      Math.max(
        Number(
          responseReliability ?? 0.8
        ),
        0
      ),
      1
    );

  const score =
    distanceScore *
      WEIGHTS.distance +
    etaScore *
      WEIGHTS.eta +
    availabilityScore *
      WEIGHTS.availability +
    specializationScore *
      WEIGHTS.specialization +
    ratingScore *
      WEIGHTS.rating +
    responseScore *
      WEIGHTS.responseReliability;

  return Number(
    (score * 100).toFixed(2)
  );
};

// ======================================================
// FIND CANDIDATES
// ======================================================

const findMatchingDoctors = async ({
  longitude,
  latitude,
  specialization,
}) => {
  const query = {
    verificationStatus: "APPROVED",
    availabilityStatus: "AVAILABLE",
    activeBookingId: null,

    location: {
      $exists: true,
      $ne: null,
    },
  };

  if (specialization) {
    query.specialization = {
      $regex: specialization,
      $options: "i",
    };
  }

  const doctors = await Doctor.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        key: "location",
        distanceField: "distanceMeters",
        spherical: true,
        maxDistance: MAX_SEARCH_RADIUS_KM * 1000,
        query,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    { $match: { "user.isActive": true } },
    {
      $limit: 50,
    },
  ]);

  const candidates = [];

  for (const doctor of doctors) {
    const distanceKm = Number(doctor.distanceMeters) / 1000;
    const serviceRadius = Number(doctor.serviceRadius || 10);

    // Service radius check
    if (distanceKm > serviceRadius) {
      continue;
    }

    // Service zone check (Bhilai, Durg, Raipur)
    const city = doctor.user?.address || doctor.address;
    if (!isAllowedServiceZone(city, doctor.location?.coordinates)) {
      continue;
    }

    const etaMinutes = calculateEta(distanceKm);
    const specializationScore = calculateSpecializationScore(
      doctor.specialization,
      specialization
    );

    const matchScore = calculateMatchScore({
      distanceKm,
      etaMinutes,
      specializationScore,
      rating: doctor.rating,
      responseReliability: doctor.responseReliability,
    });

    candidates.push({
      doctorId: doctor._id,
      distanceKm: Number(distanceKm.toFixed(2)),
      etaMinutes,
      matchScore,
      specializationScore,
      ratingScore: Number((Number(doctor.rating || 0) / 5).toFixed(3)),
      responseScore: Number(doctor.responseReliability ?? 0.8),
      specialization: doctor.specialization,
      rating: Number(doctor.rating || 0),
      responseReliability: Number(doctor.responseReliability ?? 0.8),
    });
  }

  // Deterministic multi-level sorting
  candidates.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    if (a.distanceKm !== b.distanceKm) {
      return a.distanceKm - b.distanceKm;
    }
    if (b.rating !== a.rating) {
      return b.rating - a.rating;
    }
    return String(a.doctorId).localeCompare(String(b.doctorId));
  });

  return candidates;
};

// ======================================================
// ATOMIC DOCTOR LOCK
// ======================================================

const lockDoctorForBooking = async (
  doctorId,
  bookingId
) => {
  const doctor =
    await Doctor.findOneAndUpdate(
      {
        _id: doctorId,

        verificationStatus:
          "APPROVED",

        availabilityStatus:
          "AVAILABLE",

        activeBookingId: null,
      },

      {
        $set: {
          availabilityStatus:
            "BUSY",

          activeBookingId:
            bookingId,
        },
      },

      {
        returnDocument: "after",
      }
    );

  return doctor;
};

// ======================================================
// RELEASE DOCTOR
// ======================================================

const releaseDoctor = async (
  doctorId,
  bookingId
) => {
  await Doctor.findOneAndUpdate(
    {
      _id: doctorId,
      activeBookingId:
        bookingId,
    },

    {
      $set: {
        availabilityStatus:
          "AVAILABLE",
        activeBookingId:
          null,
      },
    },

    {
      returnDocument: "after",
    }
  );
};

// ======================================================
// MARK CANDIDATE RESPONSE
// ======================================================

const markCandidateResponse = async ({
  bookingId,
  doctorId,
  response,
}) => {
  await Booking.updateOne(
    {
      _id: bookingId,
      "matchingCandidates.doctorId":
        doctorId,
    },

    {
      $set: {
        "matchingCandidates.$.response":
          response,

        "matchingCandidates.$.respondedAt":
          new Date(),
      },
    }
  );
};

// ======================================================
// DISPATCH
// ======================================================

const dispatchNextDoctor = async (
  bookingId
) => {
  const booking =
    await Booking.findById(
      bookingId
    );

  if (!booking) {
    return null;
  }

  if (
    ![
      "MATCHING",
      "REQUESTED",
    ].includes(
      booking.status
    )
  ) {
    return booking;
  }

  if (
    booking.dispatchAttempt >=
    booking.maxDispatchAttempts
  ) {
    booking.status =
      "MATCHING_FAILED";

    booking.doctorId = null;

    booking.responseDeadline =
      null;

    await booking.save();

    return booking;
  }

  const currentAttempt =
    booking.dispatchAttempt;

  const candidate =
    booking.matchingCandidates[
      currentAttempt
    ];

  if (!candidate) {
    booking.status =
      "MATCHING_FAILED";

    booking.doctorId = null;

    booking.responseDeadline =
      null;

    await booking.save();

    return booking;
  }

  // ==================================================
  // ATOMIC LOCK
  // ==================================================

  const lockedDoctor =
    await lockDoctorForBooking(
      candidate.doctorId,
      booking._id
    );

  // Doctor became busy between
  // candidate discovery and dispatch.

  if (!lockedDoctor) {
    candidate.response =
      "TIMEOUT";

    candidate.respondedAt =
      new Date();

    booking.dispatchAttempt =
      currentAttempt + 1;

    await booking.save();

    return dispatchNextDoctor(
      bookingId
    );
  }

  // ==================================================
  // DISPATCH REQUEST
  // ==================================================

  const now = new Date();

  const deadline =
    new Date(
      now.getTime() +
        RESPONSE_WINDOW_MS
    );

  booking.doctorId =
    candidate.doctorId;

  booking.status =
    "MATCHING";

  booking.matchingStartedAt =
    booking.matchingStartedAt ||
    now;

  booking.responseDeadline =
    deadline;

  booking.dispatchAttempt =
    currentAttempt + 1;

  candidate.dispatchedAt =
    now;

  candidate.response =
    "PENDING";

  await booking.save();

  const { emitBookingRequested } = require("../sockets/socketService");
  emitBookingRequested(booking);

  console.log(
    `[MATCHING] Booking ${booking._id} dispatched to doctor ${candidate.doctorId}`
  );

  // ==================================================
  // 15 SECOND RESPONSE WINDOW
  // ==================================================

  setTimeout(
    async () => {
      try {
        await handleDoctorTimeout(
          booking._id,
          candidate.doctorId
        );
      } catch (error) {
        console.error(
          "[MATCHING] Timeout handler error:",
          error
        );
      }
    },
    RESPONSE_WINDOW_MS
  );

  return booking;
};

// ======================================================
// TIMEOUT
// ======================================================

const handleDoctorTimeout = async (
  bookingId,
  doctorId
) => {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  const booking =
    await Booking.findById(
      bookingId
    );

  if (!booking) {
    return;
  }

  // Someone already accepted.

  if (
    booking.status ===
      "ACCEPTED" ||
    booking.status ===
      "DOCTOR_ON_THE_WAY" ||
    booking.status ===
      "ARRIVED" ||
    booking.status ===
      "CONSULTATION" ||
    booking.status ===
      "COMPLETED"
  ) {
    return;
  }

  // Make sure this timeout belongs
  // to the currently assigned doctor.

  if (
    String(
      booking.doctorId
    ) !==
    String(doctorId)
  ) {
    return;
  }

  // Make sure deadline actually expired.

  if (
    booking.responseDeadline &&
    new Date() <
      booking.responseDeadline
  ) {
    return;
  }

  await markCandidateResponse({
    bookingId,
    doctorId,
    response: "TIMEOUT",
  });

  await releaseDoctor(
    doctorId,
    bookingId
  );

  booking.doctorId = null;

  booking.responseDeadline =
    null;

  await booking.save();

  console.log(
    `[MATCHING] Doctor ${doctorId} timed out for booking ${bookingId}`
  );

  await dispatchNextDoctor(
    bookingId
  );
};

// ======================================================
// START MATCHING
// ======================================================

const startMatching = async (
  bookingId
) => {
  const booking =
    await Booking.findById(
      bookingId
    );

  if (!booking) {
    throw new Error(
      "Booking not found"
    );
  }

  const coordinates =
    booking.patientLocation
      ?.coordinates;

  if (
    !coordinates ||
    coordinates.length !== 2
  ) {
    throw new Error(
      "Valid patient location is required"
    );
  }

  const [
    longitude,
    latitude,
  ] = coordinates;

  const candidates =
    await findMatchingDoctors({
      longitude,
      latitude,
      specialization:
        booking.specializationRequired,
    });

  if (
    candidates.length === 0
  ) {
    booking.status =
      "MATCHING_FAILED";

    booking.doctorId = null;

    await booking.save();

    return {
      success: false,
      reason:
        "No matching doctors available",
      booking,
      candidates: [],
    };
  }

  booking.status =
    "MATCHING";

  booking.matchingStartedAt =
    new Date();

  booking.dispatchAttempt = 0;

  booking.matchingCandidates =
    candidates.map(
      (candidate) => ({
        doctorId:
          candidate.doctorId,

        distanceKm:
          candidate.distanceKm,

        etaMinutes:
          candidate.etaMinutes,

        matchScore:
          candidate.matchScore,

        specializationScore:
          candidate.specializationScore,

        ratingScore:
          candidate.ratingScore,

        responseScore:
          candidate.responseScore,

        response:
          "PENDING",
      })
    );

  await booking.save();

  console.log(
    `[MATCHING] ${candidates.length} doctors ranked for booking ${bookingId}`
  );

  const dispatchedBooking =
    await dispatchNextDoctor(
      bookingId
    );

  return {
    success: true,
    booking:
      dispatchedBooking,
    candidates,
  };
};

// ======================================================
// ACCEPT
// ======================================================

const acceptMatchedBooking = async ({
  bookingId,
  doctorId,
}) => {
  const booking =
    await Booking.findOneAndUpdate(
      {
        _id: bookingId,

        doctorId,

        status: "MATCHING",

        responseDeadline: {
          $gt: new Date(),
        },
      },

      {
        $set: {
          status: "ACCEPTED",

          acceptedAt:
            new Date(),

          responseDeadline:
            null,
        },
      },

      {
        returnDocument: "after",
      }
    );

  if (!booking) {
    return null;
  }

  await Booking.updateOne(
    {
      _id: bookingId,
      "matchingCandidates.doctorId":
        doctorId,
    },

    {
      $set: {
        "matchingCandidates.$.response":
          "ACCEPTED",

        "matchingCandidates.$.respondedAt":
          new Date(),
      },
    }
  );

  return booking;
};

// ======================================================
// REJECT
// ======================================================

const rejectMatchedBooking = async ({
  bookingId,
  doctorId,
}) => {
  const booking =
    await Booking.findOne({
      _id: bookingId,
      doctorId,
      status: "MATCHING",
    });

  if (!booking) {
    return null;
  }

  await markCandidateResponse({
    bookingId,
    doctorId,
    response: "REJECTED",
  });

  await releaseDoctor(
    doctorId,
    bookingId
  );

  booking.doctorId = null;

  booking.responseDeadline =
    null;

  await booking.save();

  return dispatchNextDoctor(
    bookingId
  );
};

module.exports = {
  calculateEta,
  calculateMatchScore,
  findMatchingDoctors,
  startMatching,
  dispatchNextDoctor,
  acceptMatchedBooking,
  rejectMatchedBooking,
  handleDoctorTimeout,
  lockDoctorForBooking,
  releaseDoctor,
  markCandidateResponse,
};