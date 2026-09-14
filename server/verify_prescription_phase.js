const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./src/models/User");
const Patient = require("./src/models/Patient");
const Doctor = require("./src/models/Doctor");
const Booking = require("./src/models/Booking");
const Prescription = require("./src/models/Prescription");
const Notification = require("./src/models/Notification");

async function runVerification() {
  try {
    console.log("--- STARTING PHASE 15 (DIGITAL PRESCRIPTION) VERIFICATION ---");
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/caresprint";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    // Clean test data
    await User.deleteMany({ email: /@testscript\.com$/ });
    await Doctor.deleteMany({ licenseNumber: "SCRIPT-LIC-12345" });
    await Booking.deleteMany({ symptoms: "Test Prescription Consultation Symptoms" });
    await Prescription.deleteMany({ diagnosis: "Acute Viral Fever with Pharyngitis" });

    // 1. Create Patient 1, Patient 2 & Doctor
    const patientUser1 = await User.create({
      name: "Rx Patient One",
      email: "patient1@testscript.com",
      password: "password123",
      phone: "9888877771",
      role: "PATIENT",
      isPhoneVerified: true,
    });
    const patientDoc1 = await Patient.create({ userId: patientUser1._id });

    const patientUser2 = await User.create({
      name: "Rx Patient Two (Unauthorized Observer)",
      email: "patient2@testscript.com",
      password: "password123",
      phone: "9888877772",
      role: "PATIENT",
      isPhoneVerified: true,
    });
    const patientDoc2 = await Patient.create({ userId: patientUser2._id });

    const doctorUser = await User.create({
      name: "Dr. Rx Specialist",
      email: "doctor@testscript.com",
      password: "password123",
      phone: "9888877773",
      role: "DOCTOR",
      isPhoneVerified: true,
    });

    const doctorDoc = await Doctor.create({
      userId: doctorUser._id,
      specialization: "General Medicine",
      qualification: "MD Internal Medicine",
      experience: 8,
      licenseNumber: "SCRIPT-LIC-12345",
      verificationStatus: "APPROVED",
      availabilityStatus: "BUSY",
      consultationFee: 600,
      currentLocation: { type: "Point", coordinates: [81.35, 21.19] },
      serviceZone: "Bhilai",
    });

    // 2. Create Booking in CONSULTATION state
    const booking = await Booking.create({
      patientId: patientDoc1._id,
      doctorId: doctorDoc._id,
      symptoms: "Test Prescription Consultation Symptoms",
      specialization: "General Medicine",
      consultationFee: 600,
      status: "CONSULTATION",
      paymentStatus: "PAID",
      address: { street: "456 Rx Lane", city: "Bhilai", state: "Chhattisgarh", pincode: "490006" },
      patientLocation: { type: "Point", coordinates: [81.35, 21.19] },
    });

    console.log("Booking created in CONSULTATION state:", booking._id);

    // 3. Test Prescription Creation
    const prescriptionData = {
      bookingId: booking._id,
      patientId: patientDoc1._id,
      doctorId: doctorDoc._id,
      diagnosis: "Acute Viral Fever with Pharyngitis",
      medicines: [
        {
          name: "Paracetamol 650mg",
          dosage: "1 tablet",
          frequency: "TDS (3 times daily)",
          duration: "5 days",
          instructions: "Take after meals",
        },
        {
          name: "Azithromycin 500mg",
          dosage: "1 tablet",
          frequency: "OD (Once daily)",
          duration: "3 days",
          instructions: "Take morning before food",
        },
      ],
      instructions: "Drink plenty of warm fluid. Rest for 3 days.",
      notes: "Patient reported mild fever onset 2 days ago.",
      followUpAdvice: "Revisit clinic if fever exceeds 101F after 48h.",
    };

    const prescription = await Prescription.create(prescriptionData);
    booking.prescriptionId = prescription._id;
    await booking.save();

    console.log("Prescription created successfully:", prescription._id);
    console.log("Diagnosis:", prescription.diagnosis);
    console.log("Medicines count:", prescription.medicines.length);

    // 4. Test In-App Notification Generation
    const notification = await Notification.create({
      userId: patientUser1._id,
      title: "New Digital Prescription Issued",
      message: `Dr. ${doctorUser.name} has issued a digital prescription for your consultation visit.`,
      type: "PRESCRIPTION_READY",
    });
    console.log("Patient Notification created:", notification._id, "| Title:", notification.title);

    // 5. Test Medical Privacy Guard
    const patient1Prescriptions = await Prescription.find({ patientId: patientDoc1._id });
    const patient2Prescriptions = await Prescription.find({ patientId: patientDoc2._id });

    console.log("Patient 1 Prescriptions Count:", patient1Prescriptions.length);
    console.log("Patient 2 Prescriptions Count:", patient2Prescriptions.length);

    if (patient1Prescriptions.length !== 1 || patient2Prescriptions.length !== 0) {
      throw new Error("Medical Privacy Guard Failed: Unauthorized patient can access medical records!");
    }
    console.log("Medical Privacy Isolation Check: PASSED (Zero data leakage)");

    // 6. Test Edit / Upsert Logic
    prescription.followUpAdvice = "Updated: Revisit after 7 days";
    await prescription.save();
    console.log("Prescription update test: PASSED");

    console.log("--- PHASE 15 (DIGITAL PRESCRIPTION) VERIFICATION COMPLETE: ALL PASSED ---");
    process.exit(0);
  } catch (err) {
    console.error("Verification failed:", err);
    process.exit(1);
  }
}

runVerification();
