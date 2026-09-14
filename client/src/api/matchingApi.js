import api from "../services/api";

export const createBookingAndMatch = async (bookingData) => {
  const response = await api.post("/matching/bookings", bookingData);
  return response.data;
};

export const getMatchingStatus = async (bookingId) => {
  const response = await api.get(`/matching/bookings/${bookingId}/matching`);
  return response.data;
};

export default {
  createBookingAndMatch,
  getMatchingStatus,
};