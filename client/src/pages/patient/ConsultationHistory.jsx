import PageHeader from "../../components/PageHeader";

const ConsultationHistory = () => (
  <div className="max-w-5xl mx-auto">
    <PageHeader
      eyebrow="Medical history"
      title="Consultation History"
      description="View your previous at-home consultations."
    />

    <div className="mt-7 bg-white border border-slate-200 rounded-2xl p-8 text-center">
      <p className="font-semibold">
        No completed consultations yet
      </p>

      <p className="text-sm text-slate-500 mt-2">
        Your completed visits will appear here.
      </p>
    </div>
  </div>
);

export default ConsultationHistory;