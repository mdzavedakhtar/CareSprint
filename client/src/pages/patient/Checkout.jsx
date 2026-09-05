import { Link } from "react-router-dom";
import PageHeader from "../../components/PageHeader";

const Checkout = () => (
  <div className="max-w-3xl mx-auto">
    <PageHeader
      eyebrow="Checkout"
      title="Review your visit"
      description="Confirm consultation details before payment."
    />

    <div className="mt-7 bg-white border border-slate-200 rounded-2xl p-7">
      <div className="flex justify-between py-4 border-b">
        <span className="text-slate-500">
          Doctor consultation
        </span>
        <span className="font-semibold">₹500</span>
      </div>

      <div className="flex justify-between py-4 border-b">
        <span className="text-slate-500">
          Platform fee
        </span>
        <span className="font-semibold">₹0</span>
      </div>

      <div className="flex justify-between py-5">
        <span className="font-bold">Total</span>
        <span className="text-xl font-bold">
          ₹500
        </span>
      </div>

      <Link
        to="/patient/booking-confirmation"
        className="block text-center py-3 rounded-xl bg-blue-600 text-white font-semibold"
      >
        Continue
      </Link>
    </div>
  </div>
);

export default Checkout;