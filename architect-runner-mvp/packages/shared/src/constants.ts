export const ARCHITECT_RUNNER_VERSION = "0.1.0";

export const DEFAULT_RUNNER_POLL_INTERVAL_MS = 5000;
export const DEFAULT_RUNNER_HEARTBEAT_INTERVAL_MS = 15000;
export const DEFAULT_RUNNER_OFFLINE_THRESHOLD_SECONDS = 90;

export const DEFAULT_PAIRING_TOKEN_EXPIRY_MINUTES = 20;

export const MAX_LOG_MESSAGE_CHARS = 10000;
export const MAX_COMMAND_OUTPUT_CHARS = 20000;

export const ALLOWED_COMMANDS = [
  "pwd",
  "ls",
  "dir",
  "git status",
  "git diff --stat",
  "git diff --name-only",
  "npm run lint",
  "npm run typecheck",
  "npm run build",
  "npm test",
  "pnpm lint",
  "pnpm typecheck",
  "pnpm build",
  "pnpm test"
] as const;

export type AllowedCommand = (typeof ALLOWED_COMMANDS)[number];

export const BLOCKED_COMMAND_PATTERNS = [
  "rm -rf",
  "del /s /q",
  "rmdir /s",
  "git reset --hard",
  "git clean -fd",
  "sudo",
  "chmod -R",
  "curl | bash",
  "wget | bash",
  "supabase db reset",
  "vercel deploy --prod"
] as const;

export type BlockedCommandPattern = (typeof BLOCKED_COMMAND_PATTERNS)[number];

export const SECRET_INDICATORS = [
  "API_KEY",
  "SECRET",
  "TOKEN",
  "PASSWORD",
  "DATABASE_URL",
  "PRIVATE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "GITHUB_TOKEN",
  "VERCEL_TOKEN"
] as const;

export type SecretIndicator = (typeof SECRET_INDICATORS)[number];
