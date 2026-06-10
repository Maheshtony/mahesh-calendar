import { NextResponse } from "next/server";
import { getStorageMode } from "@/lib/env-validation";
import { generateSlotsForRange } from "@/lib/slots";
import { readBookingsInRange } from "@/lib/storage";

export const dynamic = "force-dynamic";
const storageNotConfiguredMessage =
  "Booking storage is not configured. Please contact Mahesh.";
const unableToLoadSlotsMessage = "Unable to load slots. Please refresh the page.";

function isValidIsoDate(value: string | null) {
  return Boolean(value && !Number.isNaN(Date.parse(value)));
}

function getRequestedRange(searchParams: URLSearchParams) {
  const start = searchParams.get("start") || searchParams.get("rangeStart");
  const end = searchParams.get("end") || searchParams.get("rangeEnd");
  const date = searchParams.get("date");

  if (isValidIsoDate(start) && isValidIsoDate(end)) {
    const rangeStart = new Date(start as string);
    const rangeEnd = new Date(end as string);

    if (rangeStart < rangeEnd) {
      return {
        rangeStartIso: rangeStart.toISOString(),
        rangeEndIso: rangeEnd.toISOString()
      };
    }
  }

  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const rangeStart = new Date(`${date}T00:00:00.000Z`);
    const rangeEnd = new Date(rangeStart);
    rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 1);

    return {
      rangeStartIso: rangeStart.toISOString(),
      rangeEndIso: rangeEnd.toISOString()
    };
  }

  const rangeStart = new Date();
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + 1);

  return {
    rangeStartIso: rangeStart.toISOString(),
    rangeEndIso: rangeEnd.toISOString()
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const visitorTimezone =
    searchParams.get("timezone") || "Local timezone";
  try {
    const storageMode = getStorageMode();
    const { rangeStartIso, rangeEndIso } = getRequestedRange(searchParams);
    const bookings = await readBookingsInRange(rangeStartIso, rangeEndIso);
    const busyRanges = bookings.map((booking) => ({
      start: booking.slotStart,
      end: booking.slotEnd
    }));

    return NextResponse.json({
      source: storageMode,
      message:
        storageMode === "local-json"
          ? "Local development fallback is active. Configure Supabase for production."
          : "Availability is loaded from Supabase bookings.",
      slots: generateSlotsForRange(
        busyRanges,
        visitorTimezone,
        rangeStartIso,
        rangeEndIso
      )
    });
  } catch (error) {
    console.error("[api/slots] Unable to load slots", error);
    const isStorageNotConfigured =
      error instanceof Error && error.message === storageNotConfiguredMessage;

    return NextResponse.json(
      {
        source: "not-configured",
        message: isStorageNotConfigured
          ? storageNotConfiguredMessage
          : unableToLoadSlotsMessage,
        slots: []
      },
      { status: isStorageNotConfigured ? 503 : 500 }
    );
  }
}
