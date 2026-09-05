import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();

  const phone = searchParams.get("phone") || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!phone) {
      navigate("/register", { replace: true });
    }
  }, [phone, navigate]);

  const submit = async (e) => {
    e.preventDefault();

    setError("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.verifyOTP({
  phone,
  otp,
});

      if (response.data.success) {
        await refreshUser();
        navigate("/patient/dashboard", { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "OTP verification failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="block text-center font-bold text-2xl mb-8 text-slate-900"
        >
          CareSprint
        </Link>

        <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm">
          <div className="text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center">
              <span className="text-2xl">??</span>
            </div>

            <h1 className="mt-5 text-2xl font-bold text-slate-900">
              Verify your phone
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Enter the 6-digit OTP sent to
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              {phone}
            </p>
          </div>

          <form onSubmit={submit} className="mt-7">
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-2">
                Verification code
              </span>

              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) =>
                  setOtp(
                    e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6)
                  )
                }
                placeholder="Enter 6-digit OTP"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none text-center text-2xl tracking-[0.5em] focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              />
            </label>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="mt-5 w-full py-3 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            OTP is valid for 5 minutes.
          </p>

          <p className="mt-3 text-center text-sm text-slate-600">
            Wrong phone number?{" "}
            <Link
              to="/register"
              className="text-blue-600 font-semibold"
            >
              Register again
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
