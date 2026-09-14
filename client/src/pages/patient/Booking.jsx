import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { patientAPI } from "../../services/api";

const Booking = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [symptoms, setSymptoms] = useState("");
  const [address, setAddress] = useState(user?.address || "");
  const [specialization, setSpecialization] = useState("General Physician");
  const [fee, setFee] = useState(500);

  useEffect(() => {
    if (doctorId && doctorId !== "demo-1" && doctorId !== "demo-2") {
      patientAPI
        .doctorDetails(doctorId)
        .then((res) => {
          if (res.data.success && res.data.doctor) {
            setSpecialization(res.data.doctor.specialization || "General Physician");
            setFee(res.data.doctor.consultationFee || 500);
          }
        })
        .catch(() => {});
    }
  }, [doctorId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!symptoms.trim() || !address.trim()) return;

    navigate("/patient/checkout", {
      state: {
        doctorId,
        symptoms: symptoms.trim(),
        address: address.trim(),
        specialization,
        consultationFee: fee,
      },
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        eyebrow="Book Consultation"
        title="Tell us what you need"
        description="Provide the details required for your at-home medical visit."
      />

      <div className="mt-7 bg-white border border-slate-200 rounded-2xl p-7 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Symptoms / Chief Complaints">
            <textarea
              rows={4}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Describe your symptoms (e.g. High fever, headache, body pain since morning)..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
              required
            />
          </Field>

          <Field label="Complete Visit Address">
            <textarea
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter house no., street, landmark, area (Bhilai / Durg / Raipur)"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
              required
            />
          </Field>

          <Field label="Medical Specialization Required">
            <input
              type="text"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
              required
            />
          </Field>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            Continue to Checkout
          </button>
        </form>
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