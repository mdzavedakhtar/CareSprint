const User = require("../models/User");
const Doctor = require("../models/Doctor");
const { hashPassword } = require("../utils/password");

const registerDoctor = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      specialization,
      qualification,
      experience,
      consultationFee,
      licenseNumber,
      address,
    } = req.body;

    if (
      !name ||
      !email ||
      !phone ||
      !password ||
      !specialization ||
      !qualification ||
      experience === undefined ||
      consultationFee === undefined ||
      !licenseNumber
    ) {
      return res.status(400).json({
        success: false,
        message: "All required doctor details must be provided",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email or phone already exists",
      });
    }

    const existingDoctor = await Doctor.findOne({
      licenseNumber: licenseNumber.toUpperCase(),
    });

    if (existingDoctor) {
      return res.status(409).json({
        success: false,
        message: "Doctor with this license number already exists",
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "DOCTOR",
      address,
      isVerified: true,
    });

    await Doctor.create({
      userId: user._id,
      specialization,
      qualification,
      experience,
      consultationFee,
      licenseNumber,
      verificationStatus: "PENDING",
      availabilityStatus: "OFFLINE",
    });

    return res.status(201).json({
      success: true,
      message:
        "Doctor registration submitted successfully. Awaiting admin verification.",
      userId: user._id,
      verificationStatus: "PENDING",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerDoctor,
};