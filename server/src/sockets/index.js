const socketAuthMiddleware = require("./socketAuth");
const { setIO, isAuthorizedForBookingRoom } = require("./socketService");

/**
 * Socket.IO initialization and event listeners for CareSprint.
 */
const initializeSockets = (io) => {
  setIO(io);

  // Apply JWT Authentication Middleware
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const { userId, role, name } = socket.user;
    console.log(`[Socket.IO] Authenticated connection: ${name} (${role}) - Socket ID: ${socket.id}`);

    // Automatically join personal user room for targeted notifications & dispatches
    const userRoom = `user:${userId}`;
    socket.join(userRoom);
    console.log(`[Socket.IO] User ${userId} joined personal room ${userRoom}`);

    // Event: Join Booking Room with Authorization Guard
    socket.on("join_booking_room", async (data, callback) => {
      const bookingId = typeof data === "string" ? data : data?.bookingId;

      if (!bookingId) {
        if (typeof callback === "function") {
          callback({ success: false, message: "Booking ID is required" });
        }
        return;
      }

      const authorized = await isAuthorizedForBookingRoom(userId, role, bookingId);

      if (!authorized) {
        console.warn(`[Socket.IO] Unauthorized room join attempt by user ${userId} for booking ${bookingId}`);
        socket.emit("error_message", {
          code: "UNAUTHORIZED_ROOM_ACCESS",
          message: "You are not authorized to join this booking room",
        });
        if (typeof callback === "function") {
          callback({ success: false, message: "Unauthorized room access" });
        }
        return;
      }

      const bookingRoom = `booking:${bookingId}`;
      socket.join(bookingRoom);
      console.log(`[Socket.IO] User ${userId} joined authorized room ${bookingRoom}`);

      if (typeof callback === "function") {
        callback({ success: true, room: bookingRoom });
      }
    });

    // Event: Leave Booking Room
    socket.on("leave_booking_room", (data) => {
      const bookingId = typeof data === "string" ? data : data?.bookingId;
      if (bookingId) {
        const bookingRoom = `booking:${bookingId}`;
        socket.leave(bookingRoom);
        console.log(`[Socket.IO] User ${userId} left room ${bookingRoom}`);
      }
    });

    // Disconnect handling
    socket.on("disconnect", (reason) => {
      console.log(`[Socket.IO] Disconnected ${name} (${socket.id}): ${reason}`);
    });
  });

  return io;
};

module.exports = {
  initializeSockets,
};
