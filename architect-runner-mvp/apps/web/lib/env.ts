export function getAppConfig() {
  const appName = process.env.ARCHITECT_APP_NAME || "Architect Runner MVP";
  const appUrl = process.env.ARCHITECT_APP_URL || "http://localhost:3000";
  const architectEnv = process.env.ARCHITECT_ENV || "development";
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return {
    appName,
    appUrl,
    architectEnv,
    supabaseConfigured
  };
}
