import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Navigation,
  Phone,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import GoogleTrackingMap from "../../components/GoogleTrackingMap";
import { patientAPI } from "../../services/api";
import useSocket from "../../hooks/useSocket";

const LiveTracking = () => {
  const { bookingId: paramBookingId } = useParams();
  const navigate = useNavigate();

  const [bookingId, setBookingId] = useState(paramBookingId || null);
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);

  // Retrieve auth token from localStorage / cookies for Socket.IO
  const token = localStorage.getItem("token") || "";

  // Fetch initial tracking payload
  const fetchTracking = useCallback(async (targetId) => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (targetId) {
        response = await patientAPI.tracking(targetId);
      } else {
        const dashRes = await patientAPI.dashboard();
        const upcoming = dashRes.data?.dashboard?.upcomingVisit;
        if (upcoming) {
          setBookingId(upcoming._id);
          response = await patientAPI.tracking(upcoming._id);
        }
      }

      if (response && response.data?.success) {
        setTrackingData(response.data.tracking);
        if (response.data.tracking?.doctor?.lastUpdatedAt) {
          const age = Date.now() - new Date(response.data.tracking.doctor.lastUpdatedAt).getTime();
          setIsStale(age > 120000);
        }
      } else {
        setTrackingData(null);
      }
    } catch (err) {
      console.error("Fetch tracking error:", err);
      setError(err.response?.data?.message || "Live tracking unavailable for this visit.");
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTracking(bookingId);
  }, [bookingId, fetchTracking]);

  // Real-time Socket.IO handler
  const handleSocketEvent = useCallback((eventName, payload) => {
    console.log(`[LiveTracking Socket] Received ${eventName}:`, payload);

    if (eventName === "DOCTOR_LOCATION_UPDATED") {
      setTrackingData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          doctor: {
            ...prev.doctor,
            location: payload.location,
            lastUpdatedAt: payload.updatedAt || new Date().toISOString(),
            isStale: false,
          },
          distanceKm: payload.distanceKm ?? prev.distanceKm,
          etaMinutes: payload.etaMinutes ?? prev.etaMinutes,
        };
      });
      setIsStale(false);
    } else if (
      [
        "DOCTOR_ON_THE_WAY",
        "DOCTOR_ARRIVED",
        "CONSULTATION_STARTED",
        "CONSULTATION_COMPLETED",
        "BOOKING_CANCELLED",
        "BOOKING_ACCEPTED",
      ].includes(eventName)
    ) {
      if (payload.bookingId === bookingId || payload.booking?._id === bookingId) {
        setTrackingData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: payload.status || payload.booking?.status || prev.status,
          };
        });
      }
    }
  }, [bookingId]);

  useSocket({
    token,
    bookingId,
    onEvent: handleSocketEvent,
  });

  const doctor = trackingData?.doctor;
  const currentStatus = trackingData?.status || "MATCHING";

  // Active status stepper definitions
  const steps = [
    { key: "ACCEPTED", label: "Request Accepted" },
    { key: "DOCTOR_ON_THE_WAY", label: "Doctor On The Way" },
    { key: "ARRIVED", label: "Doctor Arrived" },
    { key: "CONSULTATION", label: "Consultation in Progress" },
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case "ACCEPTED": return 0;
      case "DOCTOR_ON_THE_WAY": return 1;
      case "ARRIVED": return 2;
      case "CONSULTATION": return 3;
      case "COMPLETED": return 4;
      default: return 0;
    }
  };

  const activeStep = getStepIndex(currentStatus);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/patient/dashboard")}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
        >
          <ChevronLeft size={18} />
          Back to Dashboard
        </button>
        {bookingId && (
          <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            Visit ID: #{bookingId.slice(-6)}
          </span>
        )}
      </div>

      <PageHeader
        eyebrow="Live Healthcare Tracking"
        title="At-Home Consultation Progress"
        description="Track your assigned doctor's real-time ETA and status updates."
      />

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center text-slate-500 shadow-sm">
          <div className="h-10 w-10 mx-auto mb-4 rounded-full border-3 border-blue-600 border-t-transparent animate-spin" />
          <p className="font-semibold text-slate-800">Connecting to Live Tracking Stream...</p>
          <p className="text-xs text-slate-400 mt-1">Retrieving doctor location and ETA details</p>
        </div>
      ) : error || !trackingData ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm max-w-2xl mx-auto">
          <Navigation size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-900">No Active Visit to Track</h3>
          <p className="text-sm text-slate-500 mt-2">
            {error || "Live tracking becomes active once a doctor accepts your consultation request."}
          </p>
          <button
            onClick={() => navigate("/patient/find-doctor")}
            className="mt-6 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition"
          >
            Find a Doctor
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Map & Stepper Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Stepper */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="grid grid-cols-4 gap-2 text-center">
                {steps.map((step, idx) => {
                  const isCompleted = idx < activeStep;
                  const isCurrent = idx === activeStep;

                  return (
                    <div key={step.key} className="flex flex-col items-center">
                      <div
                        className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isCompleted
                            ? "bg-emerald-500 text-white"
                            : isCurrent
                            ? "bg-blue-600 text-white ring-4 ring-blue-100"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 size={18} /> : idx + 1}
                      </div>
                      <p
                        className={`text-xs font-medium mt-2 max-w-[100px] leading-snug ${
                          isCurrent
                            ? "text-blue-900 font-bold"
                            : isCompleted
                            ? "text-emerald-700"
                            : "text-slate-400"
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stale Warning Banner */}
            {isStale && currentStatus === "DOCTOR_ON_THE_WAY" && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-amber-800 text-sm">
                <AlertTriangle size={20} className="text-amber-600 flex-shrink-0" />
                <span>
                  Doctor location signal temporarily static. Last update received over 2 minutes ago.
                </span>
              </div>
            )}

            {/* Google Maps / Telemetry Map Container */}
            <GoogleTrackingMap
              patientLocation={trackingData.patientLocation}
              doctorLocation={doctor?.location}
              doctorName={doctor?.name || "Doctor"}
              distanceKm={trackingData.distanceKm}
              etaMinutes={trackingData.etaMinutes}
              status={currentStatus}
            />
          </div>

          {/* Doctor Details Card Sidebar */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-blue-100 text-blue-700 font-bold text-xl flex items-center justify-center overflow-hidden border border-blue-200 flex-shrink-0">
                  {doctor?.profileImage ? (
                    <img src={doctor.profileImage} alt={doctor.name} className="h-full w-full object-cover" />
                  ) : (
                    doctor?.name?.[0] || "D"
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">
                    {doctor?.name || "Assigned Doctor"}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 mt-0.5">
                    {doctor?.specialization || "General Physician"}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                    <span className="font-semibold text-amber-600">★ {doctor?.rating || 4.9}</span>
                    <span>•</span>
                    <span className="text-slate-400">Fee: ₹{doctor?.consultationFee || 500}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                    Arrival ETA
                  </span>
                  <span className="text-xs font-mono font-bold text-blue-900">
                    {trackingData.etaMinutes ? `${trackingData.etaMinutes} min` : "10-15 min"}
                  </span>
                </div>
                <div className="h-2 w-full bg-blue-200/60 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full animate-pulse w-3/4" />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-blue-800 pt-1">
                  <Clock size={14} />
                  <span>Estimated arrival window based on live GPS traffic</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-600 py-1.5">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={15} className="text-emerald-600" />
                    Doctor Verified
                  </span>
                  <span className="font-semibold text-slate-800">CareSprint Certified</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 py-1.5">
                  <span className="flex items-center gap-1.5">
                    <UserCheck size={15} className="text-blue-600" />
                    At-Home Visit
                  </span>
                  <span className="font-semibold text-slate-800">In Progress</span>
                </div>
              </div>

              {doctor?.phone && (
                <a
                  href={`tel:${doctor.phone}`}
                  className="w-full py-3.5 rounded-xl border border-slate-200 text-slate-800 font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 transition shadow-sm"
                >
                  <Phone size={18} className="text-blue-600" />
                  Call Doctor ({doctor.phone})
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTracking;