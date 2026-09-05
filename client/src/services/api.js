import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const authAPI = {
  registerPatient: (data) =>
    api.post("/auth/patient/register", data),

  verifyOTP: (data) =>
    api.post("/auth/patient/verify-otp", data),

  login: (data) =>
    api.post("/auth/login", data),

  me: () =>
    api.get("/auth/me"),

  logout: () =>
    api.post("/auth/logout"),
};

export const doctorAPI = {
  // Dashboard
  dashboard: () =>
    api.get("/doctor/dashboard"),

  // Profile
  profile: () =>
    api.get("/doctor/profile"),

  updateProfile: (data) =>
    api.patch("/doctor/profile", data),

  // Verification
  verificationDocuments: () =>
    api.get("/doctor/verification-documents"),

  addVerificationDocument: (data) =>
    api.post(
      "/doctor/verification-documents",
      data
    ),

  // Availability
  updateAvailability: (availabilityStatus) =>
    api.patch("/doctor/availability", {
      availabilityStatus,
    }),

  // Requests
  requests: () =>
    api.get("/doctor/requests"),

  acceptRequest: (bookingId) =>
    api.patch(
      `/doctor/requests/${bookingId}/accept`
    ),

  rejectRequest: (bookingId, reason) =>
    api.patch(
      `/doctor/requests/${bookingId}/reject`,
      {
        reason,
      }
    ),

  // Visit
  visit: (bookingId) =>
    api.get(`/doctor/visits/${bookingId}`),

  startVisit: (bookingId) =>
    api.patch(
      `/doctor/visits/${bookingId}/start`
    ),

  arrive: (bookingId) =>
    api.patch(
      `/doctor/visits/${bookingId}/arrive`
    ),

  startConsultation: (bookingId) =>
    api.patch(
      `/doctor/visits/${bookingId}/consultation`
    ),

  completeConsultation: (bookingId) =>
    api.patch(
      `/doctor/visits/${bookingId}/complete`
    ),

  // Prescription
  createPrescription: (bookingId, data) =>
    api.post(
      `/doctor/visits/${bookingId}/prescription`,
      data
    ),

  // Earnings
  earnings: () =>
    api.get("/doctor/earnings"),

  // History
  history: () =>
    api.get("/doctor/history"),
};

export default api;