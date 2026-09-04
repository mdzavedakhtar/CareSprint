const Doctor = require("../models/Doctor");
const User = require("../models/User");

const getPendingDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find({
      verificationStatus: "PENDING",
    })
      .populate("userId", "name email phone role profileImage address")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: doctors.length,
      doctors,
    });
  } catch (error) {
    next(error);
  }
};

const approveDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    if (doctor.verificationStatus === "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Doctor is already approved",
      });
    }

    doctor.verificationStatus = "APPROVED";
    doctor.verificationNotes = null;
    doctor.verifiedAt = new Date();
    doctor.verifiedBy = req.user.userId;

    await doctor.save();

    await User.findByIdAndUpdate(doctor.userId, {
      isActive: true,
      isVerified: true,
    });

    return res.status(200).json({
      success: true,
      message: "Doctor approved successfully",
      doctor: {
        id: doctor._id,
        verificationStatus: doctor.verificationStatus,
        verifiedAt: doctor.verifiedAt,
        verifiedBy: doctor.verifiedBy,
      },
    });
  } catch (error) {
    next(error);
  }
};

const rejectDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason must be at least 5 characters",
      });
    }

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    if (doctor.verificationStatus === "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Approved doctor cannot be rejected",
      });
    }

    doctor.verificationStatus = "REJECTED";
    doctor.verificationNotes = reason.trim();
    doctor.verifiedAt = new Date();
    doctor.verifiedBy = req.user.userId;

    await doctor.save();

    await User.findByIdAndUpdate(doctor.userId, {
      isActive: false,
    });

    return res.status(200).json({
      success: true,
      message: "Doctor rejected successfully",
      doctor: {
        id: doctor._id,
        verificationStatus: doctor.verificationStatus,
        verificationNotes: doctor.verificationNotes,
        verifiedAt: doctor.verifiedAt,
        verifiedBy: doctor.verifiedBy,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingDoctors,
  approveDoctor,
  rejectDoctor,
};