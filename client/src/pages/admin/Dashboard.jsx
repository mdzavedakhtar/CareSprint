import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  UserCheck,
  Stethoscope,
  Users,
  CalendarDays,
  CreditCard,
  Radio,
  Star,
  AlertTriangle,
  BarChart3,
  ShieldCheck,
  Check,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  getAdminOverview,
  getPendingDoctors,
  getAllDoctors,
  approveDoctor,
  rejectDoctor,
  requestCorrectionDoctor,
  suspendDoctor,
  reactivateDoctor,
  getAdminPatients,
  updateUserStatus,
  getAdminBookings,
  getActiveVisits,
  getAdminPayments,
  getAdminReviews,
  getAdminComplaints,
  getAdminAnalytics,
  getAuditLogs,
} from "../../api/adminApi";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Data states
  const [overview, setOverview] = useState(null);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [doctorsData, setDoctorsData] = useState({ doctors: [], pagination: {} });
  const [patientsData, setPatientsData] = useState({ patients: [], pagination: {} });
  const [bookingsData, setBookingsData] = useState({ bookings: [], pagination: {} });
  const [activeVisits, setActiveVisits] = useState([]);
  const [paymentsData, setPaymentsData] = useState({ payments: [], pagination: {} });
  const [reviewsData, setReviewsData] = useState({ reviews: [], pagination: {} });
  const [complaintsData, setComplaintsData] = useState({ complaints: { rejectedBookings: [], lowReviews: [] } });
  const [analyticsData, setAnalyticsData] = useState(null);
  const [auditLogsData, setAuditLogsData] = useState({ logs: [], pagination: {} });

  // Filter & Pagination states
  const [doctorStatusFilter, setDoctorStatusFilter] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [rejectionModal, setRejectionModal] = useState({ open: false, doctorId: null, reason: "" });
  const [correctionModal, setCorrectionModal] = useState({ open: false, doctorId: null, reason: "" });
  const [docModal, setDocModal] = useState({ open: false, doctor: null });

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshData = () => setRefreshTrigger((prev) => prev + 1);

  useEffect(() => {
    let ignore = false;

    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        if (activeTab === "overview") {
          const res = await getAdminOverview();
          if (!ignore && res.success) setOverview(res.overview);
        } else if (activeTab === "verification") {
          const res = await getPendingDoctors();
          if (!ignore && res.success) setPendingDoctors(res.doctors || []);
        } else if (activeTab === "doctors") {
          const res = await getAllDoctors({ page: currentPage, limit: 10, status: doctorStatusFilter });
          if (!ignore && res.success) setDoctorsData({ doctors: res.doctors, pagination: res.pagination });
        } else if (activeTab === "patients") {
          const res = await getAdminPatients({ page: currentPage, limit: 10 });
          if (!ignore && res.success) setPatientsData({ patients: res.patients, pagination: res.pagination });
        } else if (activeTab === "bookings") {
          const res = await getAdminBookings({ page: currentPage, limit: 10, status: bookingStatusFilter });
          if (!ignore && res.success) setBookingsData({ bookings: res.bookings, pagination: res.pagination });
        } else if (activeTab === "activeVisits") {
          const res = await getActiveVisits();
          if (!ignore && res.success) setActiveVisits(res.activeVisits || []);
        } else if (activeTab === "payments") {
          const res = await getAdminPayments({ page: currentPage, limit: 10, status: paymentStatusFilter });
          if (!ignore && res.success) setPaymentsData({ payments: res.payments, pagination: res.pagination });
        } else if (activeTab === "reviews") {
          const res = await getAdminReviews({ page: currentPage, limit: 10 });
          if (!ignore && res.success) setReviewsData({ reviews: res.reviews, pagination: res.pagination });
        } else if (activeTab === "complaints") {
          const res = await getAdminComplaints();
          if (!ignore && res.success) setComplaintsData(res.complaints || {});
        } else if (activeTab === "analytics") {
          const res = await getAdminAnalytics();
          if (!ignore && res.success) setAnalyticsData(res.analytics);
        } else if (activeTab === "audit") {
          const res = await getAuditLogs({ page: currentPage, limit: 15 });
          if (!ignore && res.success) setAuditLogsData({ logs: res.logs, pagination: res.pagination });
        }
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || "Failed to load data");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchData();

    return () => {
      ignore = true;
    };
  }, [activeTab, currentPage, doctorStatusFilter, bookingStatusFilter, paymentStatusFilter, refreshTrigger]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleTabChange = (newTab) => {
    setCurrentPage(1);
    setActiveTab(newTab);
  };

  // Actions
  const handleApproveDoctor = async (doctorId) => {
    try {
      setLoading(true);
      const res = await approveDoctor(doctorId);
      if (res.success) {
        setSuccessMessage("Doctor approved successfully");
        refreshData();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Approval failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectDoctorSubmit = async () => {
    if (!rejectionModal.reason.trim()) return;
    try {
      setLoading(true);
      const res = await rejectDoctor(rejectionModal.doctorId, rejectionModal.reason);
      if (res.success) {
        setSuccessMessage("Doctor rejected");
        setRejectionModal({ open: false, doctorId: null, reason: "" });
        refreshData();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Rejection failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCorrectionDoctorSubmit = async () => {
    if (!correctionModal.reason.trim()) return;
    try {
      setLoading(true);
      const res = await requestCorrectionDoctor(correctionModal.doctorId, correctionModal.reason);
      if (res.success) {
        setSuccessMessage("Correction requested from doctor");
        setCorrectionModal({ open: false, doctorId: null, reason: "" });
        refreshData();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Correction request failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendDoctor = async (doctorId) => {
    try {
      setLoading(true);
      const res = await suspendDoctor(doctorId);
      if (res.success) {
        setSuccessMessage("Doctor suspended");
        refreshData();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Suspension failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateDoctor = async (doctorId) => {
    try {
      setLoading(true);
      const res = await reactivateDoctor(doctorId);
      if (res.success) {
        setSuccessMessage("Doctor reactivated");
        refreshData();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Reactivation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentActive) => {
    try {
      setLoading(true);
      const res = await updateUserStatus(userId, !currentActive);
      if (res.success) {
        setSuccessMessage(res.message);
        refreshData();
      }
    } catch (err) {
      setError(err.response?.data?.message || "User update failed");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "verification", label: "Verification", icon: UserCheck, count: pendingDoctors.length || overview?.pendingDoctors },
    { id: "doctors", label: "Doctors", icon: Stethoscope },
    { id: "patients", label: "Patients", icon: Users },
    { id: "bookings", label: "Bookings", icon: CalendarDays },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "activeVisits", label: "Active Visits", icon: Radio, count: overview?.activeVisits },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "complaints", label: "Complaints", icon: AlertTriangle, count: complaintsData?.count },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "audit", label: "Audit Logs", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 p-5 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-wider font-bold text-blue-400">CareSprint Admin</p>
          <h2 className="text-xl font-extrabold mt-1 text-white">Management Console</h2>
        </div>

        <nav className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive ? "bg-blue-600 text-white shadow" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </div>
                {Boolean(tab.count) && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/30 text-blue-200">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 capitalize">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Admin control panel & platform diagnostics</p>
          </div>
          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 text-sm transition"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* NOTIFICATIONS */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-sm font-medium flex justify-between items-center">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage("")} className="text-emerald-900 font-bold">×</button>
          </div>
        )}

        {/* 1. OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard label="Total Doctors" value={overview?.totalDoctors || 0} sub={`${overview?.approvedDoctors || 0} Approved`} icon={Stethoscope} />
              <StatCard label="Pending Approvals" value={overview?.pendingDoctors || 0} accent="text-amber-600" icon={UserCheck} />
              <StatCard label="Total Patients" value={overview?.totalPatients || 0} icon={Users} />
              <StatCard label="Active Visits" value={overview?.activeVisits || 0} accent="text-emerald-600" icon={Radio} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Financial Summary</h3>
                <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl text-blue-900">
                  <p className="text-sm font-medium">Total Platform Revenue</p>
                  <p className="text-3xl font-extrabold mt-1">₹{Number(overview?.totalRevenue || 0).toLocaleString("en-IN")}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">System Alerts</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 border border-amber-100 text-amber-900 rounded-xl text-sm flex items-center gap-3">
                    <AlertTriangle size={18} className="shrink-0" />
                    <span>{overview?.pendingDoctors || 0} doctor application(s) awaiting verification.</span>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-100 text-red-900 rounded-xl text-sm flex items-center gap-3">
                    <AlertTriangle size={18} className="shrink-0" />
                    <span>{overview?.complaints || 0} booking cancellation/rejection flag(s).</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. DOCTOR VERIFICATION TAB */}
        {activeTab === "verification" && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Pending Doctor Verification Applications</h2>

            {pendingDoctors.length === 0 ? (
              <p className="text-slate-500 py-8 text-center">No pending doctor verification applications.</p>
            ) : (
              <div className="space-y-4">
                {pendingDoctors.map((doctor) => (
                  <div key={doctor._id} className="p-5 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-900">{doctor.userId?.name || "Doctor"}</h3>
                      <p className="text-xs text-slate-500">{doctor.userId?.email} • {doctor.userId?.phone}</p>
                      <p className="text-sm text-slate-700 mt-2">
                        <span className="font-semibold">Specialization:</span> {doctor.specialization} | <span className="font-semibold">Qualification:</span> {doctor.qualification} ({doctor.experience} yrs)
                      </p>
                      <p className="text-xs text-slate-500 mt-1">License: {doctor.licenseNumber}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDocModal({ open: true, doctor })}
                        className="px-3 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200"
                      >
                        View Documents ({doctor.verificationDocuments?.length || 0})
                      </button>
                      <button
                        onClick={() => handleApproveDoctor(doctor._id)}
                        className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 flex items-center gap-1"
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        onClick={() => setCorrectionModal({ open: true, doctorId: doctor._id, reason: "" })}
                        className="px-3 py-2 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 flex items-center gap-1"
                      >
                        Request Correction
                      </button>
                      <button
                        onClick={() => setRejectionModal({ open: true, doctorId: doctor._id, reason: "" })}
                        className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 flex items-center gap-1"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. DOCTORS TAB */}
        {activeTab === "doctors" && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900">Doctor Directory</h2>
              <select
                value={doctorStatusFilter}
                onChange={(e) => setDoctorStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm"
              >
                <option value="">All Statuses</option>
                <option value="APPROVED">APPROVED</option>
                <option value="PENDING">PENDING</option>
                <option value="REJECTED">REJECTED</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Doctor</th>
                    <th className="p-3">Specialization</th>
                    <th className="p-3">Fee</th>
                    <th className="p-3">Verification</th>
                    <th className="p-3">Availability</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doctorsData.doctors.map((doctor) => (
                    <tr key={doctor._id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{doctor.userId?.name || "Doctor"}</p>
                        <p className="text-xs text-slate-500">{doctor.userId?.email}</p>
                      </td>
                      <td className="p-3">{doctor.specialization}</td>
                      <td className="p-3 font-semibold">₹{doctor.consultationFee}</td>
                      <td className="p-3">
                        <StatusBadge status={doctor.verificationStatus} />
                      </td>
                      <td className="p-3 font-medium text-slate-700">{doctor.availabilityStatus}</td>
                      <td className="p-3 text-right space-x-2">
                        {doctor.verificationStatus === "SUSPENDED" ? (
                          <button
                            onClick={() => handleReactivateDoctor(doctor._id)}
                            className="px-3 py-1.5 bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs hover:bg-emerald-200"
                          >
                            Reactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSuspendDoctor(doctor._id)}
                            className="px-3 py-1.5 bg-red-100 text-red-700 font-bold rounded-lg text-xs hover:bg-red-200"
                          >
                            Suspend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination pagination={doctorsData.pagination} onPageChange={handlePageChange} />
          </div>
        )}

        {/* 4. PATIENTS TAB */}
        {activeTab === "patients" && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Patient Directory</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Patient</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Account Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patientsData.patients.map((patient) => (
                    <tr key={patient._id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{patient.userId?.name || "Patient"}</p>
                      </td>
                      <td className="p-3 text-slate-600">
                        <p>{patient.userId?.email}</p>
                        <p className="text-xs text-slate-400">{patient.userId?.phone}</p>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${patient.userId?.isActive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                          {patient.userId?.isActive ? "ACTIVE" : "SUSPENDED"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleToggleUserStatus(patient.userId?._id, patient.userId?.isActive)}
                          className={`px-3 py-1.5 font-bold rounded-lg text-xs ${patient.userId?.isActive ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}
                        >
                          {patient.userId?.isActive ? "Suspend Account" : "Activate Account"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination pagination={patientsData.pagination} onPageChange={handlePageChange} />
          </div>
        )}

        {/* 5. BOOKINGS TAB */}
        {activeTab === "bookings" && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900">All Bookings</h2>
              <select
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm"
              >
                <option value="">All Statuses</option>
                <option value="REQUESTED">REQUESTED</option>
                <option value="ACCEPTED">ACCEPTED</option>
                <option value="DOCTOR_ON_THE_WAY">DOCTOR_ON_THE_WAY</option>
                <option value="ARRIVED">ARRIVED</option>
                <option value="CONSULTATION">CONSULTATION</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Patient</th>
                    <th className="p-3">Doctor</th>
                    <th className="p-3">Symptoms</th>
                    <th className="p-3">Fee</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookingsData.bookings.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold">{b.patientId?.userId?.name || "Patient"}</td>
                      <td className="p-3">{b.doctorId?.userId?.name || "Unassigned"}</td>
                      <td className="p-3 text-slate-600 max-w-xs truncate">{b.symptoms}</td>
                      <td className="p-3 font-bold">₹{b.consultationFee}</td>
                      <td className="p-3">
                        <StatusBadge status={b.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination pagination={bookingsData.pagination} onPageChange={handlePageChange} />
          </div>
        )}

        {/* 6. PAYMENTS TAB */}
        {activeTab === "payments" && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900">Payment Transactions</h2>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm"
              >
                <option value="">All Statuses</option>
                <option value="PAID">PAID</option>
                <option value="PENDING">PENDING</option>
                <option value="FAILED">FAILED</option>
                <option value="REFUNDED">REFUNDED</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Transaction ID</th>
                    <th className="p-3">Patient</th>
                    <th className="p-3">Doctor</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paymentsData.payments.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-xs text-slate-500">{p.transactionId || p._id}</td>
                      <td className="p-3">{p.patientId?.userId?.name}</td>
                      <td className="p-3">{p.doctorId?.userId?.name}</td>
                      <td className="p-3 font-bold text-emerald-700">₹{p.amount}</td>
                      <td className="p-3">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination pagination={paymentsData.pagination} onPageChange={handlePageChange} />
          </div>
        )}

        {/* 7. ACTIVE VISITS TAB */}
        {activeTab === "activeVisits" && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Live Active Visit Tracking</h2>

            {activeVisits.length === 0 ? (
              <p className="text-slate-500 py-8 text-center">No visits currently active.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeVisits.map((v) => (
                  <div key={v._id} className="p-5 border border-blue-200 bg-blue-50/50 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{v.status}</span>
                      <span className="text-xs font-bold text-slate-500">₹{v.consultationFee}</span>
                    </div>
                    <p className="font-bold text-slate-900">Patient: {v.patientId?.userId?.name}</p>
                    <p className="text-sm text-slate-700">Doctor: {v.doctorId?.userId?.name}</p>
                    <p className="text-xs text-slate-500 truncate">Symptoms: {v.symptoms}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 8. REVIEWS TAB */}
        {activeTab === "reviews" && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Patient Reviews & Feedback</h2>
            <div className="space-y-3">
              {reviewsData.reviews.map((r) => (
                <div key={r._id} className="p-4 border border-slate-100 rounded-xl bg-slate-50 flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-sm mb-1">
                      <Star size={16} className="fill-amber-500" />
                      <span>{r.rating} / 5</span>
                    </div>
                    <p className="text-sm text-slate-800 italic">"{r.comment}"</p>
                    <p className="text-xs text-slate-500 mt-2">By {r.patientId?.userId?.name} for Dr. {r.doctorId?.userId?.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. COMPLAINTS TAB */}
        {activeTab === "complaints" && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Complaints & Flagged Issues</h2>

            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Rejected Bookings ({complaintsData.complaints?.rejectedBookings?.length || 0})</h3>
              {complaintsData.complaints?.rejectedBookings?.map((b) => (
                <div key={b._id} className="p-4 border border-red-100 bg-red-50/50 rounded-xl text-sm">
                  <p className="font-bold text-red-900">Booking Rejected</p>
                  <p className="text-slate-700 mt-1">Reason: {b.cancellationReason || "No reason given"}</p>
                  <p className="text-xs text-slate-500 mt-1">Doctor: {b.doctorId?.userId?.name} | Patient: {b.patientId?.userId?.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 10. ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Platform Analytics</h2>
            <div className="p-5 bg-slate-50 rounded-xl">
              <p className="text-sm font-semibold text-slate-600">Total Settlement Volume</p>
              <p className="text-3xl font-black text-slate-900 mt-1">₹{Number(analyticsData?.totalRevenue || 0).toLocaleString("en-IN")}</p>
            </div>
          </div>
        )}

        {/* 11. AUDIT LOGS TAB */}
        {activeTab === "audit" && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900">System Audit Trail</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Resource</th>
                    <th className="p-3">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogsData.logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50 font-mono text-xs">
                      <td className="p-3 text-slate-500">{new Date(log.createdAt).toLocaleString("en-IN")}</td>
                      <td className="p-3 font-bold text-blue-700">{log.action}</td>
                      <td className="p-3">{log.resource} ({log.resourceId})</td>
                      <td className="p-3 text-slate-400">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination pagination={auditLogsData.pagination} onPageChange={handlePageChange} />
          </div>
        )}

        {/* REJECTION REASON MODAL */}
        {rejectionModal.open && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
              <h3 className="font-bold text-slate-900 text-lg">Reject Doctor Application</h3>
              <textarea
                value={rejectionModal.reason}
                onChange={(e) => setRejectionModal((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter rejection reason..."
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500"
                rows={4}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setRejectionModal({ open: false, doctorId: null, reason: "" })} className="px-4 py-2 text-slate-600 text-sm font-semibold">Cancel</button>
                <button onClick={handleRejectDoctorSubmit} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold">Reject Application</button>
              </div>
            </div>
          </div>
        )}

        {/* CORRECTION REQUEST MODAL */}
        {correctionModal.open && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
              <h3 className="font-bold text-slate-900 text-lg">Request Correction from Doctor</h3>
              <textarea
                value={correctionModal.reason}
                onChange={(e) => setCorrectionModal((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter required corrections or missing document details..."
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500"
                rows={4}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setCorrectionModal({ open: false, doctorId: null, reason: "" })} className="px-4 py-2 text-slate-600 text-sm font-semibold">Cancel</button>
                <button onClick={handleCorrectionDoctorSubmit} className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-bold">Send Correction Request</button>
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENTS MODAL */}
        {docModal.open && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 max-h-[80vh] overflow-y-auto">
              <h3 className="font-bold text-slate-900 text-lg">Verification Documents</h3>
              {docModal.doctor?.verificationDocuments?.length === 0 ? (
                <p className="text-slate-500 text-sm">No documents submitted.</p>
              ) : (
                <div className="space-y-3">
                  {docModal.doctor?.verificationDocuments?.map((doc, idx) => (
                    <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm">
                      <p className="font-bold text-slate-900">{doc.documentType}</p>
                      <p className="text-xs text-slate-500">Doc #: {doc.documentNumber || "N/A"}</p>
                      {doc.documentUrl && (
                        <a href={doc.documentUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-semibold underline mt-1 inline-block">View File</a>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end">
                <button onClick={() => setDocModal({ open: false, doctor: null })} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold">Close</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Sub-components
const StatCard = ({ label, value, sub, accent = "text-slate-900", icon: Icon }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-start">
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase">{label}</p>
      <p className={`text-2xl font-extrabold mt-1 ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
    <div className="p-3 bg-slate-50 text-slate-700 rounded-xl">
      <Icon size={20} />
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    APPROVED: "bg-emerald-100 text-emerald-800",
    ACCEPTED: "bg-emerald-100 text-emerald-800",
    COMPLETED: "bg-emerald-100 text-emerald-800",
    PAID: "bg-emerald-100 text-emerald-800",
    PENDING: "bg-amber-100 text-amber-800",
    REQUESTED: "bg-blue-100 text-blue-800",
    REJECTED: "bg-red-100 text-red-800",
    CANCELLED: "bg-red-100 text-red-800",
    SUSPENDED: "bg-slate-800 text-white",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${styles[status] || "bg-slate-100 text-slate-800"}`}>
      {status}
    </span>
  );
};

const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || !pagination.totalPages || pagination.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-sm">
      <p className="text-slate-500 text-xs">
        Page {pagination.page} of {pagination.totalPages} ({pagination.total} total items)
      </p>
      <div className="flex gap-2">
        <button
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Dashboard;