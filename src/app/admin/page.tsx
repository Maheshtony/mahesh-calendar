"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  MAHESH_TIMEZONE,
  MAHESH_TIMEZONE_LABEL,
  formatDurationLabel,
  formatSlotRangeInTimeZone
} from "@/lib/slots";

type AdminBooking = {
  id: string;
  name: string;
  email: string;
  notes: string;
  start_time: string;
  end_time: string;
  timezone: string;
  status: "confirmed" | "cancelled";
  created_at: string;
  cancelled_at: string | null;
  google_event_id: string | null;
  google_event_html_link: string | null;
  calendar_sync_status: string | null;
  calendar_synced_at: string | null;
  cancel_token: string | null;
};

type Filter = "upcoming" | "cancelled" | "past" | "all";

function formatAdminDate(iso?: string | null) {
  if (!iso) {
    return "Not set";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(iso));
}

function getBucket(booking: AdminBooking): Exclude<Filter, "all"> {
  if (booking.status === "cancelled") {
    return "cancelled";
  }

  return Date.parse(booking.end_time) >= Date.now() ? "upcoming" : "past";
}

function getCancelLink(booking: AdminBooking) {
  if (!booking.cancel_token) {
    return "";
  }

  return `/cancel?id=${encodeURIComponent(booking.id)}&token=${encodeURIComponent(
    booking.cancel_token
  )}`;
}

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const secret = searchParams.get("secret") || "";
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/bookings?secret=${encodeURIComponent(secret)}`
      );
      const payload = (await response.json()) as {
        bookings?: AdminBooking[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load dashboard.");
      }

      setBookings(payload.bookings || []);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load dashboard."
      );
    } finally {
      setIsLoading(false);
    }
  }, [secret]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const summary = useMemo(
    () => ({
      upcoming: bookings.filter((booking) => getBucket(booking) === "upcoming")
        .length,
      cancelled: bookings.filter(
        (booking) => getBucket(booking) === "cancelled"
      ).length,
      past: bookings.filter((booking) => getBucket(booking) === "past").length,
      all: bookings.length
    }),
    [bookings]
  );

  const visibleBookings = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesFilter = filter === "all" || getBucket(booking) === filter;
      const matchesSearch =
        !searchTerm ||
        booking.name.toLowerCase().includes(searchTerm) ||
        booking.email.toLowerCase().includes(searchTerm);

      return matchesFilter && matchesSearch;
    });
  }, [bookings, filter, search]);

  return (
    <main className="min-h-screen bg-[#f5f8fb] p-4 md:p-6">
      <section className="mx-auto max-w-6xl space-y-5">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-ocean">
                Mahesh Calendar
              </p>
              <h1 className="mt-2 text-3xl font-black text-ink md:text-4xl">
                Mahesh Calendar Dashboard
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-slate-600">
                Manage your upcoming meetings, cancellations, and calendar sync
                status.
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadBookings()}
              className="rounded-md bg-ocean px-5 py-3 text-sm font-bold text-white transition hover:bg-[#166474]"
            >
              Refresh
            </button>
          </div>
          <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm font-bold leading-6 text-slate-500">
            Tip: On iPhone, open this page in Safari, tap Share, then Add to
            Home Screen.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Upcoming meetings", summary.upcoming],
            ["Cancelled meetings", summary.cancelled],
            ["Past meetings", summary.past],
            ["Total meetings", summary.all]
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-sm font-bold text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-black text-ink">{value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["upcoming", "cancelled", "past", "all"] as Filter[]).map(
                (nextFilter) => (
                  <button
                    key={nextFilter}
                    type="button"
                    onClick={() => setFilter(nextFilter)}
                    className={`rounded-md border px-3 py-2 text-sm font-bold capitalize transition ${
                      filter === nextFilter
                        ? "border-ocean bg-ocean text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-ocean"
                    }`}
                  >
                    {nextFilter}
                  </button>
                )
              )}
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or email"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15 lg:max-w-xs"
            />
          </div>
        </div>

        {isLoading ? (
          <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm font-bold text-slate-500 shadow-sm">
            Loading bookings...
          </p>
        ) : error ? (
          <p className="rounded-lg border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700 shadow-sm">
            {error}
          </p>
        ) : visibleBookings.length ? (
          <div className="space-y-3">
            {visibleBookings.map((booking) => {
              const cancelLink = getCancelLink(booking);

              return (
                <article
                  key={booking.id}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-black text-ink">
                          {booking.name}
                        </h2>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase text-slate-600">
                          {booking.status}
                        </span>
                        {booking.calendar_sync_status ? (
                          <span className="rounded-full bg-[#eef8fa] px-3 py-1 text-xs font-black uppercase text-ocean">
                            {booking.calendar_sync_status}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm font-bold text-slate-500">
                        {booking.email}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      {booking.google_event_html_link ? (
                        <a
                          href={booking.google_event_html_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex justify-center rounded-md bg-ocean px-4 py-2 text-sm font-bold text-white transition hover:bg-[#166474]"
                        >
                          Open Google Calendar Event
                        </a>
                      ) : null}
                      {booking.status === "confirmed" && cancelLink ? (
                        <Link
                          href={cancelLink}
                          className="inline-flex justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink transition hover:border-ocean hover:bg-[#f7fbfc]"
                        >
                          Cancel Booking
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <Info
                      label="Client selected time"
                      value={formatSlotRangeInTimeZone(
                        booking.start_time,
                        booking.end_time,
                        booking.timezone
                      )}
                    />
                    <Info
                      label="Mahesh IST time"
                      value={formatSlotRangeInTimeZone(
                        booking.start_time,
                        booking.end_time,
                        MAHESH_TIMEZONE,
                        MAHESH_TIMEZONE_LABEL
                      )}
                    />
                    <Info
                      label="Duration"
                      value={formatDurationLabel(
                        booking.start_time,
                        booking.end_time
                      )}
                    />
                    <Info label="Client timezone" value={booking.timezone} />
                    <Info label="Created" value={formatAdminDate(booking.created_at)} />
                    {booking.cancelled_at ? (
                      <Info
                        label="Cancelled"
                        value={formatAdminDate(booking.cancelled_at)}
                      />
                    ) : null}
                  </div>

                  <div className="mt-3 rounded-md bg-slate-50 p-3">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                      Notes
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm font-bold leading-6 text-slate-700">
                      {booking.notes || "No notes provided."}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm font-bold text-slate-500 shadow-sm">
            No bookings match this view.
          </p>
        )}
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold leading-6 text-ink">{value}</p>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f5f8fb] p-4 md:p-6">
          <section className="mx-auto max-w-6xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">
              Loading dashboard...
            </p>
          </section>
        </main>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
