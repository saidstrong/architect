import { EVENT_TYPES, type EventType } from "./events.js";
import {
  CONTROL_REQUEST_TYPES,
  MACHINE_STATUSES,
  PROJECT_STATUSES,
  RISK_LEVELS,
  RUN_LOG_LEVELS,
  RUN_STATUSES,
  TASK_STATUSES,
  type ControlRequestType,
  type MachineStatus,
  type ProjectStatus,
  type RiskLevel,
  type RunLogLevel,
  type RunStatus,
  type TaskStatus
} from "./statuses.js";

function isOneOf<T extends readonly string[]>(
  values: T,
  value: string
): value is T[number] {
  return (values as readonly string[]).includes(value);
}

export function isMachineStatus(value: string): value is MachineStatus {
  return isOneOf(MACHINE_STATUSES, value);
}

export function isProjectStatus(value: string): value is ProjectStatus {
  return isOneOf(PROJECT_STATUSES, value);
}

export function isTaskStatus(value: string): value is TaskStatus {
  return isOneOf(TASK_STATUSES, value);
}

export function isRunStatus(value: string): value is RunStatus {
  return isOneOf(RUN_STATUSES, value);
}

export function isRunLogLevel(value: string): value is RunLogLevel {
  return isOneOf(RUN_LOG_LEVELS, value);
}

export function isControlRequestType(
  value: string
): value is ControlRequestType {
  return isOneOf(CONTROL_REQUEST_TYPES, value);
}

export function isRiskLevel(value: string): value is RiskLevel {
  return isOneOf(RISK_LEVELS, value);
}

export function isSharedEventType(value: string): value is EventType {
  return isOneOf(EVENT_TYPES, value);
}
