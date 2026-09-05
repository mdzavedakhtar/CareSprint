import { MapPin, Navigation, Phone } from "lucide-react";
import PageHeader from "../../components/PageHeader";

const LiveTracking = () => (
  <div className="max-w-5xl mx-auto">
    <PageHeader
      eyebrow="Live visit"
      title="Doctor is on the way"
      description="Track your doctor's estimated arrival."
    />

    <div className="mt-7 grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 min-h-[400px] rounded-3xl bg-slate-200 flex items-center justify-center">
        <div className="text-center text-slate-500">
          <MapPin size={42} className="mx-auto mb-3" />
          <p className="font-medium">
            Live map will appear here
          </p>
          <p className="text-sm mt-1">
            Google Maps integration
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="h-14 w-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
          <Navigation size={22} />
        </div>

        <h2 className="mt-5 text-xl font-bold">
          Dr. Rahul Sharma
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          General Physician
        </p>

        <div className="mt-6 p-4 rounded-xl bg-blue-50">
          <p className="text-sm text-blue-700">
            Estimated arrival
          </p>

          <p className="text-3xl font-bold text-blue-900 mt-1">
            09 min
          </p>
        </div>

        <button className="mt-5 w-full py-3 rounded-xl border border-slate-200 flex items-center justify-center gap-2">
          <Phone size={17} />
          Contact Doctor
        </button>
      </div>
    </div>
  </div>
);

export default LiveTracking;