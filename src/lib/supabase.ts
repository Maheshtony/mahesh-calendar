import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnvStatus } from "@/lib/env-validation";

export function getSupabaseServerClient() {
  if (!getSupabaseEnvStatus().configured) {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

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
