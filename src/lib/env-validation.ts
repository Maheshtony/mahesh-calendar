import "server-only";

type EnvVarName =
  | "GOOGLE_CLIENT_EMAIL"
  | "GOOGLE_PRIVATE_KEY"
  | "GOOGLE_CALENDAR_ID"
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "SUPABASE_SERVICE_ROLE_KEY";

type EnvValidationResult = {
  configured: boolean;
  missing: EnvVarName[];
};

function hasValue(value: string | undefined) {
  return Boolean(value?.trim());
}

function validateEnvVars(requiredVars: EnvVarName[]): EnvValidationResult {
  const missing = requiredVars.filter((name) => !hasValue(process.env[name]));

  return {
    configured: missing.length === 0,
    missing
  };
}

export function getGoogleCalendarEnvStatus() {
  return validateEnvVars([
    "GOOGLE_CLIENT_EMAIL",
    "GOOGLE_PRIVATE_KEY",
    "GOOGLE_CALENDAR_ID"
  ]);
}

export function getSupabaseEnvPresence() {
  return {
    supabaseUrlPresent: hasValue(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseServiceKeyPresent: hasValue(process.env.SUPABASE_SERVICE_ROLE_KEY)
  };
}

export function getSupabaseEnvStatus() {
  const { supabaseUrlPresent, supabaseServiceKeyPresent } =
    getSupabaseEnvPresence();
  const missing: EnvVarName[] = [];

  if (!supabaseUrlPresent) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!supabaseServiceKeyPresent) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  return {
    configured: missing.length === 0,
    missing
  };
}

export function getStorageMode() {
  if (getSupabaseEnvStatus().configured) {
    return "supabase";
  }

  return isProduction() ? "not-configured" : "local-json";
}

export function getGooglePrivateKey() {
  return process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}
