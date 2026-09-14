const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    // ==================================================
    // PATIENT
    // ==================================================

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },

    // ==================================================
    // ASSIGNED DOCTOR
    // ==================================================

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      default: null,
      index: true,
    },

    // ==================================================
    // REQUEST DETAILS
    // ==================================================

    symptoms: {
      type: String,
      required: [true, "Symptoms are required"],
      trim: true,
      maxlength: 2000,
    },

    specializationRequired: {
      type: String,
      trim: true,
      default: null,
    },

    // ==================================================
    // PATIENT ADDRESS
    // ==================================================

    address: {
      street: {
        type: String,
        trim: true,
        default: null,
      },

      area: {
        type: String,
        trim: true,
        default: null,
      },

      city: {
        type: String,
        trim: true,
        default: null,
      },

      state: {
        type: String,
        trim: true,
        default: null,
      },

      pincode: {
        type: String,
        trim: true,
        default: null,
      },
    },

    // ==================================================
    // PATIENT LOCATION
    // ==================================================

    patientLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },

      coordinates: {
        type: [Number],
        required: true,
      },
    },

    // ==================================================
    // CONSULTATION
    // ==================================================

    consultationFee: {
      type: Number,
      required: true,
      min: 0,
    },

    // ==================================================
    // BOOKING STATUS
    // ==================================================

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
        "REJECTED",
        "EXPIRED",
        "CANCELLED",
        "MATCHING_FAILED",
      ],
      default: "REQUESTED",
      index: true,
    },

    // ==================================================
    // PAYMENT
    // ==================================================

    paymentStatus: {
      type: String,
      enum: [
        "PENDING",
        "PAID",
        "FAILED",
        "REFUNDED",
      ],
      default: "PENDING",
      index: true,
    },

    paymentId: {
      type: String,
      default: null,
    },

    // ==================================================
    // MATCHING
    // ==================================================

    requestedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    matchingStartedAt: {
      type: Date,
      default: null,
    },

    responseDeadline: {
      type: Date,
      default: null,
    },

    dispatchAttempt: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxDispatchAttempts: {
      type: Number,
      default: 5,
      min: 1,
      max: 20,
    },

    // ==================================================
    // MATCHED DOCTOR DATA
    // ==================================================

    matchScore: {
      type: Number,
      default: null,
    },

    distanceKm: {
      type: Number,
      default: null,
    },

    etaMinutes: {
      type: Number,
      default: null,
    },

    estimatedArrival: {
      type: Date,
      default: null,
    },

    // ==================================================
    // DOCTOR TRIP LOCATION SNAPSHOT
    // ==================================================

    doctorLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },

    // ==================================================
    // MATCHING CANDIDATES
    // ==================================================

    matchingCandidates: [
      {
        doctorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Doctor",
        },

        distanceKm: {
          type: Number,
        },

        etaMinutes: {
          type: Number,
        },

        matchScore: {
          type: Number,
        },

        specializationScore: {
          type: Number,
        },

        ratingScore: {
          type: Number,
        },

        responseScore: {
          type: Number,
        },

        dispatchedAt: {
          type: Date,
          default: null,
        },

        respondedAt: {
          type: Date,
          default: null,
        },

        response: {
          type: String,
          enum: [
            "PENDING",
            "ACCEPTED",
            "REJECTED",
            "TIMEOUT",
          ],
          default: "PENDING",
        },
      },
    ],

    // ==================================================
    // ACCEPTANCE
    // ==================================================

    acceptedAt: {
      type: Date,
      default: null,
    },

    // ==================================================
    // COMPLETION
    // ==================================================

    completedAt: {
      type: Date,
      default: null,
    },

    // ==================================================
    // PRESCRIPTION
    // ==================================================

    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription",
      default: null,
    },

    // ==================================================
    // CANCELLATION
    // ==================================================

    cancellationReason: {
      type: String,
      default: null,
    },
  },

  {
    timestamps: true,
  }
);

// ======================================================
// INDEXES
// ======================================================

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

bookingSchema.index({
  responseDeadline: 1,
  status: 1,
});

// ======================================================
// MODEL
// ======================================================

module.exports = mongoose.model("Booking", bookingSchema);