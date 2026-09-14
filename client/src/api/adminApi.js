import api from "../services/api";

export const getAdminOverview = async () => {
  const response = await api.get("/admin/overview");
  return response.data;
};

export const getPendingDoctors = async () => {
  const response = await api.get("/admin/doctors/pending");
  return response.data;
};

export const getAllDoctors = async (params) => {
  const response = await api.get("/admin/doctors", { params });
  return response.data;
};

export const getDoctorDocuments = async (doctorId) => {
  const response = await api.get(`/admin/doctors/${doctorId}/documents`);
  return response.data;
};

export const approveDoctor = async (doctorId) => {
  const response = await api.patch(`/admin/doctors/${doctorId}/approve`);
  return response.data;
};

export const rejectDoctor = async (doctorId, reason) => {
  const response = await api.patch(`/admin/doctors/${doctorId}/reject`, { reason });
  return response.data;
};

export const requestCorrectionDoctor = async (doctorId, reason) => {
  const response = await api.patch(`/admin/doctors/${doctorId}/request-correction`, { reason });
  return response.data;
};

export const suspendDoctor = async (doctorId) => {
  const response = await api.patch(`/admin/doctors/${doctorId}/suspend`);
  return response.data;
};

export const reactivateDoctor = async (doctorId) => {
  const response = await api.patch(`/admin/doctors/${doctorId}/reactivate`);
  return response.data;
};

export const getAdminPatients = async (params) => {
  const response = await api.get("/admin/patients", { params });
  return response.data;
};

export const updateUserStatus = async (userId, isActive) => {
  const response = await api.patch(`/admin/users/${userId}/status`, { isActive });
  return response.data;
};

export const getAdminBookings = async (params) => {
  const response = await api.get("/admin/bookings", { params });
  return response.data;
};

export const getActiveVisits = async () => {
  const response = await api.get("/admin/visits/active");
  return response.data;
};

export const getAdminPayments = async (params) => {
  const response = await api.get("/admin/payments", { params });
  return response.data;
};

export const getAdminReviews = async (params) => {
  const response = await api.get("/admin/reviews", { params });
  return response.data;
};

export const getAdminComplaints = async () => {
  const response = await api.get("/admin/complaints");
  return response.data;
};

export const getAdminAnalytics = async () => {
  const response = await api.get("/admin/analytics");
  return response.data;
};

export const getAuditLogs = async (params) => {
  const response = await api.get("/admin/audit-logs", { params });
  return response.data;
};

export default api;
