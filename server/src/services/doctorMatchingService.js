const Doctor = require("../models/Doctor");

const EARTH_RADIUS_KM = 6371;

/**
 * Calculate distance between two coordinates using Haversine formula.
 *
 * coordinates format:
 * [longitude, latitude]
 */
const calculateDistance = (
  patientCoordinates,
  doctorCoordinates
) => {
  if (
    !Array.isArray(patientCoordinates) ||
    patientCoordinates.length !== 2 ||
    !Array.isArray(doctorCoordinates) ||
    doctorCoordinates.length !== 2
  ) {
    return null;
  }

  const [patientLng, patientLat] = patientCoordinates;
  const [doctorLng, doctorLat] = doctorCoordinates;

  const lat1 = (patientLat * Math.PI) / 180;
  const lat2 = (doctorLat * Math.PI) / 180;

  const deltaLat =
    ((doctorLat - patientLat) * Math.PI) / 180;

  const deltaLng =
    ((doctorLng - patientLng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return EARTH_RADIUS_KM * c;
};

/**
 * Simple ETA estimation.
 *
 * Later this can be replaced by Google Maps /
 * Mapbox / OSRM routing API.
 */
const calculateETA = (distanceKm) => {
  if (distanceKm === null) {
    return null;
  }

  const averageSpeedKmph = 30;

  const minutes =
    (distanceKm / averageSpeedKmph) * 60;

  return Math.max(3, Math.ceil(minutes));
};

/**
 * Calculate doctor match score.
 *
 * Higher score = better match.
 */
const calculateMatchScore = ({
  distanceKm,
  etaMinutes,
  rating,
  specializationMatch,
}) => {
  const distanceScore = Math.max(
    0,
    40 - distanceKm * 8
  );

  const etaScore = Math.max(
    0,
    25 - etaMinutes * 1.5
  );

  const availabilityScore = 15;

  const specializationScore =
    specializationMatch ? 10 : 0;

  const ratingScore =
    (Number(rating) || 0) * 2;

  return (
    distanceScore +
    etaScore +
    availabilityScore +
    specializationScore +
    ratingScore
  );
};

/**
 * Find and rank suitable doctors.
 */
const findMatchingDoctors = async ({
  patientCoordinates,
  specialization,
}) => {
  if (
    !Array.isArray(patientCoordinates) ||
    patientCoordinates.length !== 2
  ) {
    throw new Error(
      "Valid patient coordinates are required"
    );
  }

  const query = {
    verificationStatus: "APPROVED",
    availabilityStatus: "AVAILABLE",
    "location.coordinates": {
      $exists: true,
      $ne: [0, 0],
    },
  };

  if (specialization) {
    query.specialization =
      new RegExp(
        `^${specialization.trim()}$`,
        "i"
      );
  }

  const doctors = await Doctor.find(query)
    .populate(
      "userId",
      "name email phone profileImage"
    )
    .lean();

  const matches = [];

  for (const doctor of doctors) {
    const distanceKm = calculateDistance(
      patientCoordinates,
      doctor.location?.coordinates
    );

    if (distanceKm === null) {
      continue;
    }

    /**
     * Doctor's service radius check.
     */
    if (
      distanceKm >
      Number(doctor.serviceRadius || 10)
    ) {
      continue;
    }

    const etaMinutes =
      calculateETA(distanceKm);

    const specializationMatch =
      specialization
        ? doctor.specialization?.toLowerCase() ===
          specialization.trim().toLowerCase()
        : true;

    const score = calculateMatchScore({
      distanceKm,
      etaMinutes,
      rating: doctor.rating,
      specializationMatch,
    });

    matches.push({
      doctorId: doctor._id,
      userId: doctor.userId?._id,
      name: doctor.userId?.name,
      phone: doctor.userId?.phone,
      profileImage:
        doctor.userId?.profileImage,

      specialization:
        doctor.specialization,

      qualification:
        doctor.qualification,

      experience:
        doctor.experience,

      consultationFee:
        doctor.consultationFee,

      rating:
        doctor.rating || 0,

      distanceKm: Number(
        distanceKm.toFixed(2)
      ),

      etaMinutes,

      serviceRadius:
        doctor.serviceRadius,

      availabilityStatus:
        doctor.availabilityStatus,

      matchScore: Number(
        score.toFixed(2)
      ),
    });
  }

  /**
   * Highest match score first.
   */
  matches.sort(
    (a, b) =>
      b.matchScore - a.matchScore
  );

  return matches;
};

module.exports = {
  calculateDistance,
  calculateETA,
  calculateMatchScore,
  findMatchingDoctors,
};