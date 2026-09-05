import { useEffect, useState } from "react";

import {
  Activity,
  CalendarDays,
  Clock3,
  IndianRupee,
  Power,
  Star,
} from "lucide-react";

import {
  getDoctorDashboard,
  updateDoctorAvailability,
} from "../../api/doctorApi";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const result =
        await getDoctorDashboard();

      if (result.success) {
        setData(result.dashboard);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const toggleAvailability = async () => {
    try {
      setUpdating(true);
      setError("");

      const nextStatus =
        data.availabilityStatus ===
        "AVAILABLE"
          ? "OFFLINE"
          : "AVAILABLE";

      const result =
        await updateDoctorAvailability(
          nextStatus
        );

      if (result.success) {
        setData((prev) => ({
          ...prev,
          availabilityStatus:
            result.availabilityStatus,
        }));
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update availability"
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white border border-red-200 rounded-2xl p-6 text-red-600">
        {error || "Dashboard unavailable"}
      </div>
    );
  }

  const online =
    data.availabilityStatus ===
    "AVAILABLE";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm text-blue-600 font-medium">
            CareSprint Doctor
          </p>

          <h1 className="text-3xl font-bold text-slate-900 mt-1">
            Doctor Dashboard
          </h1>

          <p className="text-slate-500 mt-1">
            Manage visits, availability and
            consultations.
          </p>
        </div>

        <button
          onClick={toggleAvailability}
          disabled={updating}
          className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold transition ${
            online
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-slate-900 text-white hover:bg-slate-800"
          } disabled:opacity-60`}
        >
          <Power size={18} />

          {updating
            ? "Updating..."
            : online
            ? "Available"
            : "Go Online"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          icon={Activity}
          label="Current Status"
          value={
            data.availabilityStatus
          }
          accent={
            online
              ? "text-emerald-600"
              : "text-slate-700"
          }
        />

        <StatCard
          icon={CalendarDays}
          label="Today's Visits"
          value={data.todayVisits}
        />

        <StatCard
          icon={Clock3}
          label="Pending Requests"
          value={data.pendingRequests}
        />

        <StatCard
          icon={IndianRupee}
          label="Total Earnings"
          value={`₹${Number(
            data.earnings || 0
          ).toLocaleString("en-IN")}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Practice Overview
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-5">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-500">
                Consultation Fee
              </p>

              <p className="text-xl font-bold mt-1">
                ₹
                {Number(
                  data.consultationFee || 0
                ).toLocaleString("en-IN")}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-500">
                Rating
              </p>

              <p className="text-xl font-bold mt-1 flex items-center gap-1">
                {Number(
                  data.rating || 0
                ).toFixed(1)}

                <Star
                  size={18}
                  className="fill-current"
                />
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-500">
                Verification
              </p>

              <p className="text-xl font-bold mt-1">
                {data.verificationStatus}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-600 text-white rounded-2xl p-6">
          <p className="text-blue-100 text-sm">
            Doctor Availability
          </p>

          <h2 className="text-2xl font-bold mt-2">
            {online
              ? "You are online"
              : "You are offline"}
          </h2>

          <p className="text-blue-100 text-sm mt-3 leading-6">
            {online
              ? "You can receive new patient requests."
              : "Go online when you are ready to accept visits."}
          </p>

          <div className="mt-6 flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                online
                  ? "bg-emerald-300"
                  : "bg-slate-300"
              }`}
            />

            <span className="font-medium">
              {data.availabilityStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  accent = "text-slate-900",
}) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-5">
    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
      <Icon size={20} />
    </div>

    <p className="text-sm text-slate-500 mt-4">
      {label}
    </p>

    <p
      className={`text-2xl font-bold mt-1 ${accent}`}
    >
      {value}
    </p>
  </div>
);

export default Dashboard;