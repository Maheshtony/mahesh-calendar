import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnvStatus } from "@/lib/env-validation";

function normalizeSupabaseUrl(rawUrl: string) {
  const url = new URL(rawUrl.trim());

  url.pathname = "";
  url.search = "";
  url.hash = "";

  return url.toString().replace(/\/$/, "");
}

export function getSupabaseServerClient() {
  if (!getSupabaseEnvStatus().configured) {
    return null;
  }

  const supabaseUrl = normalizeSupabaseUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL!
  );
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
