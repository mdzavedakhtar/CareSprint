import { useEffect, useRef } from "react";
import {
  connectSocket,
  getSocket,
  joinBookingRoom,
  leaveBookingRoom,
  subscribeToEvent,
} from "../services/socketService";

/**
 * Custom React Hook for managing Socket.IO connections & room subscriptions.
 */
export const useSocket = ({ token, bookingId, onEvent } = {}) => {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!token) return;

    const socket = connectSocket(token);

    if (bookingId) {
      joinBookingRoom(bookingId);
    }

    const domainEvents = [
      "BOOKING_REQUESTED",
      "BOOKING_ACCEPTED",
      "BOOKING_REJECTED",
      "DOCTOR_ON_THE_WAY",
      "DOCTOR_ARRIVED",
      "CONSULTATION_STARTED",
      "CONSULTATION_COMPLETED",
      "BOOKING_CANCELLED",
      "PRESCRIPTION_CREATED",
      "DOCTOR_LOCATION_UPDATED",
      "NOTIFICATION_CREATED",
    ];

    const unsubscribers = domainEvents.map((eventName) =>
      subscribeToEvent(eventName, (data) => {
        if (typeof onEventRef.current === "function") {
          onEventRef.current(eventName, data);
        }
      })
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
      if (bookingId) {
        leaveBookingRoom(bookingId);
      }
    };
  }, [token, bookingId]);

  return {
    socket: getSocket(),
    joinBookingRoom,
    leaveBookingRoom,
  };
};

export default useSocket;
