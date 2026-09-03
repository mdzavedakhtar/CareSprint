const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: ["PATIENT", "DOCTOR", "ADMIN"],
      required: true,
      default: "PATIENT",
    },

    profileImage: {
      type: String,
      default: null,
    },

    address: {
      street: {
        type: String,
        trim: true,
      },

      area: {
        type: String,
        trim: true,
      },

      city: {
        type: String,
        enum: ["BHILAI", "DURG", "RAIPUR"],
      },

      state: {
        type: String,
        default: "Chhattisgarh",
      },

      pincode: {
        type: String,
        trim: true,
      },
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
  },
  {
    timestamps: true,
  }
);

userSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("User", userSchema);