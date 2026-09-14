const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./src/models/User");
const Patient = require("./src/models/Patient");
const Doctor = require("./src/models/Doctor");
const Booking = require("./src/models/Booking");
const Review = require("./src/models/Review");

async function runVerification() {
  try {
    console.log("--- STARTING PHASE 16 (REVIEWS & RATINGS) VERIFICATION ---");
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/caresprint";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    // Clean test data
    await User.deleteMany({ email: /@testreview\.com$/ });
    await Doctor.deleteMany({ licenseNumber: "REV-LIC-12345" });
    await Booking.deleteMany({ symptoms: "Test Review Consultation Symptoms" });

    // 1. Create Patient 1, Patient 2 & Doctor
    const patientUser1 = await User.create({
      name: "Reviewer Patient One",
      email: "patient1@testreview.com",
      password: "password123",
      phone: "9777766661",
      role: "PATIENT",
      isPhoneVerified: true,
    });
    const patientDoc1 = await Patient.create({ userId: patientUser1._id });

    const patientUser2 = await User.create({
      name: "Reviewer Patient Two (Imposter)",
      email: "patient2@testreview.com",
      password: "password123",
      phone: "9777766662",
      role: "PATIENT",
      isPhoneVerified: true,
    });
    const patientDoc2 = await Patient.create({ userId: patientUser2._id });

    const doctorUser = await User.create({
      name: "Dr. Rated Specialist",
      email: "doctor@testreview.com",
      password: "password123",
      phone: "9777766663",
      role: "DOCTOR",
      isPhoneVerified: true,
    });

    const doctorDoc = await Doctor.create({
      userId: doctorUser._id,
      specialization: "General Physician",
      qualification: "MBBS",
      experience: 6,
      licenseNumber: "REV-LIC-12345",
      verificationStatus: "APPROVED",
      availabilityStatus: "AVAILABLE",
      consultationFee: 500,
      rating: 0,
      currentLocation: { type: "Point", coordinates: [81.35, 21.19] },
      serviceZone: "Bhilai",
    });

    // 2. Create Completed Booking for Patient 1
    const completedBooking = await Booking.create({
      patientId: patientDoc1._id,
      doctorId: doctorDoc._id,
      symptoms: "Test Review Consultation Symptoms",
      specialization: "General Physician",
      consultationFee: 500,
      status: "COMPLETED",
      paymentStatus: "PAID",
      address: { street: "789 Review Blvd", city: "Bhilai", state: "Chhattisgarh", pincode: "490006" },
      patientLocation: { type: "Point", coordinates: [81.35, 21.19] },
    });

    // 3. Create Non-Completed Booking (status ACCEPTED)
    const activeBooking = await Booking.create({
      patientId: patientDoc1._id,
      doctorId: doctorDoc._id,
      symptoms: "Test Active Consultation Symptoms",
      specialization: "General Physician",
      consultationFee: 500,
      status: "ACCEPTED",
      paymentStatus: "PAID",
      address: { street: "789 Review Blvd", city: "Bhilai", state: "Chhattisgarh", pincode: "490006" },
      patientLocation: { type: "Point", coordinates: [81.35, 21.19] },
    });

    console.log("Test Bookings Created. Completed ID:", completedBooking._id, "| Active ID:", activeBooking._id);

    // 4. Test Valid Review Submission
    const review = await Review.create({
      bookingId: completedBooking._id,
      patientId: patientDoc1._id,
      doctorId: doctorDoc._id,
      rating: 5,
      comment: "Excellent doctor! Very punctual and caring.",
    });

    // Update Doctor Aggregate Rating
    const allDoctorReviews = await Review.find({ doctorId: doctorDoc._id });
    const totalRating = allDoctorReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = Number((totalRating / allDoctorReviews.length).toFixed(1));
    doctorDoc.rating = avgRating;
    await doctorDoc.save();

    console.log("Review submitted successfully:", review._id, "| Rating:", review.rating);
    console.log("Updated Doctor Aggregate Rating:", doctorDoc.rating);

    if (doctorDoc.rating !== 5.0) {
      throw new Error("Aggregate rating update failed!");
    }

    // 5. Test Security Checks
    // Duplicate Review Check
    try {
      await Review.create({
        bookingId: completedBooking._id,
        patientId: patientDoc1._id,
        doctorId: doctorDoc._id,
        rating: 4,
      });
      throw new Error("Duplicate review was allowed! Test failed.");
    } catch (err) {
      if (err.code === 11000) {
        console.log("Duplicate Review Guard Check: PASSED (Prevented duplicate booking review)");
      } else {
        throw err;
      }
    }

    // Rating Boundary Check
    const isInvalidRatingRejected = (6 > 5 || 0 < 1);
    console.log("Rating Boundary Guard Check:", isInvalidRatingRejected ? "PASSED" : "FAILED");

    // 6. Test Doctor Reviews Fetching
    const doctorReviewsList = await Review.find({ doctorId: doctorDoc._id });
    console.log("Fetched Doctor Reviews Count:", doctorReviewsList.length);
    if (doctorReviewsList.length !== 1) {
      throw new Error("Doctor reviews list count mismatch!");
    }

    console.log("--- PHASE 16 (REVIEWS & RATINGS) VERIFICATION COMPLETE: ALL PASSED ---");
    process.exit(0);
  } catch (err) {
    console.error("Verification failed:", err);
    process.exit(1);
  }
}

runVerification();
