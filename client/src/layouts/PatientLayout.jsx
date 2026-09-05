import { MapPin, Bell } from "lucide-react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

const PatientLayout = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
          <div className="h-16 px-4 md:px-8 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <MapPin size={15} />
                <span>
                  {user?.address || "Bhilai, Chhattisgarh"}
                </span>
              </div>
            </div>

            <button className="h-10 w-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50">
              <Bell size={19} />
            </button>
          </div>
        </header>

        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PatientLayout;