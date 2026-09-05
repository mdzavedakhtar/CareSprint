import { useEffect, useState } from "react";

import {
  MapPin,
  Phone,
  UserRound,
  Check,
  X,
  RefreshCw,
  Clock,
} from "lucide-react";

import {
  getDoctorRequests,
  respondToRequest,
} from "../../api/doctorApi";

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [error, setError] = useState("");

  // ======================================================
  // LOAD REQUESTS
  // ======================================================

  const loadRequests = async () => {
    try {
      setError("");
      setLoading(true);

      const result = await getDoctorRequests();

      if (result.success) {
        setRequests(result.requests || []);
      } else {
        setError(
          result.message || "Unable to load requests"
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load requests"
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // INITIAL LOAD
  // ======================================================

  useEffect(() => {
    loadRequests();
  }, []);

  // ======================================================
  // ACCEPT / REJECT REQUEST
  // ======================================================

  const handleAction = async (bookingId, action) => {
    try {
      setError("");
      setProcessing(bookingId);

      const result = await respondToRequest(
        bookingId,
        action
      );

      if (result.success) {
        setRequests((prev) =>
          prev.filter(
            (item) => item._id !== bookingId
          )
        );
      } else {
        setError(
          result.message ||
            "Unable to process request"
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to process request"
      );
    } finally {
      setProcessing(null);
    }
  };

  // ======================================================
  // LOADING STATE
  // ======================================================

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="py-20 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50">
            <RefreshCw
              size={22}
              className="text-blue-600 animate-spin"
            />
          </div>

          <p className="mt-4 text-slate-500">
            Loading requests...
          </p>
        </div>
      </div>
    );
  }

  // ======================================================
  // PAGE
  // ======================================================

  return (
    <div className="max-w-5xl mx-auto">
      {/* ------------------------------------------------
          HEADER
      ------------------------------------------------ */}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm text-blue-600 font-medium">
            Doctor Portal
          </p>

          <h1 className="text-3xl font-bold text-slate-900 mt-1">
            Incoming Requests
          </h1>

          <p className="text-slate-500 mt-1">
            Review and respond to nearby patient
            visit requests.
          </p>
        </div>

        <button
          type="button"
          onClick={loadRequests}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* ------------------------------------------------
          ERROR
      ------------------------------------------------ */}

      {error && (
        <div className="mt-5 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* ------------------------------------------------
          EMPTY STATE
      ------------------------------------------------ */}

      {requests.length === 0 ? (
        <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center">
            <UserRound
              size={24}
              className="text-slate-400"
            />
          </div>

          <h2 className="font-bold text-slate-900 mt-4">
            No pending requests
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            New patient requests will appear here.
          </p>
        </div>
      ) : (
        /* ------------------------------------------------
           REQUEST LIST
        ------------------------------------------------ */

        <div className="mt-8 space-y-5">
          {requests.map((booking) => {
            const patient = booking.patientId;

            const isProcessing =
              processing === booking._id;

            return (
              <div
                key={booking._id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
              >
                {/* ----------------------------------------
                    REQUEST HEADER
                ---------------------------------------- */}

                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <UserRound size={20} />
                      </div>

                      <div>
                        <h2 className="font-bold text-slate-900">
                          Patient Request
                        </h2>

                        <p className="text-xs text-slate-500">
                          New home consultation
                        </p>
                      </div>
                    </div>

                    {/* ------------------------------------
                        REQUEST DETAILS
                    ------------------------------------ */}

                    <div className="mt-5 space-y-4 text-sm">
                      {/* Symptoms */}

                      <div>
                        <p className="font-semibold text-slate-900 mb-1">
                          Symptoms
                        </p>

                        <p className="text-slate-600 leading-6">
                          {booking.symptoms ||
                            "No symptoms provided"}
                        </p>
                      </div>

                      {/* Address */}

                      {booking.address && (
                        <div className="flex gap-2 text-slate-600">
                          <MapPin
                            size={18}
                            className="shrink-0 mt-0.5 text-slate-500"
                          />

                          <div>
                            <p className="font-medium text-slate-800">
                              Visit location
                            </p>

                            <p className="mt-1">
                              {[
                                booking.address.street,
                                booking.address.area,
                                booking.address.city,
                                booking.address.pincode,
                              ]
                                .filter(Boolean)
                                .join(", ") ||
                                "Patient location"}
                            </p>

                            {booking.address.landmark && (
                              <p className="text-xs text-slate-500 mt-1">
                                Landmark:{" "}
                                {
                                  booking.address
                                    .landmark
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Patient phone */}

                      {patient?.phone && (
                        <div className="flex gap-2 text-slate-600">
                          <Phone
                            size={18}
                            className="shrink-0"
                          />

                          <div>
                            <p className="font-medium text-slate-800">
                              Patient contact
                            </p>

                            <p className="mt-1">
                              {patient.phone}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Requested time */}

                      {booking.requestedAt && (
                        <div className="flex gap-2 text-slate-600">
                          <Clock
                            size={18}
                            className="shrink-0"
                          />

                          <div>
                            <p className="font-medium text-slate-800">
                              Requested
                            </p>

                            <p className="mt-1">
                              {new Date(
                                booking.requestedAt
                              ).toLocaleString(
                                "en-IN",
                                {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* --------------------------------------
                      CONSULTATION FEE
                  -------------------------------------- */}

                  <div className="text-left md:text-right">
                    <p className="text-sm text-slate-500">
                      Consultation fee
                    </p>

                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      ₹
                      {Number(
                        booking.consultationFee || 0
                      ).toLocaleString("en-IN")}
                    </p>

                    <span className="inline-flex mt-2 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                      Pending response
                    </span>
                  </div>
                </div>

                {/* ----------------------------------------
                    ACTIONS
                ---------------------------------------- */}

                <div className="border-t border-slate-100 mt-6 pt-5 flex flex-col sm:flex-row gap-3">
                  {/* ACCEPT */}

                  <button
                    type="button"
                    onClick={() =>
                      handleAction(
                        booking._id,
                        "ACCEPT"
                      )
                    }
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    <Check size={18} />

                    {isProcessing
                      ? "Processing..."
                      : "Accept Request"}
                  </button>

                  {/* REJECT */}

                  <button
                    type="button"
                    onClick={() =>
                      handleAction(
                        booking._id,
                        "REJECT"
                      )
                    }
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    <X size={18} />

                    {isProcessing
                      ? "Processing..."
                      : "Reject"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Requests;