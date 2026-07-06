export const MACHINE_STATUSES = [
  "online",
  "offline",
  "busy",
  "paused",
  "error"
] as const;

export type MachineStatus = (typeof MACHINE_STATUSES)[number];

export const PROJECT_STATUSES = [
  "pending_verification",
  "verified",
  "invalid_path",
  "archived"
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const TASK_STATUSES = [
  "created",
  "queued",
  "claimed_by_runner",
  "running",
  "paused",
  "stopping",
  "stopped",
  "completed",
  "failed",
  "blocked"
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const RUN_STATUSES = [
  "pending",
  "running",
  "paused",
  "stopping",
  "stopped",
  "completed",
  "failed",
  "interrupted"
] as const;

export type RunStatus = (typeof RUN_STATUSES)[number];

export const RUN_LOG_LEVELS = [
  "debug",
  "info",
  "warn",
  "error",
  "command",
  "result"
] as const;

export type RunLogLevel = (typeof RUN_LOG_LEVELS)[number];

export const CONTROL_REQUEST_TYPES = [
  "pause",
  "resume",
  "stop",
  "emergency_stop"
] as const;

export type ControlRequestType = (typeof CONTROL_REQUEST_TYPES)[number];

export const CONTROL_REQUEST_STATUSES = [
  "pending",
  "acknowledged",
  "completed",
  "failed",
  "ignored"
] as const;

export type ControlRequestStatus = (typeof CONTROL_REQUEST_STATUSES)[number];

export const RISK_LEVELS = ["low", "medium", "high", "critical"] as const;

export type RiskLevel = (typeof RISK_LEVELS)[number];
