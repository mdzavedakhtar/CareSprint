import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { authAPI } from "../services/api";

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    address: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await authAPI.registerPatient(form);

      if (response.data.success) {
        navigate(
          `/verify-otp?phone=${encodeURIComponent(form.phone)}`
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <Link
          to="/"
          className="block text-center font-bold text-2xl mb-8"
        >
          CareSprint
        </Link>

        <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm">
          <h1 className="text-2xl font-bold">
            Create your account
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Register as a patient to book at-home healthcare.
          </p>

          <form
            onSubmit={submit}
            className="mt-7 space-y-4"
          >
            <Field
              label="Full name"
              value={form.name}
              onChange={(v) => update("name", v)}
              placeholder="Your full name"
            />

            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => update("email", v)}
              placeholder="you@example.com"
            />

            <Field
              label="Phone"
              value={form.phone}
              onChange={(v) => update("phone", v)}
              placeholder="9876543210"
            />

            <Field
              label="Password"
              type="password"
              value={form.password}
              onChange={(v) => update("password", v)}
              placeholder="Minimum 8 characters"
            />

            <Field
              label="Address"
              value={form.address}
              onChange={(v) => update("address", v)}
              placeholder="Bhilai, Chhattisgarh"
            />

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-600 font-semibold"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const Field = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}) => (
  <label className="block">
    <span className="block text-sm font-medium text-slate-700 mb-2">
      {label}
    </span>

    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      required
    />
  </label>
);

export default Register;