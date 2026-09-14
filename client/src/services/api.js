import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
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

export const patientAPI = {
  // Dashboard
  dashboard: () =>
    api.get("/patient/dashboard"),

  // Profile
  profile: () =>
    api.get("/patient/profile"),

  updateProfile: (data) =>
    api.patch("/patient/profile", data),

  updateLocation: (data) =>
    api.patch("/patient/location", data),

  // Doctor Discovery
  doctors: (params) =>
    api.get("/patient/doctors", { params }),

  doctorDetails: (doctorId) =>
    api.get(`/patient/doctors/${doctorId}`),

  // Bookings / Visits
  bookings: () =>
    api.get("/patient/bookings"),

  createBooking: (data) =>
    api.post("/patient/bookings", data),

  bookingDetails: (bookingId) =>
    api.get(`/patient/bookings/${bookingId}`),

  tracking: (bookingId) =>
    api.get(`/patient/bookings/${bookingId}/tracking`),

  cancelBooking: (bookingId, reason) =>
    api.patch(`/patient/bookings/${bookingId}/cancel`, { reason }),

  // Prescriptions
  prescriptions: () =>
    api.get("/patient/prescriptions"),

  // Reviews
  reviews: () =>
    api.get("/patient/reviews"),

  doctorReviews: (doctorId) =>
    api.get(`/patient/doctors/${doctorId}/reviews`),

  createReview: (data) =>
    api.post("/patient/reviews", data),

  // Notifications
  notifications: () =>
    api.get("/patient/notifications"),
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

  updateLocation: (data) =>
    api.patch("/doctor/location", data),

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
      `/doctor/visits/${bookingId}/arrived`
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

export const adminAPI = {
  overview: () => api.get("/admin/overview"),
  pendingDoctors: () => api.get("/admin/doctors/pending"),
  doctors: (params) => api.get("/admin/doctors", { params }),
  doctorDocuments: (doctorId) => api.get(`/admin/doctors/${doctorId}/documents`),
  approveDoctor: (doctorId) => api.patch(`/admin/doctors/${doctorId}/approve`),
  rejectDoctor: (doctorId, reason) => api.patch(`/admin/doctors/${doctorId}/reject`, { reason }),
  requestCorrectionDoctor: (doctorId, reason) => api.patch(`/admin/doctors/${doctorId}/request-correction`, { reason }),
  suspendDoctor: (doctorId) => api.patch(`/admin/doctors/${doctorId}/suspend`),
  reactivateDoctor: (doctorId) => api.patch(`/admin/doctors/${doctorId}/reactivate`),
  patients: (params) => api.get("/admin/patients", { params }),
  updateUserStatus: (userId, isActive) => api.patch(`/admin/users/${userId}/status`, { isActive }),
  bookings: (params) => api.get("/admin/bookings", { params }),
  activeVisits: () => api.get("/admin/visits/active"),
  payments: (params) => api.get("/admin/payments", { params }),
  reviews: (params) => api.get("/admin/reviews", { params }),
  complaints: () => api.get("/admin/complaints"),
  analytics: () => api.get("/admin/analytics"),
  auditLogs: (params) => api.get("/admin/audit-logs", { params }),
};

export const paymentAPI = {
  createOrder: (bookingId) =>
    api.post("/payment/create-order", { bookingId }),

  verifySignature: (data) =>
    api.post("/payment/verify-signature", data),

  handleFailure: (data) =>
    api.post("/payment/handle-failure", data),
};

export const notificationAPI = {
  notifications: () =>
    api.get("/notifications"),

  markAsRead: (id) =>
    api.patch(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.patch("/notifications/read-all"),
};

export default api;