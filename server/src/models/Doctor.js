const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    specialization: {
      type: String,
      required: true,
      trim: true,
    },

    qualification: {
      type: String,
      required: true,
      trim: true,
    },

    experience: {
      type: Number,
      required: true,
      min: 0,
    },

    consultationFee: {
      type: Number,
      required: true,
      min: 0,
      default: 499,
    },

    licenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    verificationStatus: {
      type: String,
      enum: [
        "PENDING",
        "UNDER_REVIEW",
        "APPROVED",
        "REJECTED",
        "SUSPENDED",
      ],
      default: "PENDING",
    },

    availabilityStatus: {
      type: String,
      enum: ["OFFLINE", "AVAILABLE", "BUSY"],
      default: "OFFLINE",
    },

    serviceRadius: {
      type: Number,
      default: 5,
      min: 1,
      max: 50,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalConsultations: {
      type: Number,
      default: 0,
      min: 0,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
      },

      coordinates: {
        type: [Number],
      },
    },

    verificationDocuments: [
      {
        type: {
          type: String,
          enum: [
            "MEDICAL_LICENSE",
            "DEGREE",
            "IDENTITY_PROOF",
            "OTHER",
          ],
        },

        url: {
          type: String,
          trim: true,
        },

        publicId: {
          type: String,
          trim: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

doctorSchema.index({ location: "2dsphere" });

doctorSchema.index({
  verificationStatus: 1,
  availabilityStatus: 1,
});

doctorSchema.index({
  specialization: 1,
  verificationStatus: 1,
});

module.exports = mongoose.model("Doctor", doctorSchema);