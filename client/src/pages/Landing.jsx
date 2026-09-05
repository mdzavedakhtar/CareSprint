import { Link } from "react-router-dom";
import {
  Clock3,
  ShieldCheck,
  MapPin,
  ArrowRight,
} from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              CS
            </div>

            <span className="font-bold text-xl">
              CareSprint
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-slate-600"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 pt-20 pb-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-6">
            <Clock3 size={16} />
            At-home healthcare, made faster
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
            A doctor at your
            <span className="text-blue-600">
              {" "}doorstep.
            </span>
          </h1>

          <p className="mt-6 text-lg text-slate-600 max-w-2xl leading-8">
            Find verified doctors near you and request an
            at-home consultation across Bhilai, Durg and
            Raipur.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 text-white font-semibold"
            >
              Book a Doctor
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/login"
              className="px-6 py-3.5 rounded-xl border border-slate-200 font-semibold text-slate-700"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mt-20">
          <Feature
            icon={Clock3}
            title="Fast Response"
            text="Built around a 10–15 minute arrival target."
          />

          <Feature
            icon={ShieldCheck}
            title="Verified Doctors"
            text="Doctor credentials are reviewed before activation."
          />

          <Feature
            icon={MapPin}
            title="Location Aware"
            text="Find healthcare providers based on your location."
          />
        </div>
      </section>
    </div>
  );
};

const Feature = ({ icon: Icon, title, text }) => (
  <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50">
    <div className="h-11 w-11 rounded-xl bg-white flex items-center justify-center text-blue-600 border border-slate-200">
      <Icon size={21} />
    </div>

    <h3 className="mt-5 font-semibold text-slate-900">
      {title}
    </h3>

    <p className="mt-2 text-sm leading-6 text-slate-600">
      {text}
    </p>
  </div>
);

export default Landing;