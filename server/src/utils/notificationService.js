const Notification = require("../models/Notification");
const { emitNotificationCreated } = require("../sockets/socketService");

/**
 * Creates an In-App Notification safely.
 * Non-blocking: Errors are logged, but NEVER throw to break core database transactions.
 */
const createNotification = async ({ userId, type, title, message, bookingId = null }) => {
  try {
    if (!userId || !type || !title || !message) {
      console.warn("[NotificationService] Missing required parameters, skipping creation.");
      return null;
    }

    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      bookingId,
      isRead: false,
    });

    // Real-time emission via Socket.IO
    try {
      emitNotificationCreated(userId, notification);
    } catch (socketErr) {
      console.warn("[NotificationService] Socket emit error (non-fatal):", socketErr.message);
    }

    return notification;
  } catch (error) {
    console.error("[NotificationService Error] Failed to create notification (non-fatal):", error);
    return null;
  }
};

module.exports = {
  createNotification,
};
