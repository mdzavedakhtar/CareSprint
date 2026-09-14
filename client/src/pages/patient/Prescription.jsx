import { useEffect, useState } from "react";
import { FileText, Stethoscope, Printer, Calendar, ShieldCheck, Pill } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import { patientAPI } from "../../services/api";

const Prescription = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    patientAPI
      .prescriptions()
      .then((res) => {
        if (!ignore && res.data.success) {
          setPrescriptions(res.data.prescriptions || []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handlePrint = (scriptId) => {
    const printElement = document.getElementById(`prescription-${scriptId}`);
    if (!printElement) return;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>CareSprint Digital Prescription</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
            .title { font-size: 24px; font-weight: bold; color: #1e293b; }
            .badge { color: #059669; font-weight: 600; font-size: 13px; margin-top: 4px; }
            .section { margin-bottom: 24px; }
            .section-title { font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            th { background-color: #f8fafc; font-weight: 600; color: #475569; }
            .box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; font-size: 14px; line-height: 1.5; }
            .footer { margin-top: 40px; pt: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
          </style>
        </head>
        <body>
          ${printElement.innerHTML}
          <div class="footer">CareSprint Healthcare Telemedicine Platform · Verified Digital Prescription</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Medical Records"
        title="Digital Prescriptions"
        description="Access, view, and print verified digital prescriptions issued by your doctors."
      />

      {loading ? (
        <div className="mt-7 bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
          <div className="h-8 w-8 mx-auto mb-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          Loading digital prescriptions...
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="mt-7 bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
          <FileText size={42} className="mx-auto text-slate-300 mb-3" />
          <h3 className="font-semibold text-slate-800 text-lg">No prescriptions available</h3>
          <p className="text-sm text-slate-500 mt-1">
            Digital prescriptions issued by doctors after completed visits will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-7 space-y-6">
          {prescriptions.map((script) => (
            <div
              key={script._id}
              className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm hover:border-slate-300 transition"
            >
              <div id={`prescription-${script._id}`}>
                <div className="flex items-start justify-between border-b pb-5">
                  <div>
                    <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                      <Stethoscope size={22} className="text-blue-600" />
                      {script.doctorId?.userId?.name || "Dr. Medical Prescriber"}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                      {script.doctorId?.specialization || "General Physician"} · License #{script.doctorId?.licenseNumber || "VERIFIED-DOC"}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-1">
                      <ShieldCheck size={14} /> Digitally Signed Prescription
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 justify-end">
                      <Calendar size={14} />
                      {new Date(script.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handlePrint(script._id)}
                      className="mt-3 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg transition inline-flex items-center gap-1.5"
                    >
                      <Printer size={14} />
                      Print / Download PDF
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Chief Diagnosis
                    </span>
                    <span className="font-semibold text-slate-800 text-sm">
                      {script.diagnosis || "General Consultation Checkup"}
                    </span>
                  </div>
                  {script.followUpAdvice && (
                    <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100">
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                        Follow-Up Advice
                      </span>
                      <span className="font-medium text-emerald-900 text-sm">
                        {script.followUpAdvice}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Pill size={15} className="text-blue-600" />
                    Prescribed Medication & Dosage
                  </h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                          <th className="p-3">Medicine</th>
                          <th className="p-3">Dosage</th>
                          <th className="p-3">Frequency</th>
                          <th className="p-3">Duration</th>
                          <th className="p-3">Instructions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {script.medicines?.map((med, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-3 font-semibold text-slate-800">{med.name}</td>
                            <td className="p-3 text-slate-600">{med.dosage || "-"}</td>
                            <td className="p-3 text-slate-600">{med.frequency || "-"}</td>
                            <td className="p-3 text-slate-600">{med.duration || "-"}</td>
                            <td className="p-3 text-slate-500 text-xs">{med.instructions || "As advised"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {(script.instructions || script.notes) && (
                  <div className="mt-5 bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                    <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block mb-1">
                      Doctor's Instructions & Care Notes
                    </span>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {script.instructions || script.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Prescription;