const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },

    symptoms: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    address: {
      street: String,
      area: String,
      city: {
        type: String,
        enum: ["BHILAI", "DURG", "RAIPUR"],
        required: true,
      },
      state: {
        type: String,
        default: "Chhattisgarh",
      },
      pincode: String,
      landmark: String,
    },

    patientLocation: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },

      coordinates: {
        type: [Number],
        required: true,
      },
    },

    doctorLocation: {
      type: {
        type: String,
        enum: ["Point"],
      },

      coordinates: {
        type: [Number],
      },
    },

    status: {
      type: String,
      enum: [
        "REQUESTED",
        "MATCHING",
        "ACCEPTED",
        "DOCTOR_ON_THE_WAY",
        "ARRIVED",
        "CONSULTATION",
        "COMPLETED",
        "CANCELLED",
        "EXPIRED",
        "NO_DOCTOR_FOUND",
      ],
      default: "REQUESTED",
      index: true,
    },

    consultationFee: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: [
        "PENDING",
        "PROCESSING",
        "PAID",
        "FAILED",
        "REFUNDED",
      ],
      default: "PENDING",
      index: true,
    },

    estimatedArrival: {
      type: Number,
      default: null,
    },

    requestedAt: {
      type: Date,
      default: Date.now,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription",
      default: null,
    },

    cancellationReason: {
      type: String,
      maxlength: 500,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({
  patientId: 1,
  createdAt: -1,
});

bookingSchema.index({
  doctorId: 1,
  status: 1,
  createdAt: -1,
});

bookingSchema.index({
  status: 1,
  requestedAt: -1,
});

bookingSchema.index({
  patientLocation: "2dsphere",
});

module.exports = mongoose.model("Booking", bookingSchema);