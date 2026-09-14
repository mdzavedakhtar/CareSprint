import { CheckCircle, Clock3, ArrowRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const BookingConfirmation = () => {
  const location = useLocation();
  const booking = location.state?.booking;

  return (
    <div className="max-w-xl mx-auto text-center">
      <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm">
        <CheckCircle size={64} className="mx-auto text-emerald-600" />

        <h1 className="mt-6 text-3xl font-bold text-slate-900">Visit Requested</h1>

        <p className="mt-3 text-slate-500 leading-relaxed">
          Your request has been submitted successfully and entered the matching queue.
        </p>

        {booking && (
          <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left text-xs text-slate-600 space-y-1.5">
            <p><span className="font-semibold text-slate-800">Booking ID:</span> {booking._id || booking.id}</p>
            <p><span className="font-semibold text-slate-800">Status:</span> {booking.status}</p>
            <p><span className="font-semibold text-slate-800">Fee:</span> ₹{booking.consultationFee}</p>
          </div>
        )}

        <div className="mt-7 p-5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-100">
          <div className="flex items-center justify-center gap-2 font-semibold">
            <Clock3 size={18} />
            Target arrival: 10–15 minutes
          </div>
        </div>

        <Link
          to="/patient/tracking"
          className="mt-6 inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
        >
          Track Visit Status
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
};

export default BookingConfirmation;