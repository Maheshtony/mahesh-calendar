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

export function getSupabaseEnvStatus() {
  return validateEnvVars([
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY"
  ]);
}

export function getStorageMode() {
  return getSupabaseEnvStatus().configured ? "supabase" : "local-json";
}

export function getGooglePrivateKey() {
  return process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
}
