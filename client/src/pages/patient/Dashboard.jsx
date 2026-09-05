import {
  ArrowRight,
  Clock3,
  MapPin,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();

  const firstName =
    user?.name?.split(" ")[0] || "there";

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            Patient Dashboard
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Good afternoon, {firstName}
          </h1>

          <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <MapPin size={16} />
            {user?.address || "Bhilai, Chhattisgarh"}
          </div>
        </div>

        <Link
          to="/patient/doctors"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold"
        >
          Find a Doctor
          <ArrowRight size={18} />
        </Link>
      </div>

      <div className="mt-8 grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-7 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-100 text-sm">
                Need healthcare?
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                A doctor can come to you.
              </h2>

              <p className="mt-3 text-blue-100 max-w-lg">
                Request an at-home consultation and find
                available verified doctors near your location.
              </p>
            </div>

            <div className="hidden sm:flex h-14 w-14 rounded-2xl bg-white/15 items-center justify-center">
              <Stethoscope size={27} />
            </div>
          </div>

          <Link
            to="/patient/doctors"
            className="inline-flex mt-7 px-5 py-3 bg-white text-blue-700 rounded-xl font-semibold"
          >
            Find available doctors
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-7">
          <p className="text-sm text-slate-500">
            Upcoming Visit
          </p>

          <div className="mt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
              <Stethoscope size={21} />
            </div>

            <div>
              <h3 className="font-semibold">
                No upcoming visit
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Book a doctor when you need one.
              </p>
            </div>
          </div>

          <Link
            to="/patient/doctors"
            className="mt-6 block text-center py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
          >
            Book a consultation
          </Link>
        </div>
      </div>

      <div className="mt-8 grid md:grid-cols-3 gap-5">
        <QuickCard
          icon={Clock3}
          title="Fast Response"
          text="Built around a 10–15 minute arrival target."
        />

        <QuickCard
          icon={ShieldCheck}
          title="Verified Doctors"
          text="Doctor credentials are verified before activation."
        />

        <QuickCard
          icon={MapPin}
          title="Nearby Care"
          text="Location-based doctor discovery."
        />
      </div>
    </div>
  );
};

const QuickCard = ({ icon: Icon, title, text }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-6">
    <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
      <Icon size={20} />
    </div>

    <h3 className="mt-4 font-semibold">
      {title}
    </h3>

    <p className="mt-2 text-sm text-slate-500 leading-6">
      {text}
    </p>
  </div>
);

export default Dashboard;