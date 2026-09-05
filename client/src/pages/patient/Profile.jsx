import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/PageHeader";

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Manage your CareSprint account information."
      />

      <div className="mt-7 bg-white border border-slate-200 rounded-2xl p-7 space-y-5">
        <Info label="Name" value={user?.name} />
        <Info label="Email" value={user?.email} />
        <Info label="Phone" value={user?.phone} />
        <Info label="Address" value={user?.address} />
      </div>
    </div>
  );
};

const Info = ({ label, value }) => (
  <div className="border-b border-slate-100 pb-4 last:border-0">
    <p className="text-xs text-slate-500">
      {label}
    </p>
    <p className="mt-1 font-medium">
      {value || "Not provided"}
    </p>
  </div>
);

export default Profile;