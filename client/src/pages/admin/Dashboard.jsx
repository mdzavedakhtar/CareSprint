const Dashboard = () => {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <p className="text-sm font-medium text-blue-600">
            CareSprint Admin
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-slate-500">
            Manage doctors, patients, bookings and platform operations.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
            <div className="rounded-xl border border-slate-200 p-5 bg-slate-50">
              <p className="text-sm text-slate-500">
                Doctor Verification
              </p>

              <p className="text-2xl font-bold text-slate-900 mt-2">
                Pending
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-5 bg-slate-50">
              <p className="text-sm text-slate-500">
                Patients
              </p>

              <p className="text-2xl font-bold text-slate-900 mt-2">
                Manage
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-5 bg-slate-50">
              <p className="text-sm text-slate-500">
                Bookings
              </p>

              <p className="text-2xl font-bold text-slate-900 mt-2">
                Monitor
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;