import { NextResponse } from "next/server";
import {
  getGoogleCalendarEnvStatus,
  getStorageMode,
  isProduction
} from "@/lib/env-validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const googleConfigured = getGoogleCalendarEnvStatus().configured;
  const productionMissingGoogle = isProduction() && !googleConfigured;

  return NextResponse.json({
    status: productionMissingGoogle ? "error" : "ok",
    storage: getStorageMode(),
    googleCalendar: googleConfigured ? "configured" : "not-configured",
    timestamp: new Date().toISOString()
  });
}
