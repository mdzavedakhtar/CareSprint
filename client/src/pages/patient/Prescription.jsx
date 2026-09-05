import PageHeader from "../../components/PageHeader";

const Prescription = () => (
  <div className="max-w-5xl mx-auto">
    <PageHeader
      eyebrow="Medical records"
      title="Prescriptions"
      description="Access prescriptions from your consultations."
    />

    <div className="mt-7 bg-white border border-slate-200 rounded-2xl p-8 text-center">
      <p className="font-semibold">
        No prescriptions available
      </p>

      <p className="text-sm text-slate-500 mt-2">
        Digital prescriptions will appear after consultation.
      </p>
    </div>
  </div>
);

export default Prescription;