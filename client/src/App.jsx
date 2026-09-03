function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Care<span className="text-blue-600">Sprint</span>
            </h1>

            <p className="text-xs text-slate-500">
              At-Home Healthcare
            </p>
          </div>

          <div className="text-sm text-slate-500">
            Bhilai • Durg • Raipur
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-[80vh] max-w-7xl items-center justify-center px-6">
        <div className="text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-600">
            On-Demand Healthcare
          </p>

          <h2 className="text-4xl font-bold tracking-tight text-slate-900">
            Trusted Healthcare,
            <br />
            Delivered to Your Doorstep.
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-slate-600">
            CareSprint connects patients with nearby verified healthcare
            professionals for convenient at-home consultations.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <button className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700">
              Find a Doctor
            </button>

            <button className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100">
              Join as Doctor
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;