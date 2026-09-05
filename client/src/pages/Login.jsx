import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

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

      if (result.success) {
        const role = result.user?.role;

        if (role === "ADMIN") {
          navigate("/admin/dashboard");
        } else if (role === "DOCTOR") {
          navigate("/doctor/dashboard");
        } else {
          navigate("/patient/dashboard");
        }
      } else {
        setError(result.message || "Invalid phone or password");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPage
      title="Welcome back"
      subtitle="Sign in to manage your healthcare visits."
    >
      <form onSubmit={submit} className="space-y-5">
        <Input
          label="Phone number"
          value={form.phone}
          onChange={(value) =>
            setForm({
              ...form,
              phone: value,
            })
          }
          placeholder="9876543210"
        />

        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={(value) =>
            setForm({
              ...form,
              password: value,
            })
          }
          placeholder="••••••••"
        />

        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p className="text-center text-sm text-slate-600">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-blue-600 font-semibold"
          >
            Create one
          </Link>
        </p>
      </form>
    </AuthPage>
  );
};

const AuthPage = ({ title, subtitle, children }) => {
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
            {title}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {subtitle}
          </p>

          <div className="mt-7">
            {children}
          </div>
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
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        required
      />
    </label>
  );
};

export default Login;