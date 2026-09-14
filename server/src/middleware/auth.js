const User = require("../models/User");
const { verifyAccessToken } = require("../utils/jwt");

const protect = async (req, res, next) => {
  try {
    let token = null;

    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");

      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const decoded = verifyAccessToken(token);
    const userId = decoded.userId || decoded.id || decoded._id;

    // Active User Check: Ensure account was not suspended or deactivated
    const activeUser = await User.findById(userId).select("role isActive");
    if (!activeUser || activeUser.isActive === false) {
      return res.status(401).json({
        success: false,
        message: "Your account is inactive or suspended. Please contact support.",
      });
    }

    req.user = {
      ...decoded,
      role: activeUser.role, // Enforce role from DB to prevent role spoofing
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this resource",
      });
    }

    next();
  };
};

const Doctor = require("../models/Doctor");

const requireDoctorApproval = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "DOCTOR") {
      return res.status(403).json({
        success: false,
        message: "Doctor authorization required",
      });
    }

    const doctor = await Doctor.findOne({
      userId: req.user.userId || req.user.id || req.user._id,
    });

    if (!doctor || doctor.verificationStatus !== "APPROVED") {
      return res.status(403).json({
        success: false,
        message: "Doctor account is awaiting admin verification",
      });
    }

    req.doctor = doctor;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect,
  authorize,
  requireDoctorApproval,
};