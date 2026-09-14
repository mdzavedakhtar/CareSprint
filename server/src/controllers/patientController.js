const User = require("../models/User");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const DoctorLocation = require("../models/DoctorLocation");
const Booking = require("../models/Booking");
const Prescription = require("../models/Prescription");
const Review = require("../models/Review");
const Notification = require("../models/Notification");
const {
  validateCoordinates,
  isAllowedServiceZone,
  calculateHaversineDistance,
  calculateETA,
} = require("../utils/locationService");

// Helper to resolve Patient model by authenticated user ID
const getPatientByUserId = async (userId) => {
  let patient = await Patient.findOne({ userId });
  if (!patient) {
    // Auto-create patient profile if missing
    patient = await Patient.create({ userId });
  }
  return patient;
};

// ======================================================
// PATIENT DASHBOARD
// ======================================================

const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const patient = await getPatientByUserId(user._id);

    // Active or upcoming booking
    const upcomingVisit = await Booking.findOne({
      patientId: patient._id,
      status: {
        $in: [
          "REQUESTED",
          "MATCHING",
          "ACCEPTED",
          "DOCTOR_ON_THE_WAY",
          "ARRIVED",
          "CONSULTATION",
        ],
      },
    })
      .populate({
        path: "doctorId",
        populate: { path: "userId", select: "name phone profileImage" },
      })
      .sort({ createdAt: -1 });

    // Total completed visits
    const completedCount = await Booking.countDocuments({
      patientId: patient._id,
      status: "COMPLETED",
    });

    // Notifications
    const notifications = await Notification.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    return res.json({
      success: true,
      dashboard: {
        patient: {
          id: patient._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: patient.address || user.address || null,
          location: patient.location || user.location || null,
        },
        upcomingVisit,
        completedCount,
        notifications,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// PROFILE MANAGEMENT
// ======================================================

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const patient = await getPatientByUserId(user._id);

    return res.json({
      success: true,
      profile: {
        userId: user._id,
        patientId: patient._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        address: patient.address || user.address,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        emergencyContact: patient.emergencyContact,
        medicalNotes: patient.medicalNotes,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const { name, address, dateOfBirth, gender, emergencyContact, medicalNotes } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (name) user.name = name.trim();
    if (address) user.address = address.trim();
    await user.save();

    const patient = await getPatientByUserId(user._id);

    if (address) patient.address = address.trim();
    if (dateOfBirth) patient.dateOfBirth = dateOfBirth;
    if (gender) patient.gender = gender;
    if (emergencyContact) patient.emergencyContact = emergencyContact;
    if (medicalNotes !== undefined) patient.medicalNotes = medicalNotes;

    await patient.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      profile: {
        userId: user._id,
        patientId: patient._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: patient.address,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        emergencyContact: patient.emergencyContact,
        medicalNotes: patient.medicalNotes,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// LOCATION UPDATE
// ======================================================

const updateLocation = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const { longitude, latitude, coordinates, address } = req.body;

    let lng = longitude;
    let lat = latitude;

    if ((lng === undefined || lat === undefined) && Array.isArray(coordinates) && coordinates.length === 2) {
      [lng, lat] = coordinates;
    }

    const validation = validateCoordinates(lng, lat);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const geoPoint = {
      type: "Point",
      coordinates: [validation.longitude, validation.latitude],
    };

    user.location = geoPoint;
    if (address) user.address = address.trim();
    await user.save();

    const patient = await getPatientByUserId(user._id);
    patient.location = geoPoint;
    if (address) patient.address = address.trim();
    await patient.save();

    return res.json({
      success: true,
      message: "Patient location updated successfully",
      location: patient.location,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// FIND DOCTORS (Verified, Active & AVAILABLE Doctors Only)
// ======================================================

const getDoctors = async (req, res, next) => {
  try {
    const { search, specialization, lng, lat } = req.query;

    const query = {
      verificationStatus: "APPROVED",
      availabilityStatus: "AVAILABLE",
      activeBookingId: null,
    };

    if (specialization) {
      query.specialization = { $regex: specialization, $options: "i" };
    }

    let doctorsList = [];

    if (lng !== undefined && lat !== undefined && lng !== "" && lat !== "") {
      const coordVal = validateCoordinates(lng, lat);
      if (!coordVal.valid) {
        return res.status(400).json({
          success: false,
          message: coordVal.message,
        });
      }

      doctorsList = await Doctor.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [coordVal.longitude, coordVal.latitude] },
            key: "location",
            distanceField: "distanceMeters",
            spherical: true,
            maxDistance: 50 * 1000,
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
      ]);
    } else {
      doctorsList = await Doctor.find(query)
        .populate({ path: "userId", select: "name email phone profileImage isActive address" })
        .sort({ rating: -1 });

      doctorsList = doctorsList.filter((d) => d.userId && d.userId.isActive);
    }

    // Map and filter doctors against allowed service zones and radius
    let result = doctorsList
      .filter((doc) => {
        const coords = doc.location?.coordinates;
        const city = doc.user?.address || doc.userId?.address;
        return isAllowedServiceZone(city, coords);
      })
      .map((doc) => {
        const u = doc.user || doc.userId;
        let distanceKm = null;
        if (doc.distanceMeters !== undefined) {
          distanceKm = doc.distanceMeters / 1000;
        } else if (doc.location?.coordinates && lng && lat) {
          distanceKm = calculateHaversineDistance([Number(lng), Number(lat)], doc.location.coordinates);
        }

        const etaMinutes = calculateETA(distanceKm);

        return {
          id: doc._id,
          doctorId: doc._id,
          userId: u._id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          profileImage: u.profileImage,
          specialization: doc.specialization,
          qualification: doc.qualification,
          experience: `${doc.experience}+ years`,
          rating: doc.rating || 4.8,
          consultationFee: doc.consultationFee,
          serviceRadius: doc.serviceRadius,
          distance: distanceKm !== null ? `${distanceKm.toFixed(1)} km` : "Nearby",
          eta: etaMinutes !== null ? `${etaMinutes} min` : "10-15 min",
          availabilityStatus: doc.availabilityStatus,
          verificationStatus: doc.verificationStatus,
          // Privacy protection: raw live location coordinates are intentionally not exposed
        };
      });

    if (search?.trim()) {
      const s = search.trim().toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(s) ||
          d.specialization.toLowerCase().includes(s)
      );
    }

    return res.json({
      success: true,
      count: result.length,
      doctors: result,
    });
  } catch (error) {
    next(error);
  }
};

const getDoctorDetails = async (req, res, next) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findOne({
      _id: doctorId,
      verificationStatus: "APPROVED",
    }).populate("userId", "name email phone profileImage isActive");

    if (!doctor || !doctor.userId || !doctor.userId.isActive) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found or not available",
      });
    }

    const reviews = await Review.find({ doctorId: doctor._id })
      .populate({ path: "patientId", populate: { path: "userId", select: "name" } })
      .sort({ createdAt: -1 })
      .limit(10);

    return res.json({
      success: true,
      doctor: {
        id: doctor._id,
        doctorId: doctor._id,
        name: doctor.userId.name,
        specialization: doctor.specialization,
        qualification: doctor.qualification,
        experience: doctor.experience,
        consultationFee: doctor.consultationFee,
        rating: doctor.rating,
        availabilityStatus: doctor.availabilityStatus,
        verificationStatus: doctor.verificationStatus,
        serviceRadius: doctor.serviceRadius,
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// BOOKINGS / VISITS (Patient Ownership Enforced)
// ======================================================

const getBookings = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const patient = await getPatientByUserId(userId);

    const bookings = await Booking.find({ patientId: patient._id })
      .populate({
        path: "doctorId",
        populate: { path: "userId", select: "name phone profileImage" },
      })
      .populate("prescriptionId")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

const getBookingDetails = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const patient = await getPatientByUserId(userId);

    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      patientId: patient._id,
    })
      .populate({
        path: "doctorId",
        populate: { path: "userId", select: "name phone profileImage" },
      })
      .populate("prescriptionId");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.json({
      success: true,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// PRESCRIPTIONS
// ======================================================

const getPrescriptions = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const patient = await getPatientByUserId(userId);

    const prescriptions = await Prescription.find({ patientId: patient._id })
      .populate({
        path: "doctorId",
        populate: { path: "userId", select: "name specialization" },
      })
      .populate("bookingId")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: prescriptions.length,
      prescriptions,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// REVIEWS
// ======================================================

const getReviews = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const patient = await getPatientByUserId(userId);

    const reviews = await Review.find({ patientId: patient._id })
      .populate({
        path: "doctorId",
        populate: { path: "userId", select: "name specialization" },
      })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

const getDoctorReviews = async (req, res, next) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const reviews = await Review.find({ doctorId })
      .populate({
        path: "patientId",
        populate: { path: "userId", select: "name" },
      })
      .sort({ createdAt: -1 });

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = reviews.length > 0 ? Number((totalRating / reviews.length).toFixed(1)) : (doctor.rating || 5.0);

    return res.json({
      success: true,
      doctorId,
      averageRating: avgRating,
      reviewCount: reviews.length,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

const createReview = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const patient = await getPatientByUserId(userId);
    const { bookingId, doctorId, rating, comment } = req.body;

    if (!bookingId || rating === undefined) {
      return res.status(400).json({
        success: false,
        message: "Booking ID and rating are required",
      });
    }

    const numRating = Number(rating);
    if (!Number.isFinite(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a valid number between 1 and 5",
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Identity check: booking must belong to authenticated patient
    if (booking.patientId.toString() !== patient._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only review your own completed bookings",
      });
    }

    // Status check: booking must be COMPLETED
    if (booking.status !== "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: `Reviews can only be submitted for COMPLETED consultations (current status: ${booking.status})`,
      });
    }

    // Derive target doctor ID from booking
    const targetDoctorId = booking.doctorId;
    if (!targetDoctorId) {
      return res.status(400).json({
        success: false,
        message: "No doctor was assigned to this booking",
      });
    }

    if (doctorId && doctorId.toString() !== targetDoctorId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Provided doctor ID does not match the doctor assigned to this booking",
      });
    }

    // Validate doctor status
    const doctor = await Doctor.findById(targetDoctorId).populate("userId");
    if (!doctor || doctor.verificationStatus === "SUSPENDED" || doctor.userId?.isActive === false) {
      return res.status(400).json({
        success: false,
        message: "Cannot submit review for a suspended or inactive doctor",
      });
    }

    // Self-review prevention
    if (doctor.userId && doctor.userId._id.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Doctors cannot review their own consultations",
      });
    }

    // Duplicate review check
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: "Review for this booking has already been submitted",
      });
    }

    // Create Review
    const review = await Review.create({
      bookingId: booking._id,
      patientId: patient._id,
      doctorId: targetDoctorId,
      rating: numRating,
      comment: comment?.trim() || null,
    });

    // Update doctor's aggregate average rating safely
    const allDoctorReviews = await Review.find({ doctorId: targetDoctorId });
    const totalRating = allDoctorReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = Number((totalRating / allDoctorReviews.length).toFixed(1));

    await Doctor.findByIdAndUpdate(targetDoctorId, {
      rating: avgRating,
    });

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review,
      doctorAverageRating: avgRating,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// NOTIFICATIONS
// ======================================================

const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// BOOKING CREATION & CANCELLATION
// ======================================================

const createBooking = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const patient = await getPatientByUserId(userId);

    const {
      doctorId,
      symptoms,
      specialization,
      address,
      patientLocation,
      consultationFee,
    } = req.body;

    if (!symptoms?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Symptoms are required",
      });
    }

    if (
      !patientLocation ||
      !Array.isArray(patientLocation.coordinates) ||
      patientLocation.coordinates.length !== 2
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid patient location coordinates are required",
      });
    }

    const [longitude, latitude] = patientLocation.coordinates;

    if (
      !Number.isFinite(Number(longitude)) ||
      !Number.isFinite(Number(latitude)) ||
      Number(longitude) < -180 ||
      Number(longitude) > 180 ||
      Number(latitude) < -90 ||
      Number(latitude) > 90
    ) {
      return res.status(400).json({
        success: false,
        message: "Location coordinates are outside valid geographic range",
      });
    }

    let assignedDoctor = null;
    if (doctorId) {
      const doctor = await Doctor.findById(doctorId).populate("userId", "isActive");
      if (!doctor || doctor.verificationStatus !== "APPROVED" || !doctor.userId?.isActive) {
        return res.status(400).json({
          success: false,
          message: "Selected doctor is not eligible or approved for bookings",
        });
      }
      if (doctor.availabilityStatus !== "AVAILABLE" || doctor.activeBookingId) {
        return res.status(409).json({
          success: false,
          message: "Selected doctor is currently unavailable or busy with another booking",
        });
      }
      assignedDoctor = doctor;
    }

    const booking = await Booking.create({
      patientId: patient._id,
      doctorId: assignedDoctor ? assignedDoctor._id : null,
      symptoms: symptoms.trim(),
      specializationRequired: specialization?.trim() || assignedDoctor?.specialization || null,
      address: address || {},
      patientLocation: {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)],
      },
      consultationFee: Number(consultationFee || assignedDoctor?.consultationFee || 0),
      status: assignedDoctor ? "REQUESTED" : "MATCHING",
      paymentStatus: "PENDING",
      requestedAt: new Date(),
    });

    if (!assignedDoctor) {
      const { startMatching } = require("../services/matchingEngine");
      await startMatching(booking._id);
    }

    const updatedBooking = await Booking.findById(booking._id).populate({
      path: "doctorId",
      populate: { path: "userId", select: "name phone profileImage" },
    });

    return res.status(201).json({
      success: true,
      message: assignedDoctor ? "Booking request sent to doctor" : "Booking created, matching started",
      booking: updatedBooking || booking,
    });
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const patient = await getPatientByUserId(userId);

    const { bookingId } = req.params;
    const { reason } = req.body;

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

    const cancellableStatuses = ["REQUESTED", "MATCHING", "ACCEPTED", "DOCTOR_ON_THE_WAY"];
    if (!cancellableStatuses.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Booking in status ${booking.status} cannot be cancelled`,
      });
    }

    booking.status = "CANCELLED";
    booking.cancellationReason = reason?.trim() || "Cancelled by patient";
    await booking.save();

    const { emitBookingCancelled } = require("../sockets/socketService");
    emitBookingCancelled(booking, booking.cancellationReason);

    // Atomically release doctor lock if assigned and locked to this booking
    if (booking.doctorId) {
      await Doctor.findOneAndUpdate(
        {
          _id: booking.doctorId,
          activeBookingId: booking._id,
        },
        {
          $set: {
            availabilityStatus: "AVAILABLE",
            activeBookingId: null,
          },
        }
      );
    }

    return res.json({
      success: true,
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// LIVE TRACKING (Privacy Protected: Only for Assigned Active Booking)
// ======================================================

const getLiveTracking = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const patient = await getPatientByUserId(userId);

    const { bookingId } = req.params;
    const booking = await Booking.findOne({
      _id: bookingId,
      patientId: patient._id,
    }).populate({
      path: "doctorId",
      populate: { path: "userId", select: "name phone profileImage" },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const activeTrackingStatuses = ["ACCEPTED", "DOCTOR_ON_THE_WAY", "ARRIVED", "CONSULTATION"];
    if (!activeTrackingStatuses.includes(booking.status)) {
      return res.status(403).json({
        success: false,
        message: `Live tracking is only accessible during active visits (current status: ${booking.status})`,
      });
    }

    if (!booking.doctorId) {
      return res.status(404).json({
        success: false,
        message: "No doctor assigned to this booking yet",
      });
    }

    // Retrieve live doctor coordinates from DoctorLocation or Doctor profile
    const docLoc = await DoctorLocation.findOne({ doctorId: booking.doctorId._id });
    const doctorCurrentLoc = docLoc?.location?.coordinates || booking.doctorId.location?.coordinates || null;

    let distanceKm = null;
    let etaMinutes = null;

    if (doctorCurrentLoc && booking.patientLocation?.coordinates) {
      distanceKm = calculateHaversineDistance(doctorCurrentLoc, booking.patientLocation.coordinates);
      etaMinutes = calculateETA(distanceKm);
    }

    const lastUpdate = docLoc?.lastUpdatedAt || docLoc?.updatedAt || null;
    const isStale = lastUpdate ? Date.now() - new Date(lastUpdate).getTime() > 2 * 60 * 1000 : true;

    return res.json({
      success: true,
      tracking: {
        bookingId: booking._id,
        status: booking.status,
        doctor: {
          id: booking.doctorId._id,
          name: booking.doctorId.userId?.name,
          phone: booking.doctorId.userId?.phone,
          profileImage: booking.doctorId.userId?.profileImage,
          specialization: booking.doctorId.specialization,
          rating: booking.doctorId.rating || 4.8,
          consultationFee: booking.doctorId.consultationFee,
          location: doctorCurrentLoc
            ? { type: "Point", coordinates: doctorCurrentLoc }
            : null,
          lastUpdatedAt: lastUpdate,
          isStale,
        },
        patientLocation: booking.patientLocation,
        address: booking.address,
        symptoms: booking.symptoms,
        distanceKm: distanceKm !== null ? Number(distanceKm.toFixed(2)) : null,
        etaMinutes,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getProfile,
  updateProfile,
  updateLocation,
  getDoctors,
  getDoctorDetails,
  getBookings,
  getBookingDetails,
  createBooking,
  cancelBooking,
  getLiveTracking,
  getPrescriptions,
  getReviews,
  getDoctorReviews,
  createReview,
  getNotifications,
};
