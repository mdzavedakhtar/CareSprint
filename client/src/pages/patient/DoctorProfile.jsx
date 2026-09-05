import { Link, useParams } from "react-router-dom";
import { MapPin, Star, ShieldCheck, Clock3 } from "lucide-react";
import PageHeader from "../../components/PageHeader";

const DoctorProfile = () => {
  const { doctorId } = useParams();

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Doctor profile"
        title="Dr. Rahul Sharma"
        description="General Physician · 5+ years experience"
      />

      <div className="mt-7 bg-white border border-slate-200 rounded-2xl p-7">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="h-24 w-24 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl font-bold">
            RS
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">
                Dr. Rahul Sharma
              </h2>

              <ShieldCheck
                size={20}
                className="text-emerald-600"
              />
            </div>

            <p className="mt-1 text-slate-500">
              General Physician · MBBS
            </p>

            <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-600">
              <span className="flex gap-1 items-center">
                <Star size={16} />
                4.8 rating
              </span>

              <span className="flex gap-1 items-center">
                <MapPin size={16} />
                1.8 km away
              </span>

              <span className="flex gap-1 items-center text-emerald-600">
                <Clock3 size={16} />
                10–15 min ETA
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-7">
          <h3 className="font-semibold">
            At-home consultation
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Consultation fee
          </p>

          <p className="text-2xl font-bold mt-1">
            ₹500
          </p>

          <Link
            to={`/patient/booking/${doctorId}`}
            className="mt-5 inline-block px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold"
          >
            Request Visit
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;