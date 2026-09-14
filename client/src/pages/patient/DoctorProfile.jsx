import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin, Star, ShieldCheck, Clock3 } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import { patientAPI } from "../../services/api";

const DoctorProfile = () => {
  const { doctorId } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    patientAPI
      .doctorDetails(doctorId)
      .then((res) => {
        if (!ignore && res.data.success) {
          setDoctor(res.data.doctor);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.response?.data?.message || "Doctor details not found");
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [doctorId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center text-slate-500">
        <div className="h-8 w-8 mx-auto mb-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        Loading doctor profile...
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="max-w-5xl mx-auto bg-white border border-slate-200 rounded-2xl p-8 text-center">
        <p className="text-red-600 font-semibold">{error || "Doctor profile not found"}</p>
        <Link to="/patient/doctors" className="mt-4 inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">
          Back to Find Doctors
        </Link>
      </div>
    );
  }

  const initials = doctor.name
    ? doctor.name
        .split(" ")
        .filter((x) => x && x !== "Dr.")
        .map((x) => x[0])
        .join("") || "DR"
    : "DR";

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Doctor Profile"
        title={doctor.name}
        description={`${doctor.specialization} · ${doctor.experience}+ years experience`}
      />

      <div className="mt-7 bg-white border border-slate-200 rounded-2xl p-7 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="h-24 w-24 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl font-bold">
            {initials}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900">{doctor.name}</h2>
              <ShieldCheck size={22} className="text-emerald-600" />
            </div>

            <p className="mt-1 text-slate-500 font-medium">
              {doctor.specialization} · {doctor.qualification}
            </p>

            <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-600">
              <span className="flex gap-1.5 items-center font-medium text-amber-600">
                <Star size={16} className="fill-current text-amber-500" />
                {doctor.rating || "4.8"} rating
              </span>

              <span className="flex gap-1.5 items-center">
                <MapPin size={16} />
                Operating Radius: {doctor.serviceRadius || 10} km
              </span>

              <span className="flex gap-1.5 items-center text-emerald-600 font-medium">
                <Clock3 size={16} />
                Available for dispatch
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-900">At-Home Consultation Visit</h3>
            <p className="mt-1 text-sm text-slate-500">Consultation Fee</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">₹{doctor.consultationFee}</p>
          </div>

          <Link
            to={`/patient/booking/${doctor.id || doctor.doctorId}`}
            className="px-6 py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-center"
          >
            Request Visit
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;