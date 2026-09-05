import { useEffect, useState } from "react";

import { CalendarDays } from "lucide-react";

import { getDoctorVisitHistory } from "../../api/doctorApi";

const History = () => {
  const [visits, setVisits] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const result =
          await getDoctorVisitHistory();

        if (result.success) {
          setVisits(result.visits || []);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        Loading visit history...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <p className="text-sm text-blue-600 font-medium">
        Doctor Portal
      </p>

      <h1 className="text-3xl font-bold text-slate-900 mt-1">
        Visit History
      </h1>

      <p className="text-slate-500 mt-1">
        Review your previous patient visits.
      </p>

      <div className="mt-8 bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {visits.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            No visit history available.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visits.map((visit) => (
              <div
                key={visit._id}
                className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <CalendarDays
                      size={20}
                    />
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      Patient Visit
                    </p>

                    <p className="text-sm text-slate-500 mt-1">
                      {visit.symptoms}
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
                      {visit.createdAt
                        ? new Date(
                            visit.createdAt
                          ).toLocaleString(
                            "en-IN"
                          )
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:block md:text-right">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                      visit.status ===
                      "COMPLETED"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {visit.status}
                  </span>

                  <p className="font-bold text-slate-900 mt-2">
                    ₹
                    {Number(
                      visit.consultationFee || 0
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;