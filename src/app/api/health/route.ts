import { NextResponse } from "next/server";
import {
  getGoogleCalendarEnvStatus,
  getSupabaseEnvPresence,
  getStorageMode,
} from "@/lib/env-validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const googleConfigured = getGoogleCalendarEnvStatus().configured;
  const supabaseEnvPresence = getSupabaseEnvPresence();
  const storage = getStorageMode();

  return NextResponse.json({
    status: storage === "not-configured" ? "error" : "ok",
    storage,
    googleCalendar: googleConfigured ? "configured" : "not-configured",
    supabaseUrlPresent: supabaseEnvPresence.supabaseUrlPresent,
    supabaseServiceKeyPresent: supabaseEnvPresence.supabaseServiceKeyPresent,
    timestamp: new Date().toISOString()
  });
}
