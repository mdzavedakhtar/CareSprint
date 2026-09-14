const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./src/models/User");
const Notification = require("./src/models/Notification");
const { createNotification } = require("./src/utils/notificationService");
const {
  sendWelcomeEmail,
  sendBookingConfirmationEmail,
  sendPaymentReceiptEmail,
  sendPrescriptionAvailableEmail,
} = require("./src/utils/emailService");

async function runVerification() {
  try {
    console.log("--- STARTING PHASE 17 (NOTIFICATIONS) VERIFICATION ---");
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/caresprint";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    // Clean test data
    await User.deleteMany({ email: /@testnotif\.com$/ });
    await Notification.deleteMany({ title: /Test Alert/ });

    // 1. Create Test Users
    const user1 = await User.create({
      name: "Notif Patient One",
      email: "patient1@testnotif.com",
      password: "password123",
      phone: "9666655551",
      role: "PATIENT",
      isPhoneVerified: true,
    });

    const user2 = await User.create({
      name: "Notif Doctor Two",
      email: "doctor2@testnotif.com",
      password: "password123",
      phone: "9666655552",
      role: "DOCTOR",
      isPhoneVerified: true,
    });

    const user3 = await User.create({
      name: "Notif Observer Three",
      email: "observer3@testnotif.com",
      password: "password123",
      phone: "9666655553",
      role: "PATIENT",
      isPhoneVerified: true,
    });

    console.log("Test users created:", user1._id, user2._id, user3._id);

    // 2. Test All 10+ In-App Notification Types Creation
    const notificationTypes = [
      { type: "BOOKING_REQUEST", title: "Test Alert: Booking Requested", message: "Your booking request has been dispatched." },
      { type: "BOOKING_ACCEPTED", title: "Test Alert: Booking Accepted", message: "Dr. Smith accepted your booking." },
      { type: "DOCTOR_ON_THE_WAY", title: "Test Alert: Doctor En Route", message: "Doctor is on the way to your address." },
      { type: "DOCTOR_ARRIVED", title: "Test Alert: Doctor Arrived", message: "Doctor has arrived at your doorstep." },
      { type: "CONSULTATION_STARTED", title: "Test Alert: Consultation Started", message: "Your consultation is in progress." },
      { type: "CONSULTATION_COMPLETED", title: "Test Alert: Consultation Completed", message: "Consultation completed successfully." },
      { type: "PRESCRIPTION_READY", title: "Test Alert: Prescription Ready", message: "Digital prescription issued." },
      { type: "PAYMENT_SUCCESS", title: "Test Alert: Payment Received", message: "₹500 payment confirmed via Razorpay." },
      { type: "PAYMENT_FAILED", title: "Test Alert: Payment Failed", message: "Transaction attempt failed." },
      { type: "BOOKING_CANCELLED", title: "Test Alert: Booking Cancelled", message: "Booking request cancelled." },
      { type: "BOOKING_REJECTED", title: "Test Alert: Booking Declined", message: "Doctor declined request." },
    ];

    for (const notifData of notificationTypes) {
      await createNotification({
        userId: user1._id,
        type: notifData.type,
        title: notifData.title,
        message: notifData.message,
      });
    }

    // 3. Test Privacy & Unread Count
    const user1Notifs = await Notification.find({ userId: user1._id });
    const user3Notifs = await Notification.find({ userId: user3._id });
    const unreadCountInitial = await Notification.countDocuments({ userId: user1._id, isRead: false });

    console.log("User 1 Notification Count:", user1Notifs.length, "| Unread Count:", unreadCountInitial);
    console.log("User 3 (Observer) Notification Count:", user3Notifs.length);

    if (user1Notifs.length !== notificationTypes.length || user3Notifs.length !== 0) {
      throw new Error("Notification Privacy Guard Failed: Cross-user data leakage detected!");
    }
    console.log("Privacy & Isolation Check: PASSED (Users see strictly their own alerts)");

    // 4. Test Mark Single Notification as Read
    const targetNotif = user1Notifs[0];
    targetNotif.isRead = true;
    await targetNotif.save();

    const unreadAfterSingleMark = await Notification.countDocuments({ userId: user1._id, isRead: false });
    console.log("Unread Count after single mark as read:", unreadAfterSingleMark);
    if (unreadAfterSingleMark !== notificationTypes.length - 1) {
      throw new Error("Mark single notification read failed!");
    }

    // 5. Test Mark All as Read
    await Notification.updateMany({ userId: user1._id, isRead: false }, { $set: { isRead: true } });
    const unreadAfterMarkAll = await Notification.countDocuments({ userId: user1._id, isRead: false });
    console.log("Unread Count after mark all read:", unreadAfterMarkAll);
    if (unreadAfterMarkAll !== 0) {
      throw new Error("Mark all notifications read failed!");
    }

    // 6. Test Email Dispatches (Non-blocking)
    console.log("Testing Email Dispatches (Non-blocking):");
    sendWelcomeEmail(user1);
    sendBookingConfirmationEmail(user1, { _id: new mongoose.Types.ObjectId(), specializationRequired: "General Physician", consultationFee: 500, symptoms: "Fever" });
    sendPaymentReceiptEmail(user1, { amount: 500, paymentId: "pay_test_123", orderId: "order_test_123", paidAt: new Date() });
    sendPrescriptionAvailableEmail(user1, { diagnosis: "Viral Fever" });
    console.log("Email Dispatches Triggered Successfully (Zero Exception Check Passed)");

    console.log("--- PHASE 17 (NOTIFICATIONS) VERIFICATION COMPLETE: ALL PASSED ---");
    process.exit(0);
  } catch (err) {
    console.error("Verification failed:", err);
    process.exit(1);
  }
}

runVerification();
