import { Link } from "react-router-dom";
import PageHeader from "../../components/PageHeader";

const Booking = () => {
  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        eyebrow="Book consultation"
        title="Tell us what you need"
        description="Provide the details required for your at-home visit."
      />

      <div className="mt-7 bg-white border border-slate-200 rounded-2xl p-7">
        <div className="space-y-5">
          <Field label="Symptoms">
            <textarea
              rows="5"
              placeholder="Describe your symptoms..."
              className="input"
            />
          </Field>

          <Field label="Visit address">
            <textarea
              rows="3"
              placeholder="Enter your complete address"
              className="input"
            />
          </Field>

          <Field label="Preferred location">
            <input
              className="input"
              placeholder="Bhilai, Chhattisgarh"
            />
          </Field>

          <Link
            to="/patient/checkout"
            className="block text-center py-3 rounded-xl bg-blue-600 text-white font-semibold"
          >
            Continue to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <label className="block">
    <span className="block text-sm font-medium text-slate-700 mb-2">
      {label}
    </span>

    {children}
  </label>
);

export default Booking;