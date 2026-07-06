#!/usr/bin/env node

import {
  ARCHITECT_RUNNER_VERSION,
  MACHINE_STATUSES,
  RUN_STATUSES
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
  console.log(`Architect Runner v${ARCHITECT_RUNNER_VERSION}`);
  console.log(`Supported machine statuses: ${MACHINE_STATUSES.join(", ")}`);
  console.log(`Supported run statuses: ${RUN_STATUSES.join(", ")}`);
  console.log("Pairing, heartbeat, task polling, and agents are not implemented in Phase 1.");
}

function printStart(): void {
  console.log("Architect Runner start");
  console.log(`Version: ${ARCHITECT_RUNNER_VERSION}`);
  console.log("Phase 1 placeholder only. No pairing, heartbeat, task polling, or command execution was started.");
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
