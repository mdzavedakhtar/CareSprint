import { useEffect, useState } from "react";

import { getDoctorProfile } from "../../api/doctorApi";

const Profile = () => {
  const [doctor, setDoctor] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const result =
          await getDoctorProfile();

        if (result.success) {
          setDoctor(result.doctor);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        Loading profile...
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="p-6 text-red-600">
        Doctor profile unavailable.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <p className="text-sm text-blue-600 font-medium">
        Doctor Profile
      </p>

      <h1 className="text-3xl font-bold text-slate-900 mt-1">
        Professional Profile
      </h1>

      <div className="bg-white border border-slate-200 rounded-2xl p-7 mt-8">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold">
            {doctor.userId?.name
              ?.charAt(0)
              ?.toUpperCase() || "D"}
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {doctor.userId?.name ||
                "Doctor"}
            </h2>

            <p className="text-slate-500">
              {doctor.specialization}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
          <Info
            label="Qualification"
            value={doctor.qualification}
          />

          <Info
            label="Experience"
            value={`${doctor.experience} years`}
          />

          <Info
            label="Consultation Fee"
            value={`₹${doctor.consultationFee}`}
          />

          <Info
            label="Medical License"
            value={doctor.licenseNumber}
          />

          <Info
            label="Verification"
            value={doctor.verificationStatus}
          />

          <Info
            label="Availability"
            value={doctor.availabilityStatus}
          />
        </div>
      </div>
    </div>
  );
};

const Info = ({ label, value }) => (
  <div className="bg-slate-50 rounded-xl p-4">
    <p className="text-xs text-slate-500">
      {label}
    </p>

    <p className="font-semibold text-slate-900 mt-1">
      {value || "—"}
    </p>
  </div>
);

export default Profile;