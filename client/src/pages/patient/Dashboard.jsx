import { useEffect, useState } from "react";
import {
  ArrowRight,
  Clock3,
  MapPin,
  ShieldCheck,
  Stethoscope,
  Calendar,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { patientAPI } from "../../services/api";

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    let ignore = false;
    patientAPI
      .dashboard()
      .then((res) => {
        if (!ignore && res.data.success) {
          setData(res.data.dashboard);
        }
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  const firstName = user?.name?.split(" ")[0] || "there";
  const upcoming = data?.upcomingVisit;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Patient Dashboard</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Good day, {firstName}
          </h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <MapPin size={16} />
            {data?.patient?.address || user?.address || "Bhilai, Chhattisgarh"}
          </div>
        </div>

        <Link
          to="/patient/doctors"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
        >
          Find a Doctor
          <ArrowRight size={18} />
        </Link>
      </div>

      <div className="mt-8 grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-7 text-white shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-100 text-sm">Need Healthcare At Home?</p>
              <h2 className="mt-2 text-3xl font-bold">A verified doctor can come to you.</h2>
              <p className="mt-3 text-blue-100 max-w-lg leading-relaxed">
                Request an on-demand at-home consultation visit across Bhilai, Durg, and Raipur with nearby verified active doctors.
              </p>
            </div>
            <div className="hidden sm:flex h-14 w-14 rounded-2xl bg-white/15 items-center justify-center">
              <Stethoscope size={27} />
            </div>
          </div>
          <Link
            to="/patient/doctors"
            className="inline-flex mt-7 px-5 py-3 bg-white text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition"
          >
            Find available doctors
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-7 flex flex-col justify-between shadow-sm">
          <div>
            <p className="text-sm text-slate-500 font-medium">Upcoming Visit</p>
            {upcoming ? (
              <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">
                      {upcoming.doctorId?.userId?.name || "Doctor Assigned"}
                    </h3>
                    <p className="text-xs text-blue-600 font-medium mt-0.5">
                      Status: {upcoming.status}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500 line-clamp-2">
                  Symptoms: {upcoming.symptoms}
                </p>
              </div>
            ) : (
              <div className="mt-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Stethoscope size={21} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">No active visit</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Book a doctor whenever you need one.
                  </p>
                </div>
              </div>
            )}
          </div>

          <Link
            to={upcoming ? "/patient/tracking" : "/patient/doctors"}
            className="mt-6 block text-center py-3 rounded-xl border border-slate-200 text-sm font-semibold hover:bg-slate-50 text-slate-800 transition"
          >
            {upcoming ? "Track Active Visit" : "Book a Consultation"}
          </Link>
        </div>
      </div>

      <div className="mt-8 grid md:grid-cols-3 gap-5">
        <QuickCard
          icon={Clock3}
          title="Fast Response"
          text="Location-aware matching engine targeted for rapid arrival."
        />
        <QuickCard
          icon={ShieldCheck}
          title="Verified Doctors Only"
          text="Credentials and licenses audited before active deployment."
        />
        <QuickCard
          icon={MapPin}
          title="Nearby Care"
          text="GPS spatial radius matching across Bhilai, Durg & Raipur."
        />
      </div>
    </div>
  );
};

const QuickCard = ({ icon: Icon, title, text }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
    <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
      <Icon size={20} />
    </div>
    <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
    <p className="mt-2 text-sm text-slate-500 leading-6">{text}</p>
  </div>
);

export default Dashboard;