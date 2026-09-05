import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-10 w-10 mx-auto mb-4 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />

          <p className="text-slate-600">
            Loading CareSprint...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    if (user.role === "ADMIN") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (user.role === "DOCTOR") {
      return <Navigate to="/doctor/dashboard" replace />;
    }

    return <Navigate to="/patient/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;