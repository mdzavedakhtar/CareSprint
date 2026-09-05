const mongoose = require("mongoose");

// ======================================================
// VERIFICATION DOCUMENT SCHEMA
// ======================================================

const verificationDocumentSchema = new mongoose.Schema(
  {
    documentType: {
      type: String,
      enum: [
        "MEDICAL_LICENSE",
        "DEGREE_CERTIFICATE",
        "IDENTITY_PROOF",
        "OTHER",
      ],
      required: true,
    },

    documentNumber: {
      type: String,
      trim: true,
      default: null,
    },

    documentUrl: {
      type: String,
      trim: true,
      default: null,
    },

    documentName: {
      type: String,
      trim: true,
      default: null,
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
  }
);

// ======================================================
// DOCTOR SCHEMA
// ======================================================

const doctorSchema = new mongoose.Schema(
  {
    // --------------------------------------------------
    // USER REFERENCE
    // --------------------------------------------------

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // --------------------------------------------------
    // PROFESSIONAL DETAILS
    // --------------------------------------------------

    specialization: {
      type: String,
      required: [true, "Specialization is required"],
      trim: true,
    },

    qualification: {
      type: String,
      required: [true, "Qualification is required"],
      trim: true,
    },

    experience: {
      type: Number,
      required: [true, "Experience is required"],
      min: 0,
      max: 60,
    },

    consultationFee: {
      type: Number,
      required: [true, "Consultation fee is required"],
      min: 0,
    },

    licenseNumber: {
      type: String,
      required: [true, "Medical license number is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },

    // --------------------------------------------------
    // VERIFICATION
    // --------------------------------------------------

    verificationStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },

    verificationDocuments: {
      type: [verificationDocumentSchema],
      default: [],
    },

    verificationNotes: {
      type: String,
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // --------------------------------------------------
    // AVAILABILITY
    // --------------------------------------------------

    availabilityStatus: {
      type: String,
      enum: ["OFFLINE", "AVAILABLE", "BUSY"],
      default: "OFFLINE",
      index: true,
    },

    // --------------------------------------------------
    // SERVICE AREA
    // --------------------------------------------------

    serviceRadius: {
      type: Number,
      default: 10,
      min: 1,
      max: 50,
    },

    // --------------------------------------------------
    // RATING
    // --------------------------------------------------

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    // --------------------------------------------------
    // DOCTOR LOCATION
    // --------------------------------------------------

    location: {
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
  },

  {
    timestamps: true,
  }
);

// ======================================================
// INDEXES
// ======================================================

doctorSchema.index({
  location: "2dsphere",
});

doctorSchema.index({
  verificationStatus: 1,
  availabilityStatus: 1,
});

doctorSchema.index({
  specialization: 1,
  verificationStatus: 1,
});

// ======================================================
// MODEL
// ======================================================

module.exports = mongoose.model("Doctor", doctorSchema);