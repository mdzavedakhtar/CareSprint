import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api/v1";

const doctorApi = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const getDoctorDashboard = async () => {
  const response = await doctorApi.get(
    "/doctor/dashboard"
  );

  return response.data;
};

export const getDoctorProfile = async () => {
  const response = await doctorApi.get(
    "/doctor/profile"
  );

  return response.data;
};

export const updateDoctorAvailability = async (
  availabilityStatus
) => {
  const response = await doctorApi.patch(
    "/doctor/availability",
    {
      availabilityStatus,
    }
  );

  return response.data;
};

export const getDoctorRequests = async () => {
  const response = await doctorApi.get(
    "/doctor/requests"
  );

  return response.data;
};

export const respondToRequest = async (
  bookingId,
  action
) => {
  const response = await doctorApi.patch(
    `/doctor/requests/${bookingId}`,
    {
      action,
    }
  );

  return response.data;
};

export const updateVisitStatus = async (
  bookingId,
  status
) => {
  const response = await doctorApi.patch(
    `/doctor/visits/${bookingId}/status`,
    {
      status,
    }
  );

  return response.data;
};

export const createPrescription = async (
  bookingId,
  prescription
) => {
  const response = await doctorApi.post(
    `/doctor/visits/${bookingId}/prescription`,
    prescription
  );

  return response.data;
};

export const getDoctorEarnings = async () => {
  const response = await doctorApi.get(
    "/doctor/earnings"
  );

  return response.data;
};

export const getDoctorVisitHistory = async () => {
  const response = await doctorApi.get(
    "/doctor/history"
  );

  return response.data;
};

export default doctorApi;