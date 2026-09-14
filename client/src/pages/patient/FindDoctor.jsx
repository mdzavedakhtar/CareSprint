import { useEffect, useState } from "react";
import { Search, MapPin, Star, Clock3, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { patientAPI } from "../../services/api";

const FindDoctor = () => {
  const [search, setSearch] = useState("");
  const [doctorsList, setDoctorsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    patientAPI
      .doctors({ search })
      .then((res) => {
        if (!ignore && res.data.success) {
          setDoctorsList(res.data.doctors || []);
        }
      })
      .catch(() => {
        if (!ignore) setDoctorsList([]);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [search]);

  return (
    <div className="max-w-7xl mx-auto">
      <div>
        <p className="text-sm text-slate-500 font-medium">Healthcare Providers</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Find a Doctor</h1>
        <p className="mt-2 text-slate-500">
          Discover verified, active & available doctors near your location.
        </p>
      </div>

      <div className="mt-7 bg-white border border-slate-200 rounded-2xl p-4 flex gap-3 shadow-sm">
        <div className="flex-1 flex items-center gap-3">
          <Search className="text-slate-400" size={20} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by doctor name or medical specialization..."
            className="w-full outline-none text-sm text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="hidden md:flex items-center gap-2 px-4 text-sm text-slate-500 border-l border-slate-200 font-medium">
          <MapPin size={16} />
          Bhilai / Durg / Raipur
        </div>
      </div>

      <div className="mt-7 space-y-4">
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
            <div className="h-8 w-8 mx-auto mb-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            <p className="text-sm">Searching available verified doctors...</p>
          </div>
        ) : doctorsList.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
            <UserCheck size={36} className="mx-auto text-slate-300 mb-3" />
            <h3 className="font-semibold text-slate-800 text-lg">No available doctors found</h3>
            <p className="mt-1 text-sm text-slate-500">
              Only verified and currently online/available doctors are listed for new bookings. Try adjusting your search query.
            </p>
          </div>
        ) : (
          doctorsList.map((doctor) => (
            <DoctorCard key={doctor.id || doctor.doctorId} doctor={doctor} />
          ))
        )}
      </div>
    </div>
  );
};

const DoctorCard = ({ doctor }) => {
  const initials = doctor.name
    ? doctor.name
        .split(" ")
        .filter((x) => x && x !== "Dr.")
        .map((x) => x[0])
        .join("") || "DR"
    : "DR";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm hover:border-slate-300 transition">
      <div className="flex flex-col md:flex-row md:items-center gap-5">
        <div className="h-16 w-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
          {initials}
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-lg text-slate-900">{doctor.name}</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200/60">
              Verified
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200/60">
              Available
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {doctor.specialization} · {doctor.experience}
          </p>

          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1 font-medium text-amber-600">
              <Star size={15} className="fill-current text-amber-500" />
              {doctor.rating || "4.8"}
            </span>

            <span className="flex items-center gap-1">
              <MapPin size={15} />
              {doctor.distance || "Nearby"}
            </span>

            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <Clock3 size={15} />
              {doctor.eta || "10–15 min"}
            </span>
          </div>
        </div>

        <div className="md:text-right border-t md:border-t-0 pt-4 md:pt-0">
          <p className="text-xs text-slate-500 font-medium">Consultation Fee</p>
          <p className="text-2xl font-bold text-slate-900">₹{doctor.consultationFee || doctor.fee || 500}</p>
          <Link
            to={`/patient/doctors/${doctor.id || doctor.doctorId}`}
            className="mt-3 inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
          >
            View Doctor
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FindDoctor;