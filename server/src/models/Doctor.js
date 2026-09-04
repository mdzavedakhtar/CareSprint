const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

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

    verificationStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },

    availabilityStatus: {
      type: String,
      enum: ["OFFLINE", "AVAILABLE", "BUSY"],
      default: "OFFLINE",
      index: true,
    },

    serviceRadius: {
      type: Number,
      default: 10,
      min: 1,
      max: 50,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

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