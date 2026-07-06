#!/usr/bin/env node

import {
  ARCHITECT_RUNNER_VERSION,
  MACHINE_STATUSES,
  RUNNER_PLACEHOLDER_STATUS
} from "@architect-runner/shared";

const command = process.argv[2] ?? "help";

function printHelp(): void {
  console.log("Architect Runner CLI");
  console.log("");
  console.log("Usage:");
  console.log("  architect-runner status");
  console.log("  architect-runner start");
  console.log("  architect-runner version");
}

function printStatus(): void {
  console.log("Architect Runner status");
  console.log(`Version: ${ARCHITECT_RUNNER_VERSION}`);
  console.log(`Machine status: ${RUNNER_PLACEHOLDER_STATUS}`);
  console.log(`Known statuses: ${MACHINE_STATUSES.join(", ")}`);
  console.log("Pairing, heartbeat, task polling, and agents are not implemented in Phase 0.");
}

function printStart(): void {
  console.log("Architect Runner start");
  console.log(`Version: ${ARCHITECT_RUNNER_VERSION}`);
  console.log("Phase 0 placeholder only. No pairing, heartbeat, task polling, or command execution was started.");
}

switch (command) {
  case "status":
    printStatus();
    break;
  case "start":
    printStart();
    break;
  case "version":
  case "--version":
  case "-v":
    console.log(ARCHITECT_RUNNER_VERSION);
    break;
  case "help":
  case "--help":
  case "-h":
    printHelp();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exitCode = 1;
}
