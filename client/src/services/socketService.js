import { io } from "socket.io-client";

let socket = null;
let currentBookingRoom = null;

const SOCKET_SERVER_URL =
  import.meta.env.VITE_SOCKET_SERVER_URL ||
  import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/v1\/?$/, "") ||
  "http://localhost:5000";

/**
 * Initialize Socket.IO connection with JWT token.
 */
export const connectSocket = (token) => {
  if (socket && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_SERVER_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log(`[Socket.IO Client] Connected with ID: ${socket.id}`);
    if (currentBookingRoom) {
      joinBookingRoom(currentBookingRoom);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`[Socket.IO Client] Disconnected: ${reason}`);
  });

  socket.on("connect_error", (error) => {
    console.warn(`[Socket.IO Client] Connection error: ${error.message}`);
  });

  return socket;
};

/**
 * Get active socket instance.
 */
export const getSocket = () => socket;

/**
 * Disconnect socket cleanly.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentBookingRoom = null;
  }
};

/**
 * Join an authorized booking room.
 */
export const joinBookingRoom = (bookingId) => {
  if (!bookingId) return;
  currentBookingRoom = bookingId;

  if (socket && socket.connected) {
    socket.emit("join_booking_room", { bookingId }, (response) => {
      if (response?.success) {
        console.log(`[Socket.IO Client] Successfully joined room: ${response.room}`);
      } else {
        console.warn(`[Socket.IO Client] Failed to join room: ${response?.message}`);
      }
    });
  }
};

/**
 * Leave a booking room.
 */
export const leaveBookingRoom = (bookingId) => {
  if (socket && socket.connected && bookingId) {
    socket.emit("leave_booking_room", { bookingId });
    if (currentBookingRoom === bookingId) {
      currentBookingRoom = null;
    }
  }
};

/**
 * Attach listener for real-time domain events.
 */
export const subscribeToEvent = (eventName, callback) => {
  if (!socket) return () => {};

  socket.on(eventName, callback);

  return () => {
    socket.off(eventName, callback);
  };
};

export default {
  connectSocket,
  getSocket,
  disconnectSocket,
  joinBookingRoom,
  leaveBookingRoom,
  subscribeToEvent,
};
