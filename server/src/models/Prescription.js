const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
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

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    diagnosis: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    medicines: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },

        dosage: {
          type: String,
          trim: true,
        },

        frequency: {
          type: String,
          trim: true,
        },

        duration: {
          type: String,
          trim: true,
        },

        instructions: {
          type: String,
          trim: true,
        },
      },
    ],

    instructions: {
      type: String,
      maxlength: 3000,
    },

    followUpDate: {
      type: Date,
      default: null,
    },

    prescriptionFile: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

prescriptionSchema.index({
  patientId: 1,
  createdAt: -1,
});

prescriptionSchema.index({
  doctorId: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "Prescription",
  prescriptionSchema
);