const Booking = require("../models/Booking");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");

let ioInstance = null;

const setIO = (io) => {
  ioInstance = io;
};

const getIO = () => {
  return ioInstance;
};

/**
 * Authorize socket user for a specific booking room.
 */
const isAuthorizedForBookingRoom = async (userId, userRole, bookingId) => {
  try {
    if (userRole === "ADMIN") {
      return true;
    }

    const booking = await Booking.findById(bookingId).lean();
    if (!booking) {
      return false;
    }

    if (userRole === "PATIENT") {
      const patient = await Patient.findOne({ userId }).lean();
      if (patient && booking.patientId.toString() === patient._id.toString()) {
        return true;
      }
      if (booking.patientId.toString() === userId.toString()) {
        return true;
      }
    }

    if (userRole === "DOCTOR") {
      const doctor = await Doctor.findOne({ userId }).lean();
      if (doctor && booking.doctorId && booking.doctorId.toString() === doctor._id.toString()) {
        return true;
      }
      if (booking.doctorId && booking.doctorId.toString() === userId.toString()) {
        return true;
      }
      // Also allow if candidate in matchingCandidates
      if (Array.isArray(booking.matchingCandidates) && doctor) {
        const isCandidate = booking.matchingCandidates.some(
          (c) => c.doctorId.toString() === doctor._id.toString()
        );
        if (isCandidate) return true;
      }
    }

    return false;
  } catch (error) {
    console.error("[Socket Authorization Error]:", error);
    return false;
  }
};

/**
 * Emit event safely to a room after database commit.
 */
const emitToRoom = (room, event, payload) => {
  if (!ioInstance) {
    console.warn(`[SocketEmitter] IO instance not set, skipping emit for event: ${event}`);
    return;
  }
  ioInstance.to(room).emit(event, {
    event,
    timestamp: new Date().toISOString(),
    ...payload,
  });
};

// ======================================================
// DOMAIN EVENT EMITTERS (Emitted post-DB success)
// ======================================================

const emitBookingRequested = (booking) => {
  const payload = { bookingId: booking._id, status: booking.status, booking };
  emitToRoom(`booking:${booking._id}`, "BOOKING_REQUESTED", payload);
  if (booking.doctorId) {
    emitToRoom(`user:${booking.doctorId}`, "BOOKING_REQUESTED", payload);
  }
};

const emitBookingAccepted = (booking) => {
  const payload = { bookingId: booking._id, status: "ACCEPTED", booking };
  emitToRoom(`booking:${booking._id}`, "BOOKING_ACCEPTED", payload);
  emitToRoom(`user:${booking.patientId}`, "BOOKING_ACCEPTED", payload);
};

const emitBookingRejected = (booking, reason) => {
  const payload = { bookingId: booking._id, status: "REJECTED", reason, booking };
  emitToRoom(`booking:${booking._id}`, "BOOKING_REJECTED", payload);
  emitToRoom(`user:${booking.patientId}`, "BOOKING_REJECTED", payload);
};

const emitDoctorOnTheWay = (booking) => {
  const payload = { bookingId: booking._id, status: "DOCTOR_ON_THE_WAY", booking };
  emitToRoom(`booking:${booking._id}`, "DOCTOR_ON_THE_WAY", payload);
};

const emitDoctorArrived = (booking) => {
  const payload = { bookingId: booking._id, status: "ARRIVED", booking };
  emitToRoom(`booking:${booking._id}`, "DOCTOR_ARRIVED", payload);
};

const emitConsultationStarted = (booking) => {
  const payload = { bookingId: booking._id, status: "CONSULTATION", booking };
  emitToRoom(`booking:${booking._id}`, "CONSULTATION_STARTED", payload);
};

const emitConsultationCompleted = (booking) => {
  const payload = { bookingId: booking._id, status: "COMPLETED", booking };
  emitToRoom(`booking:${booking._id}`, "CONSULTATION_COMPLETED", payload);
};

const emitBookingCancelled = (booking, reason) => {
  const payload = { bookingId: booking._id, status: "CANCELLED", reason, booking };
  emitToRoom(`booking:${booking._id}`, "BOOKING_CANCELLED", payload);
  if (booking.doctorId) {
    emitToRoom(`user:${booking.doctorId}`, "BOOKING_CANCELLED", payload);
  }
};

const emitPrescriptionCreated = (booking, prescription) => {
  const payload = { bookingId: booking._id, prescription };
  emitToRoom(`booking:${booking._id}`, "PRESCRIPTION_CREATED", payload);
  emitToRoom(`user:${booking.patientId}`, "PRESCRIPTION_CREATED", payload);
};

const emitDoctorLocationUpdated = (bookingId, doctorId, location) => {
  const payload = { bookingId, doctorId, location, updatedAt: new Date() };
  emitToRoom(`booking:${bookingId}`, "DOCTOR_LOCATION_UPDATED", payload);
};

const emitNotificationCreated = (userId, notification) => {
  const payload = { notification };
  emitToRoom(`user:${userId}`, "NOTIFICATION_CREATED", payload);
};

module.exports = {
  setIO,
  getIO,
  isAuthorizedForBookingRoom,
  emitToRoom,
  emitBookingRequested,
  emitBookingAccepted,
  emitBookingRejected,
  emitDoctorOnTheWay,
  emitDoctorArrived,
  emitConsultationStarted,
  emitConsultationCompleted,
  emitBookingCancelled,
  emitPrescriptionCreated,
  emitDoctorLocationUpdated,
  emitNotificationCreated,
};
