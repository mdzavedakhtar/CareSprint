const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Socket.IO Authentication Middleware.
 * Verifies JWT token from handshake auth or cookies.
 */
const socketAuthMiddleware = async (socket, next) => {
  try {
    let token = socket.handshake.auth?.token;

    if (!token && socket.handshake.headers?.authorization) {
      const authHeader = socket.handshake.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token && socket.handshake.headers?.cookie) {
      const cookieString = socket.handshake.headers.cookie;
      const match = cookieString.match(/(?:^|;\s*)token=([^;]*)/);
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }

    if (!token) {
      return next(new Error("UNAUTHORIZED: Missing authentication token"));
    }

    const secret = process.env.JWT_SECRET || "default_jwt_secret_key";
    const decoded = jwt.verify(token, secret);

    const userId = decoded.userId || decoded.id || decoded._id;
    if (!userId) {
      return next(new Error("UNAUTHORIZED: Invalid token payload"));
    }

    const user = await User.findById(userId).select("-password").lean();
    if (!user || user.isActive === false) {
      return next(new Error("UNAUTHORIZED: User not found or deactivated"));
    }

    socket.user = {
      _id: user._id.toString(),
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("[Socket.IO Auth Error]:", error.message);
    return next(new Error("UNAUTHORIZED: Authentication failed"));
  }
};

module.exports = socketAuthMiddleware;
