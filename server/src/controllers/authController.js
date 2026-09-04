const User = require("../models/User");
const OTP = require("../models/OTP");
const Doctor = require("../models/Doctor");

const { hashPassword, comparePassword } = require("../utils/password");
const { generateAccessToken } = require("../utils/jwt");
const generateOTP = require("../utils/otp");

const sendToken = (res, user, statusCode = 200) => {
  const token = generateAccessToken(user);

  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
  });

  return res.status(statusCode).json({
    success: true,
    message: "Authentication successful",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
};

// ==========================================
// Patient Registration
// ==========================================

const registerPatient = async (req, res, next) => {
  try {
    const { name, email, phone, password, address } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone and password are required",
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

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "PATIENT",
      address,
      isVerified: false,
    });

    const otp = generateOTP();

    await OTP.deleteMany({
      phone,
      purpose: "REGISTRATION",
    });

    await OTP.create({
      phone,
      otp,
      purpose: "REGISTRATION",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    console.log(`[DEV OTP] Patient ${phone}: ${otp}`);

    return res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your OTP.",
      userId: user._id,
      ...(process.env.NODE_ENV !== "production" && {
        developmentOTP: otp,
      }),
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Verify Patient OTP
// ==========================================

const verifyPatientOTP = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    const otpRecord = await OTP.findOne({
      phone,
      purpose: "REGISTRATION",
      verified: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP not found or expired",
      });
    }

    if (otpRecord.attempts >= 5) {
      return res.status(429).json({
        success: false,
        message: "Too many OTP attempts",
      });
    }

    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    otpRecord.verified = true;
    await otpRecord.save();

    const user = await User.findOneAndUpdate(
      { phone, role: "PATIENT" },
      { isVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Patient account not found",
      });
    }

    return sendToken(res, user);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Login
// ==========================================

const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone and password are required",
      });
    }

    const user = await User.findOne({ phone }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone or password",
      });
    }

    const passwordMatch = await comparePassword(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    if (user.role === "PATIENT" && !user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your phone number first",
      });
    }

    if (user.role === "DOCTOR") {
      const doctor = await Doctor.findOne({ userId: user._id });

      if (!doctor || doctor.verificationStatus !== "APPROVED") {
        return res.status(403).json({
          success: false,
          message: "Doctor account is awaiting admin verification",
        });
      }
    }

    user.lastLoginAt = new Date();
    await user.save();

    return sendToken(res, user);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Current User
// ==========================================

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        address: user.address,
        location: user.location,
        isVerified: user.isVerified,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Logout
// ==========================================

const logout = (req, res) => {
  res.clearCookie("accessToken");

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

module.exports = {
  registerPatient,
  verifyPatientOTP,
  login,
  getMe,
  logout,
};