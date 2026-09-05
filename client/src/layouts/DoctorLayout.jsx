import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  UserRound,
  ClipboardList,
  Wallet,
  History,
  LogOut,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const DoctorLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const links = [
    {
      to: "/doctor/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      to: "/doctor/requests",
      label: "Requests",
      icon: ClipboardList,
    },
    {
      to: "/doctor/earnings",
      label: "Earnings",
      icon: Wallet,
    },
    {
      to: "/doctor/history",
      label: "Visit History",
      icon: History,
    },
    {
      to: "/doctor/profile",
      label: "Profile",
      icon: UserRound,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              CS
            </div>

            <div>
              <h1 className="font-bold text-slate-900">
                CareSprint
              </h1>

              <p className="text-xs text-slate-500">
                Doctor Portal
              </p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1 flex-1">
          {links.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-50"
                  }`
                }
              >
                <Icon size={19} />
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">
              Doctor Portal
            </p>

            <p className="font-semibold text-slate-900">
              {user?.name || "Doctor"}
            </p>
          </div>

          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
            {user?.name?.charAt(0)?.toUpperCase() ||
              "D"}
          </div>
        </header>

        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DoctorLayout;