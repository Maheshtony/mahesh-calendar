import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-mist">
      <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-ocean">
            Personal booking calendar
          </p>
          <h1 className="text-5xl font-black leading-tight text-ink md:text-6xl">
            Mahesh Calendar
          </h1>
          <p className="mt-5 max-w-2xl text-xl leading-8 text-slate-700">
            Book a 30-minute meeting with Mahesh. View open slots in your local
            timezone and reserve the time that works best for you.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/calendar"
              className="rounded-md bg-ocean px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-[#166474]"
            >
              View Availability
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
          <div className="grid grid-cols-7 gap-2 text-center text-sm font-bold text-slate-500">
            {["M", "T", "W", "T", "F", "S", "S"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }, (_, index) => {
              const isOpen = [8, 9, 10, 15, 16, 22, 23, 24].includes(index);

              return (
                <div
                  key={index}
                  className={`aspect-square rounded-md border text-sm font-bold ${
                    isOpen
                      ? "border-ocean bg-[#e7f5f7] text-ocean"
                      : "border-slate-200 bg-slate-50 text-slate-300"
                  }`}
                >
                  <span className="flex h-full items-center justify-center">
                    {index + 1}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex items-center justify-between rounded-md bg-slate-50 p-4">
            <div>
              <p className="text-sm font-bold text-ink">Next opening</p>
              <p className="text-sm text-slate-600">
                Times convert automatically
              </p>
            </div>
            <span className="rounded-md bg-coral px-3 py-2 text-sm font-bold text-white">
              30 min
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
