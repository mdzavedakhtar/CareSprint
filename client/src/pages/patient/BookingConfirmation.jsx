import { CheckCircle, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";

const BookingConfirmation = () => (
  <div className="max-w-xl mx-auto text-center">
    <div className="bg-white border border-slate-200 rounded-3xl p-10">
      <CheckCircle
        size={64}
        className="mx-auto text-emerald-600"
      />

      <h1 className="mt-6 text-3xl font-bold">
        Visit requested
      </h1>

      <p className="mt-3 text-slate-500">
        Your request has been submitted successfully.
      </p>

      <div className="mt-7 p-5 rounded-2xl bg-emerald-50 text-emerald-800">
        <div className="flex items-center justify-center gap-2 font-semibold">
          <Clock3 size={18} />
          Target arrival: 10–15 minutes
        </div>
      </div>

      <Link
        to="/patient/tracking"
        className="mt-6 block py-3 rounded-xl bg-blue-600 text-white font-semibold"
      >
        View Visit
      </Link>
    </div>
  </div>
);

export default BookingConfirmation;