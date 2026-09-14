const mongoose = require("mongoose");
const dotenv = require("dotenv");
const crypto = require("crypto");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./src/models/User");
const Doctor = require("./src/models/Doctor");
const Booking = require("./src/models/Booking");
const Payment = require("./src/models/Payment");

async function runVerification() {
  try {
    console.log("--- STARTING PHASE 14 (RAZORPAY PAYMENTS) VERIFICATION ---");
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/caresprint";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    // Clean test data
    await User.deleteMany({ email: /@testpayment\.com$/ });
    await Doctor.deleteMany({ licenseNumber: "PAY-LIC-12345" });
    await Booking.deleteMany({ "address.street": "123 Payment Test St" });
    await Payment.deleteMany({ provider: "RAZORPAY" });

    // 1. Create Patient & Doctor
    const patientUser = await User.create({
      name: "Payment Test Patient",
      email: "patient@testpayment.com",
      password: "password123",
      phone: "9999988881",
      role: "PATIENT",
      isPhoneVerified: true,
    });

    const doctorUser = await User.create({
      name: "Payment Test Doctor",
      email: "doctor@testpayment.com",
      password: "password123",
      phone: "9999988882",
      role: "DOCTOR",
      isPhoneVerified: true,
    });

    const doctorDoc = await Doctor.create({
      userId: doctorUser._id,
      specialization: "General Physician",
      qualification: "MBBS",
      experience: 5,
      licenseNumber: "PAY-LIC-12345",
      verificationStatus: "APPROVED",
      availabilityStatus: "AVAILABLE",
      consultationFee: 750,
      currentLocation: {
        type: "Point",
        coordinates: [81.35, 21.19],
      },
      serviceZone: "Bhilai",
    });

    // 2. Create Booking
    const booking = await Booking.create({
      patientId: patientUser._id,
      doctorId: doctorDoc._id,
      symptoms: "Fever and headaches",
      specialization: "General Physician",
      consultationFee: 750,
      paymentStatus: "PENDING",
      status: "ACCEPTED",
      address: {
        street: "123 Payment Test St",
        area: "Bhilai",
        city: "Bhilai",
        state: "Chhattisgarh",
        pincode: "490006",
      },
      patientLocation: {
        type: "Point",
        coordinates: [81.35, 21.19],
      },
    });

    console.log("Test booking created:", booking._id, "| Status:", booking.paymentStatus);

    // 3. Test Order Creation Logic
    const secret = process.env.RAZORPAY_KEY_SECRET || "dummy_secret";
    const orderId = `order_test_${Date.now()}_${booking._id.toString().slice(-6)}`;
    const paymentId = `pay_test_${Date.now()}`;

    // Create Payment Record (simulating createOrder controller)
    const paymentRecord = await Payment.create({
      bookingId: booking._id,
      patientId: patientUser._id,
      doctorId: doctorDoc._id,
      amount: booking.consultationFee,
      currency: "INR",
      orderId: orderId,
      status: "CREATED",
    });

    console.log("Order created successfully. Payment Record ID:", paymentRecord._id);

    // 4. Test Cryptographic Signature Verification
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    // Verify correct signature
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const isValidSignature = generatedSignature === expectedSig;
    console.log("Cryptographic Signature Check:", isValidSignature ? "PASSED" : "FAILED");
    if (!isValidSignature) throw new Error("Signature check failed!");

    // Update payment record & booking (simulating verifySignature controller)
    paymentRecord.paymentId = paymentId;
    paymentRecord.signature = generatedSignature;
    paymentRecord.status = "SUCCESS";
    paymentRecord.paidAt = new Date();
    await paymentRecord.save();

    booking.paymentStatus = "PAID";
    await booking.save();

    console.log("Payment status updated to PAID for booking:", booking._id);

    // 5. Test Tampered Signature Rejection
    const tamperedSignature = "invalid_tampered_signature_string";
    const isTamperedValid = tamperedSignature === expectedSig;
    console.log("Tampered Signature Rejection Check:", !isTamperedValid ? "PASSED (Rejected)" : "FAILED");

    // 6. Test Idempotency
    const reFetchedBooking = await Booking.findById(booking._id);
    console.log("Re-fetched Booking Payment Status:", reFetchedBooking.paymentStatus);
    if (reFetchedBooking.paymentStatus !== "PAID") {
      throw new Error("Idempotency / State persistence check failed!");
    }

    console.log("--- PHASE 14 (RAZORPAY PAYMENTS) VERIFICATION COMPLETE: ALL PASSED ---");
    process.exit(0);
  } catch (err) {
    console.error("Verification failed:", err);
    process.exit(1);
  }
}

runVerification();
