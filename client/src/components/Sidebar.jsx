import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  CalendarCheck,
  FileText,
  User,
  Star,
  MapPin,
  LogOut,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const links = [
  {
    label: "Dashboard",
    path: "/patient/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Find a Doctor",
    path: "/patient/doctors",
    icon: Search,
  },
  {
    label: "My Visits",
    path: "/patient/history",
    icon: CalendarCheck,
  },
  {
    label: "Prescriptions",
    path: "/patient/prescriptions",
    icon: FileText,
  },
  {
    label: "Reviews",
    path: "/patient/reviews",
    icon: Star,
  },
  {
    label: "Profile",
    path: "/patient/profile",
    icon: User,
  },
];

const Sidebar = () => {
  const { logout } = useAuth();

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex-col">
      <div className="px-6 py-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
            CS
          </div>

          <div>
            <h1 className="font-bold text-xl text-slate-900">
              CareSprint
            </h1>

            <p className="text-xs text-slate-500">
              At-home healthcare
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
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
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-600 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={19} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;