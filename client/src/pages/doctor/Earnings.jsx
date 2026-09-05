import { useEffect, useState } from "react";
import { IndianRupee, CheckCircle2 } from "lucide-react";

import { getDoctorEarnings } from "../../api/doctorApi";

const Earnings = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const result =
          await getDoctorEarnings();

        if (result.success) {
          setData(result.earnings);
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
        Loading earnings...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <p className="text-sm text-blue-600 font-medium">
        Doctor Finance
      </p>

      <h1 className="text-3xl font-bold text-slate-900 mt-1">
        Earnings
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
        <div className="bg-blue-600 text-white rounded-2xl p-7">
          <IndianRupee size={25} />

          <p className="text-blue-100 mt-5">
            Total Earnings
          </p>

          <p className="text-4xl font-bold mt-1">
            ₹
            {Number(
              data?.total || 0
            ).toLocaleString("en-IN")}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-7">
          <CheckCircle2
            className="text-emerald-600"
            size={25}
          />

          <p className="text-slate-500 mt-5">
            Completed Consultations
          </p>

          <p className="text-4xl font-bold text-slate-900 mt-1">
            {data?.consultations || 0}
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl mt-6 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">
            Completed Visits
          </h2>
        </div>

        {data?.bookings?.length ? (
          <div className="divide-y divide-slate-100">
            {data.bookings.map((booking) => (
              <div
                key={booking._id}
                className="p-5 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold">
                    Consultation
                  </p>

                  <p className="text-sm text-slate-500">
                    {booking.completedAt
                      ? new Date(
                          booking.completedAt
                        ).toLocaleDateString(
                          "en-IN"
                        )
                      : "Completed"}
                  </p>
                </div>

                <p className="font-bold text-emerald-600">
                  +₹
                  {Number(
                    booking.consultationFee || 0
                  ).toLocaleString("en-IN")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">
            No completed consultations yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default Earnings;