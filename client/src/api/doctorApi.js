import api from "../services/api";

export const getDoctorDashboard = async () => {
  const response = await api.get(
    "/doctor/dashboard"
  );

  return response.data;
};

export const getDoctorProfile = async () => {
  const response = await api.get(
    "/doctor/profile"
  );

  return response.data;
};

export const updateDoctorAvailability = async (
  availabilityStatus
) => {
  const response = await api.patch(
    "/doctor/availability",
    {
      availabilityStatus,
    }
  );

  return response.data;
};

export const getDoctorRequests = async () => {
  const response = await api.get(
    "/doctor/requests"
  );

  return response.data;
};

export const respondToRequest = async (bookingId, action) => {
  const endpoint =
    action === "ACCEPT"
      ? `/doctor/requests/${bookingId}/accept`
      : `/doctor/requests/${bookingId}/reject`;

  const response = await api.patch(endpoint);
  return response.data;
};

export const updateVisitStatus = async (bookingId, status) => {
  let endpoint = `/doctor/visits/${bookingId}/start`;
  if (status === "ARRIVED") {
    endpoint = `/doctor/visits/${bookingId}/arrived`;
  } else if (status === "CONSULTATION") {
    endpoint = `/doctor/visits/${bookingId}/consultation`;
  } else if (status === "COMPLETED") {
    endpoint = `/doctor/visits/${bookingId}/complete`;
  }

  const response = await api.patch(endpoint);
  return response.data;
};

export const createPrescription = async (
  bookingId,
  prescription
) => {
  const response = await api.post(
    `/doctor/visits/${bookingId}/prescription`,
    prescription
  );

  return response.data;
};

export const getDoctorEarnings = async () => {
  const response = await api.get(
    "/doctor/earnings"
  );

  return response.data;
};

export const getDoctorVisitHistory = async () => {
  const response = await api.get(
    "/doctor/history"
  );

  return response.data;
};

export default api;