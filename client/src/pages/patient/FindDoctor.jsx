import { Search, MapPin, Star, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const doctors = [
  {
    id: "demo-1",
    name: "Dr. Rahul Sharma",
    specialization: "General Physician",
    experience: "5+ years",
    rating: "4.8",
    distance: "1.8 km",
    eta: "10–15 min",
    fee: 500,
  },
  {
    id: "demo-2",
    name: "Dr. Priya Verma",
    specialization: "General Physician",
    experience: "7+ years",
    rating: "4.9",
    distance: "2.4 km",
    eta: "12–15 min",
    fee: 600,
  },
];

const FindDoctor = () => {
  const [search, setSearch] = useState("");

  const filtered = doctors.filter((doctor) =>
    `${doctor.name} ${doctor.specialization}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div>
        <p className="text-sm text-slate-500">
          Healthcare providers
        </p>

        <h1 className="mt-1 text-3xl font-bold">
          Find a Doctor
        </h1>

        <p className="mt-2 text-slate-500">
          Discover verified doctors available near you.
        </p>
      </div>

      <div className="mt-7 bg-white border border-slate-200 rounded-2xl p-4 flex gap-3">
        <div className="flex-1 flex items-center gap-3">
          <Search className="text-slate-400" size={20} />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctor or specialization"
            className="w-full outline-none text-sm"
          />
        </div>

        <div className="hidden md:flex items-center gap-2 px-4 text-sm text-slate-500 border-l border-slate-200">
          <MapPin size={16} />
          Bhilai
        </div>
      </div>

      <div className="mt-7 space-y-4">
        {filtered.map((doctor) => (
          <DoctorCard
            key={doctor.id}
            doctor={doctor}
          />
        ))}
      </div>
    </div>
  );
};

const DoctorCard = ({ doctor }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6">
    <div className="flex flex-col md:flex-row md:items-center gap-5">
      <div className="h-16 w-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
        {doctor.name
          .split(" ")
          .slice(1)
          .map((x) => x[0])
          .join("")}
      </div>

      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold text-lg">
            {doctor.name}
          </h2>

          <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
            Verified
          </span>
        </div>

        <p className="mt-1 text-sm text-slate-500">
          {doctor.specialization} · {doctor.experience}
        </p>

        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <Star
              size={15}
              className="fill-current"
            />
            {doctor.rating}
          </span>

          <span className="flex items-center gap-1">
            <MapPin size={15} />
            {doctor.distance}
          </span>

          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <Clock3 size={15} />
            {doctor.eta}
          </span>
        </div>
      </div>

      <div className="md:text-right">
        <p className="text-xs text-slate-500">
          Consultation
        </p>

        <p className="text-xl font-bold">
          ₹{doctor.fee}
        </p>

        <Link
          to={`/patient/doctors/${doctor.id}`}
          className="mt-3 inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold"
        >
          View Doctor
        </Link>
      </div>
    </div>
  </div>
);

export default FindDoctor;