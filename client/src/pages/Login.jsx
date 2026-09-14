import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  useEffect(() => {
    if (user && user.role) {
      const role = String(user.role).toUpperCase();
      if (role === "ADMIN") {
        navigate("/admin/dashboard", { replace: true });
      } else if (role === "DOCTOR") {
        navigate("/doctor/dashboard", { replace: true });
      } else if (role === "PATIENT") {
        navigate("/patient/dashboard", { replace: true });
      }
    }
  }, [user, navigate]);

  const [form, setForm] = useState({
    phone: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await login(form);

      console.log("LOGIN RESPONSE:", result);
      console.log("LOGIN USER:", result?.user);
      console.log("LOGIN ROLE:", result?.user?.role);

      if (!result?.success) {
        setError(
          result?.message ||
            "Invalid phone or password"
        );
        return;
      }

      const role = String(
        result?.user?.role || ""
      ).toUpperCase();

      if (role === "ADMIN") {
        navigate("/admin/dashboard", {
          replace: true,
        });
        return;
      }

      if (role === "DOCTOR") {
        navigate("/doctor/dashboard", {
          replace: true,
        });
        return;
      }

      if (role === "PATIENT") {
        navigate("/patient/dashboard", {
          replace: true,
        });
        return;
      }

      setError(
        "Invalid account role. Please contact administrator."
      );
    } catch (err) {
      console.error("LOGIN ERROR:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <Link
          to="/"
          className="block text-center font-bold text-2xl text-slate-900 mb-8"
        >
          CareSprint
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7">

          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to manage your healthcare visits.
          </p>

          <form
            onSubmit={submit}
            className="mt-7 space-y-5"
          >

            <Input
              label="Phone number"
              value={form.phone}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  phone: value,
                }))
              }
              placeholder="9876543210"
            />

            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  password: value,
                }))
              }
              placeholder="••••••••"
            />

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? "Signing in..."
                : "Sign In"}
            </button>

          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Don't have an account?{" "}

            <Link
              to="/register"
              className="text-blue-600 font-semibold"
            >
              Create one
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

const Input = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}) => {
  return (
    <label className="block">

      <span className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        required
      />

    </label>
  );
};

export default Login;