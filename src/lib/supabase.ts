import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnvStatus } from "@/lib/env-validation";

export function getSupabaseServerClient() {
  if (!getSupabaseEnvStatus().configured) {
    return null;
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
