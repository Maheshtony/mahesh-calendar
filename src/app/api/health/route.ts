import { NextResponse } from "next/server";
import {
  getGoogleCalendarEnvStatus,
  getStorageMode
} from "@/lib/env-validation";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    storage: getStorageMode(),
    googleCalendar: getGoogleCalendarEnvStatus().configured
      ? "configured"
      : "not-configured",
    timestamp: new Date().toISOString()
  });
}
