import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Register from "../pages/Register";
import VerifyOTP from "../pages/VerifyOTP";

import ProtectedRoute from "../components/ProtectedRoute";

// =========================
// Patient
// =========================

import PatientLayout from "../layouts/PatientLayout";

import Dashboard from "../pages/patient/Dashboard";
import FindDoctor from "../pages/patient/FindDoctor";
import DoctorProfile from "../pages/patient/DoctorProfile";
import Booking from "../pages/patient/Booking";
import Checkout from "../pages/patient/Checkout";
import BookingConfirmation from "../pages/patient/BookingConfirmation";
import LiveTracking from "../pages/patient/LiveTracking";
import ConsultationHistory from "../pages/patient/ConsultationHistory";
import Prescription from "../pages/patient/Prescription";
import Profile from "../pages/patient/Profile";
import Reviews from "../pages/patient/Reviews";

// =========================
// Doctor
// =========================

import DoctorLayout from "../layouts/DoctorLayout";

import DoctorDashboard from "../pages/doctor/Dashboard";
import DoctorRequests from "../pages/doctor/Requests";
import DoctorEarnings from "../pages/doctor/Earnings";
import DoctorHistory from "../pages/doctor/History";
import DoctorProfilePage from "../pages/doctor/Profile";
import DoctorVisit from "../pages/doctor/Visit";

// =========================
// Admin
// =========================

import AdminDashboard from "../pages/admin/Dashboard";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            PUBLIC ROUTES
        ========================= */}

        <Route
          path="/"
          element={<Landing />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/verify-otp"
          element={<VerifyOTP />}
        />


        {/* =========================
            PATIENT ROUTES
        ========================= */}

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["PATIENT"]}
            />
          }
        >
          <Route
            path="/patient"
            element={<PatientLayout />}
          >

            <Route
              index
              element={
                <Navigate
                  to="/patient/dashboard"
                  replace
                />
              }
            />

            <Route
              path="dashboard"
              element={<Dashboard />}
            />

            <Route
              path="doctors"
              element={<FindDoctor />}
            />

            <Route
              path="doctors/:doctorId"
              element={<DoctorProfile />}
            />

            <Route
              path="booking/:doctorId"
              element={<Booking />}
            />

            <Route
              path="checkout"
              element={<Checkout />}
            />

            <Route
              path="booking-confirmation"
              element={<BookingConfirmation />}
            />

            <Route
              path="tracking"
              element={<LiveTracking />}
            />

            <Route
              path="history"
              element={<ConsultationHistory />}
            />

            <Route
              path="prescriptions"
              element={<Prescription />}
            />

            <Route
              path="profile"
              element={<Profile />}
            />

            <Route
              path="reviews"
              element={<Reviews />}
            />

          </Route>
        </Route>


        {/* =========================
            DOCTOR ROUTES
        ========================= */}

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["DOCTOR"]}
            />
          }
        >
          <Route
            path="/doctor"
            element={<DoctorLayout />}
          >

            <Route
              index
              element={
                <Navigate
                  to="/doctor/dashboard"
                  replace
                />
              }
            />

            <Route
              path="dashboard"
              element={<DoctorDashboard />}
            />

            <Route
              path="requests"
              element={<DoctorRequests />}
            />

            <Route
  path="visits/:bookingId"
  element={<DoctorVisit />}
/>


            <Route
              path="earnings"
              element={<DoctorEarnings />}
            />

            <Route
              path="history"
              element={<DoctorHistory />}
            />

            <Route
              path="profile"
              element={<DoctorProfilePage />}
            />

          </Route>
        </Route>


        {/* =========================
            ADMIN ROUTES
        ========================= */}

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN"]}
            />
          }
        >
          <Route
            path="/admin/dashboard"
            element={<AdminDashboard />}
          />
        </Route>


        {/* =========================
            FALLBACK ROUTE
        ========================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;