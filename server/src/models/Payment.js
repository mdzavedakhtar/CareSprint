const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    provider: {
      type: String,
      enum: ["RAZORPAY"],
      default: "RAZORPAY",
    },

    orderId: {
      type: String,
      unique: true,
      sparse: true,
    },

    paymentId: {
      type: String,
      unique: true,
      sparse: true,
    },

    signature: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "CREATED",
        "PENDING",
        "SUCCESS",
        "FAILED",
        "REFUNDED",
      ],
      default: "CREATED",
      index: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({
  patientId: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Payment", paymentSchema);