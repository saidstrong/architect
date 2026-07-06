export const ARCHITECT_RUNNER_VERSION = "0.1.0";

export const MACHINE_STATUSES = [
  "online",
  "offline",
  "busy",
  "paused",
  "error"
] as const;

export type MachineStatus = (typeof MACHINE_STATUSES)[number];

export const RUNNER_PLACEHOLDER_STATUS = "offline" satisfies MachineStatus;
