/**
 * Asynchronous Email Dispatch Service for CareSprint
 * Safe non-blocking execution: Failures log warning but NEVER crash transactions.
 */

let nodemailer;
try {
  nodemailer = require("nodemailer");
} catch (_err) {
  nodemailer = null;
}

const createTransporter = () => {
  if (!nodemailer) return null;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendMailAsync = async ({ to, subject, html, text }) => {
  setTimeout(async () => {
    try {
      if (!to) return;
      const transporter = createTransporter();
      const from = process.env.EMAIL_FROM || "CareSprint Healthcare <no-reply@caresprint.com>";

      if (transporter) {
        await transporter.sendMail({ from, to, subject, html, text });
        console.log(`[EmailService] Sent email to ${to}: ${subject}`);
      } else {
        console.log(`[EmailService - Dev Log] Email to ${to}: "${subject}" (Mock Transporter)`);
      }
    } catch (err) {
      console.warn(`[EmailService Warning] Non-critical email send error for ${to}:`, err.message);
    }
  });
};

// 1. Welcome Email on Registration
const sendWelcomeEmail = (user) => {
  sendMailAsync({
    to: user.email,
    subject: "Welcome to CareSprint Healthcare",
    text: `Hello ${user.name},\n\nWelcome to CareSprint! Your account has been registered successfully.`,
    html: `<div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
      <h2>Welcome to CareSprint Healthcare</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>Thank you for registering with CareSprint. You can now request at-home doctor visits and access instant telemedicine support.</p>
      <p style="color: #64748b; font-size: 12px;">CareSprint Telemedicine Platform</p>
    </div>`,
  });
};

// 2. Booking Confirmation Email
const sendBookingConfirmationEmail = (user, booking) => {
  sendMailAsync({
    to: user.email,
    subject: `Booking Confirmed #${booking._id.toString().slice(-6)} - CareSprint`,
    text: `Your booking for ${booking.specializationRequired || "Doctor Consultation"} has been confirmed. Fee: ₹${booking.consultationFee}`,
    html: `<div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
      <h2 style="color: #2563eb;">Booking Confirmed</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>Your doctor visit request has been accepted and confirmed.</p>
      <ul>
        <li><strong>Booking ID:</strong> #${booking._id}</li>
        <li><strong>Chief Symptoms:</strong> ${booking.symptoms}</li>
        <li><strong>Consultation Fee:</strong> ₹${booking.consultationFee}</li>
      </ul>
      <p>Track your assigned doctor live from your CareSprint mobile/web dashboard.</p>
    </div>`,
  });
};

// 3. Payment Receipt Email
const sendPaymentReceiptEmail = (user, payment) => {
  sendMailAsync({
    to: user.email,
    subject: `Payment Receipt for Booking - CareSprint`,
    text: `Payment of ₹${payment.amount} received. Payment ID: ${payment.paymentId}`,
    html: `<div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
      <h2 style="color: #059669;">Payment Received</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>We received your consultation fee payment of <strong>₹${payment.amount}</strong>.</p>
      <ul>
        <li><strong>Payment ID:</strong> ${payment.paymentId}</li>
        <li><strong>Order ID:</strong> ${payment.orderId}</li>
        <li><strong>Date:</strong> ${new Date(payment.paidAt || Date.now()).toLocaleString()}</li>
      </ul>
      <p>Thank you for choosing CareSprint!</p>
    </div>`,
  });
};

// 4. Prescription Available Email
const sendPrescriptionAvailableEmail = (user, prescription) => {
  sendMailAsync({
    to: user.email,
    subject: `Digital Prescription Ready - CareSprint`,
    text: `Your digital prescription is ready for download in your CareSprint portal.`,
    html: `<div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
      <h2 style="color: #2563eb;">Digital Prescription Available</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>Your doctor has issued a digital prescription for your consultation visit.</p>
      <p><strong>Diagnosis:</strong> ${prescription.diagnosis || "General Consultation"}</p>
      <p>Log in to CareSprint to view, download, or print your complete prescription schedule.</p>
    </div>`,
  });
};

module.exports = {
  sendWelcomeEmail,
  sendBookingConfirmationEmail,
  sendPaymentReceiptEmail,
  sendPrescriptionAvailableEmail,
};
