import type { EventType } from "./events.js";
import type {
  ControlRequestStatus,
  ControlRequestType,
  MachineStatus,
  ProjectStatus,
  RiskLevel,
  RunLogLevel,
  RunStatus,
  TaskStatus
} from "./statuses.js";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type ReportStatus = Extract<
  RunStatus,
  "completed" | "failed" | "stopped" | "interrupted"
>;

export interface ArchitectMachine {
  id: string;
  userId: string;
  name: string;
  status: MachineStatus;
  runnerVersion?: string | null;
  machineTokenHash?: string | null;
  tokenLastRotatedAt?: string | null;
  pairedAt?: string | null;
  revokedAt?: string | null;
  lastHeartbeatAt?: string | null;
  lastSeenAt?: string | null;
  currentRunId?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArchitectProject {
  id: string;
  userId: string;
  machineId: string;
  name: string;
  localPath: string;
  description?: string | null;
  stack?: string | null;
  status: ProjectStatus;
  verificationMessage?: string | null;
  lastVerifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArchitectTask {
  id: string;
  userId: string;
  projectId: string;
  machineId: string;
  title: string;
  description: string;
  priority: 1 | 2 | 3 | 4;
  status: TaskStatus;
  riskLevel: RiskLevel;
  expectedCommands: string[];
  notes?: string | null;
  claimedByMachineId?: string | null;
  claimedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArchitectRun {
  id: string;
  userId: string;
  taskId: string;
  projectId: string;
  machineId: string;
  status: RunStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  summary?: string | null;
  errorMessage?: string | null;
  exitCode?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArchitectRunLog {
  id: string;
  userId: string;
  runId: string;
  taskId: string;
  projectId: string;
  machineId: string;
  level: RunLogLevel;
  message: string;
  metadata: JsonObject;
  createdAt: string;
}

export interface ArchitectRunControlRequest {
  id: string;
  userId: string;
  runId: string;
  taskId: string;
  machineId: string;
  type: ControlRequestType;
  status: ControlRequestStatus;
  message?: string | null;
  requestedAt: string;
  acknowledgedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArchitectEvent {
  id: string;
  userId: string;
  machineId?: string | null;
  projectId?: string | null;
  taskId?: string | null;
  runId?: string | null;
  type: EventType;
  payload: JsonObject;
  createdAt: string;
}

export interface ArchitectReport {
  id: string;
  userId: string;
  runId: string;
  taskId: string;
  projectId: string;
  machineId: string;
  status: ReportStatus;
  summary: string;
  commandsRun: CommandRunResult[];
  filesChanged: FileChangeResult[];
  testsRun: TestRunResult[];
  risks: RiskResult[];
  nextSteps: string[];
  metadata: JsonObject;
  createdAt: string;
}

export type AgentProvider =
  | "manual"
  | "openai"
  | "claude"
  | "codex"
  | "cursor"
  | "kimi"
  | "grok"
  | "local_model"
  | "custom";

export type AgentAdapterType =
  | "manual"
  | "api"
  | "local_cli"
  | "browser_account"
  | "desktop_app"
  | "custom";

export type AgentRole =
  | "cto"
  | "team_lead"
  | "labor"
  | "reviewer"
  | "tester"
  | "security_reviewer"
  | "deployment_operator";

export type AgentCapability =
  | "planning"
  | "task_breakdown"
  | "code_editing"
  | "terminal_commands"
  | "testing"
  | "debugging"
  | "code_review"
  | "security_review"
  | "deployment"
  | "documentation"
  | "summarization"
  | "vision"
  | "browser_use";

export type AdapterAvailabilityStatus =
  | "available"
  | "busy"
  | "paused"
  | "limited"
  | "cooling_down"
  | "needs_login"
  | "missing_dependency"
  | "offline"
  | "disabled"
  | "error";

export interface CommandRunResult {
  command: string;
  status: "completed" | "failed" | "blocked" | "skipped";
  exitCode?: number;
  durationMs?: number;
  stdoutPreview?: string;
  stderrPreview?: string;
}

export interface FileChangeResult {
  path: string;
  changeType: "added" | "modified" | "deleted" | "renamed" | "unknown";
}

export interface TestRunResult {
  command: string;
  status: "passed" | "failed" | "skipped" | "blocked";
  summary?: string;
  exitCode?: number;
}

export interface RiskResult {
  level: RiskLevel;
  message: string;
  source?: "adapter" | "runner" | "test" | "human" | "provider";
}
