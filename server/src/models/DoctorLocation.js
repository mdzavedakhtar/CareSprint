const mongoose = require("mongoose");

const doctorLocationSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      unique: true,
      index: true,
    },

    location: {
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

    isOnline: {
      type: Boolean,
      default: false,
    },

    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

doctorLocationSchema.index({
  location: "2dsphere",
});

module.exports = mongoose.model(
  "DoctorLocation",
  doctorLocationSchema
);