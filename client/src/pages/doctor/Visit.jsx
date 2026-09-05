import { useState } from "react";

import {
  MapPin,
  Navigation,
  CheckCircle2,
  Stethoscope,
} from "lucide-react";

import {
  updateVisitStatus,
  createPrescription,
} from "../../api/doctorApi";

const Visit = ({ booking }) => {
  const [status, setStatus] =
    useState(booking?.status);

  const [saving, setSaving] =
    useState(false);

  const [diagnosis, setDiagnosis] =
    useState("");

  const [instructions, setInstructions] =
    useState("");

  const [medicines, setMedicines] =
    useState([
      {
        name: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      },
    ]);

  if (!booking) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8">
        Visit not found.
      </div>
    );
  }

  const changeStatus = async (
    nextStatus
  ) => {
    try {
      setSaving(true);

      const result =
        await updateVisitStatus(
          booking._id,
          nextStatus
        );

      if (result.success) {
        setStatus(nextStatus);
      }
    } finally {
      setSaving(false);
    }
  };

  const openNavigation = () => {
    const coordinates =
      booking.patientLocation
        ?.coordinates;

    if (
      !coordinates ||
      coordinates.length !== 2
    ) {
      return;
    }

    const [lng, lat] = coordinates;

    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      "_blank"
    );
  };

  const updateMedicine = (
    index,
    field,
    value
  ) => {
    setMedicines((prev) =>
      prev.map((medicine, i) =>
        i === index
          ? {
              ...medicine,
              [field]: value,
            }
          : medicine
      )
    );
  };

  const addMedicine = () => {
    setMedicines((prev) => [
      ...prev,
      {
        name: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      },
    ]);
  };

  const savePrescription = async () => {
    try {
      setSaving(true);

      const validMedicines =
        medicines.filter(
          (medicine) =>
            medicine.name.trim()
        );

      const result =
        await createPrescription(
          booking._id,
          {
            bookingId: booking._id,
            diagnosis,
            medicines: validMedicines,
            instructions,
          }
        );

      if (result.success) {
        alert(
          "Prescription created successfully"
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <p className="text-sm text-blue-600 font-medium">
          Active Visit
        </p>

        <h1 className="text-3xl font-bold text-slate-900 mt-1">
          Patient Consultation
        </h1>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <p className="text-sm text-slate-500">
              Current Status
            </p>

            <p className="text-2xl font-bold text-slate-900 mt-1">
              {status}
            </p>
          </div>

          <button
            onClick={openNavigation}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white font-semibold"
          >
            <Navigation size={18} />
            Navigate to Patient
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          <div className="bg-slate-50 rounded-xl p-5">
            <p className="text-sm text-slate-500">
              Symptoms
            </p>

            <p className="font-medium text-slate-900 mt-2">
              {booking.symptoms}
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-5">
            <p className="text-sm text-slate-500">
              Location
            </p>

            <p className="font-medium text-slate-900 mt-2 flex gap-2">
              <MapPin size={18} />

              {booking.address?.area ||
                booking.address?.city ||
                "Patient location"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="font-bold text-slate-900">
          Visit Actions
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
          {status === "ACCEPTED" && (
            <button
              disabled={saving}
              onClick={() =>
                changeStatus(
                  "DOCTOR_ON_THE_WAY"
                )
              }
              className="py-3 rounded-xl bg-blue-600 text-white font-semibold"
            >
              Start Visit
            </button>
          )}

          {status ===
            "DOCTOR_ON_THE_WAY" && (
            <button
              disabled={saving}
              onClick={() =>
                changeStatus("ARRIVED")
              }
              className="py-3 rounded-xl bg-blue-600 text-white font-semibold"
            >
              Mark Arrived
            </button>
          )}

          {status === "ARRIVED" && (
            <button
              disabled={saving}
              onClick={() =>
                changeStatus("CONSULTATION")
              }
              className="py-3 rounded-xl bg-blue-600 text-white font-semibold"
            >
              Start Consultation
            </button>
          )}
        </div>
      </div>

      {(status === "CONSULTATION" ||
        status === "COMPLETED") && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center gap-2">
            <Stethoscope
              size={20}
              className="text-blue-600"
            />

            <h2 className="font-bold text-slate-900">
              Prescription
            </h2>
          </div>

          <div className="mt-5">
            <label className="text-sm font-medium text-slate-700">
              Diagnosis
            </label>

            <textarea
              value={diagnosis}
              onChange={(e) =>
                setDiagnosis(e.target.value)
              }
              rows={3}
              className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-blue-500"
              placeholder="Enter diagnosis..."
            />
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                Medicines
              </h3>

              <button
                type="button"
                onClick={addMedicine}
                className="text-sm text-blue-600 font-semibold"
              >
                + Add medicine
              </button>
            </div>

            <div className="space-y-4 mt-4">
              {medicines.map(
                (medicine, index) => (
                  <div
                    key={index}
                    className="bg-slate-50 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3"
                  >
                    <input
                      placeholder="Medicine name"
                      value={medicine.name}
                      onChange={(e) =>
                        updateMedicine(
                          index,
                          "name",
                          e.target.value
                        )
                      }
                      className="input"
                    />

                    <input
                      placeholder="Dosage"
                      value={medicine.dosage}
                      onChange={(e) =>
                        updateMedicine(
                          index,
                          "dosage",
                          e.target.value
                        )
                      }
                      className="input"
                    />

                    <input
                      placeholder="Frequency"
                      value={medicine.frequency}
                      onChange={(e) =>
                        updateMedicine(
                          index,
                          "frequency",
                          e.target.value
                        )
                      }
                      className="input"
                    />

                    <input
                      placeholder="Duration"
                      value={medicine.duration}
                      onChange={(e) =>
                        updateMedicine(
                          index,
                          "duration",
                          e.target.value
                        )
                      }
                      className="input"
                    />
                  </div>
                )
              )}
            </div>
          </div>

          <div className="mt-6">
            <label className="text-sm font-medium text-slate-700">
              Instructions
            </label>

            <textarea
              value={instructions}
              onChange={(e) =>
                setInstructions(
                  e.target.value
                )
              }
              rows={4}
              className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-blue-500"
              placeholder="Enter patient instructions..."
            />
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              disabled={saving}
              onClick={savePrescription}
              className="flex-1 py-3 rounded-xl border border-blue-200 text-blue-600 font-semibold"
            >
              Save Prescription
            </button>

            {status === "CONSULTATION" && (
              <button
                disabled={saving}
                onClick={() =>
                  changeStatus("COMPLETED")
                }
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white font-semibold"
              >
                <CheckCircle2 size={18} />
                Complete Consultation
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Visit;