import { NextResponse } from "next/server";
import { getStorageMode } from "@/lib/env-validation";
import { generateSlotsFromBusyRanges } from "@/lib/slots";
import { readBookings } from "@/lib/storage";

export const dynamic = "force-dynamic";
const storageNotConfiguredMessage =
  "Booking storage is not configured. Please contact Mahesh.";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const visitorTimezone =
    searchParams.get("timezone") || "Local timezone";
  try {
    const storageMode = getStorageMode();
    const bookings = await readBookings();
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
      slots: generateSlotsFromBusyRanges(busyRanges, visitorTimezone)
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : storageNotConfiguredMessage;

    return NextResponse.json(
      {
        source: "not-configured",
        message,
        slots: []
      },
      { status: message === storageNotConfiguredMessage ? 503 : 500 }
    );
  }
}
