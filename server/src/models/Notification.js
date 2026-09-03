const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "BOOKING_REQUEST",
        "BOOKING_ACCEPTED",
        "DOCTOR_ON_THE_WAY",
        "DOCTOR_ARRIVED",
        "CONSULTATION_COMPLETED",
        "PRESCRIPTION_READY",
        "PAYMENT_SUCCESS",
        "PAYMENT_FAILED",
        "GENERAL",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({
  userId: 1,
  isRead: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "Notification",
  notificationSchema
);