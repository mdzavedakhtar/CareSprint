import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/PageHeader";
import { patientAPI } from "../../services/api";

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    gender: "PREFER_NOT_TO_SAY",
    medicalNotes: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let ignore = false;
    patientAPI
      .profile()
      .then((res) => {
        if (!ignore && res.data.success) {
          const p = res.data.profile;
          setProfile(p);
          setForm({
            name: p.name || user?.name || "",
            address: p.address || user?.address || "",
            gender: p.gender || "PREFER_NOT_TO_SAY",
            medicalNotes: p.medicalNotes || "",
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await patientAPI.updateProfile(form);
      if (res.data.success) {
        setMessage("Profile updated successfully");
        setProfile(res.data.profile);
        setEditing(false);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        eyebrow="Account"
        title="Patient Profile"
        description="Manage your CareSprint personal information and visit address."
      />

      {loading ? (
        <div className="mt-7 bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
          <div className="h-8 w-8 mx-auto mb-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          Loading profile...
        </div>
      ) : (
        <div className="mt-7 bg-white border border-slate-200 rounded-2xl p-7 shadow-sm">
          {message && (
            <div className="mb-6 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm">
              {message}
            </div>
          )}

          {!editing ? (
            <div className="space-y-5">
              <Info label="Full Name" value={profile?.name || user?.name} />
              <Info label="Email Address" value={profile?.email || user?.email} />
              <Info label="Phone Number" value={profile?.phone || user?.phone} />
              <Info label="Default Visit Address" value={profile?.address || user?.address} />
              <Info label="Gender" value={profile?.gender} />
              <Info label="Medical Notes / Allergies" value={profile?.medicalNotes} />

              <button
                onClick={() => setEditing(true)}
                className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition"
              >
                Edit Profile
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Default Visit Address</label>
                <textarea
                  rows={3}
                  value={form.address}
                  onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                  <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Medical Notes / Allergies</label>
                <textarea
                  rows={3}
                  value={form.medicalNotes}
                  onChange={(e) => setForm((prev) => ({ ...prev, medicalNotes: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500"
                  placeholder="Mention any existing conditions or drug allergies..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

const Info = ({ label, value }) => (
  <div className="border-b border-slate-100 pb-4 last:border-0">
    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    <p className="mt-1 font-semibold text-slate-800 text-sm">{value || "Not provided"}</p>
  </div>
);

export default Profile;