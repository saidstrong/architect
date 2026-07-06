# Architect Runner MVP — Runner Protocol

## 1. Purpose

This document defines how the **Architect Local Runner** communicates with the Architect backend and how it safely executes work on the user’s laptop.

The runner is the core execution layer of Architect Runner MVP.

The MVP must prove this loop:

```text
User opens Architect website
→ local runner connects from laptop
→ website shows machine online
→ user creates task
→ runner claims task
→ runner starts run
→ runner streams logs
→ user can pause/stop
→ runner creates final report
```

The runner protocol must be simple, safe, observable, and expandable.

---

## 2. Core Principle

The runner should not be a dangerous remote shell.

It should be a controlled execution agent.

Architect website should send structured tasks and control requests.

The runner should decide what it can safely execute according to local rules.

```text
Website = command center
Backend = state and event system
Runner = safe local executor
Laptop = private execution environment
```

---

## 3. Runner Responsibilities

The local runner is responsible for:

* authenticating with the Architect backend
* registering or reconnecting the local machine
* maintaining heartbeat
* verifying local project paths
* polling for tasks assigned to its machine
* claiming one task at a time
* creating a run
* executing the manual/terminal adapter flow
* streaming logs to the backend
* checking for pause/resume/stop requests
* creating final reports
* updating machine/task/run state
* redacting secrets from logs
* blocking unsafe actions by default

The runner should not:

* expose arbitrary shell access
* upload full private source code by default
* send `.env` files to the backend
* run destructive commands without explicit approval
* execute tasks for another user’s machine
* assume provider accounts are always available

---

## 4. Runner Lifecycle

The runner lifecycle has six main phases:

```text
1. Boot
2. Authenticate
3. Register / reconnect machine
4. Heartbeat loop
5. Task loop
6. Shutdown
```

---

## 5. Boot Phase

When started, the runner should load local configuration.

Command:

```bash
architect-runner start
```

The runner should check:

```text
local config exists
machine token exists
backend URL exists
runner version exists
network connection works
```

If no valid config exists, the runner should ask the user to pair the machine.

Suggested command:

```bash
architect-runner login
```

---

## 6. Local Config

The runner should store local configuration outside the project repo.

Recommended location:

```text
Windows:
C:\Users\<User>\.architect\config.json

macOS/Linux:
~/.architect/config.json
```

Example config:

```json
{
  "machineId": "machine_uuid",
  "machineToken": "secret_machine_token",
  "supabaseUrl": "https://project.supabase.co",
  "runnerVersion": "0.1.0",
  "machineName": "Said's Laptop",
  "pollIntervalMs": 5000,
  "heartbeatIntervalMs": 15000
}
```

Rules:

* Never commit this file to git.
* Never print the full machine token in logs.
* Never send local secrets to run logs.
* Config should be readable only by the local user when possible.

---

## 7. Pairing Protocol

The runner should connect to the user account through a pairing flow.

### Pairing flow

```text
1. User signs into Architect web app.
2. User opens Machines page.
3. User clicks Add Machine.
4. Backend creates machine record.
5. Backend creates one-time pairing token.
6. Web app shows token once.
7. User runs architect-runner login.
8. Runner asks for token.
9. Runner sends token to backend.
10. Backend validates token.
11. Backend returns machine credentials.
12. Runner stores machine credentials locally.
13. Token is marked as used.
```

### Pairing token rules

```text
Token should expire after 10–30 minutes.
Token should be shown only once.
Database should store token hash, not plain token.
Used token cannot be reused.
Expired token cannot be used.
```

---

## 8. Authentication Model

For the serious MVP, the runner should use machine credentials, not normal browser user credentials.

The runner should authenticate as:

```text
machine_id + machine_token
```

This gives cleaner separation:

```text
User browser can create tasks.
Runner can only act for its paired machine.
```

Runner-authorized actions:

```text
send heartbeat
verify assigned projects
claim assigned tasks
create runs for assigned tasks
append logs for its runs
update statuses for its runs
read pending control requests for its runs
acknowledge control requests
create reports
```

Runner should not be able to:

```text
read all user data
create arbitrary projects
create arbitrary tasks
change user settings
access another machine
access another user
```

---

## 9. Heartbeat Protocol

The runner must periodically update the machine heartbeat.

### Heartbeat interval

Recommended:

```text
Every 10–30 seconds
```

MVP default:

```text
15 seconds
```

### Heartbeat payload

```json
{
  "machineId": "machine_uuid",
  "runnerVersion": "0.1.0",
  "status": "online",
  "currentRunId": null,
  "timestamp": "2026-07-06T20:00:00Z"
}
```

### Machine status rules

```text
If runner is idle:
  machine status = online

If runner is executing a run:
  machine status = busy

If runner is paused:
  machine status = paused

If runner has a recoverable error:
  machine status = error

If heartbeat is stale:
  web app displays machine as offline
```

Suggested offline threshold:

```text
60–90 seconds without heartbeat
```

The backend may calculate offline status from heartbeat age instead of permanently writing `offline` immediately.

---

## 10. Project Verification Protocol

Projects are created in the web app, but local paths must be verified by the runner.

### Flow

```text
1. User creates project with local_path.
2. Project status becomes pending_verification.
3. Runner detects unverified projects assigned to its machine.
4. Runner checks whether local_path exists.
5. Runner checks whether path is a directory.
6. Runner updates project status.
7. Runner creates PROJECT_VERIFIED or PROJECT_INVALID_PATH event.
```

### Verification result

Valid:

```json
{
  "projectId": "project_uuid",
  "status": "verified",
  "message": "Path exists and is accessible."
}
```

Invalid:

```json
{
  "projectId": "project_uuid",
  "status": "invalid_path",
  "message": "Path does not exist or is not accessible."
}
```

### Path safety rules

The runner should reject suspicious paths:

```text
root directories
system directories
home directory as whole project
paths containing .architect config folder
paths outside allowed base directories if configured
```

Recommended blocked examples:

```text
/
C:\
C:\Windows
C:\Users\<User>
~/
~/.ssh
~/.architect
```

---

## 11. Task Polling Protocol

The runner should poll for tasks assigned to its machine.

MVP recommendation:

```text
Use polling first.
Add Realtime later.
```

Default polling interval:

```text
5 seconds when idle
2 seconds after task creation signal later
longer backoff after errors
```

The runner should only look for tasks where:

```text
machine_id = this machine id
status = queued
claimed_by_machine_id is null
project is verified
```

---

## 12. Task Claim Protocol

Task claiming must be atomic.

Goal:

```text
Only one runner can claim one task.
```

Even if MVP has one machine, use a future-safe pattern.

### Claim rules

Runner may claim a task only if:

```text
task.machine_id = runner.machine_id
task.status = queued
task.claimed_by_machine_id is null
project.status = verified
machine is not already running another task
```

### Claim result

After successful claim:

```text
task.status = claimed_by_runner
task.claimed_by_machine_id = runner.machine_id
task.claimed_at = now()
event = TASK_CLAIMED
```

If no task exists:

```text
runner continues heartbeat and polling
```

If claim fails:

```text
runner logs warning and does not execute
```

---

## 13. One Active Run Rule

For MVP:

```text
One runner should execute only one active run at a time.
```

This avoids early complexity.

Future versions may support parallel runs through:

```text
git worktrees
separate workspaces
containers
multi-agent scheduling
```

But MVP should be strict:

```text
one machine
one project at a time
one task at a time
one active run
```

---

## 14. Run Creation Protocol

After claiming a task, the runner creates a run.

### Run creation payload

```json
{
  "taskId": "task_uuid",
  "projectId": "project_uuid",
  "machineId": "machine_uuid",
  "status": "running",
  "startedAt": "2026-07-06T20:00:00Z"
}
```

After run creation:

```text
run.status = running
task.status = running
machine.status = busy
machine.current_run_id = run.id
event = RUN_STARTED
```

The runner should stream an initial log:

```text
[info] Run started.
```

---

## 15. Run Log Protocol

Logs should be append-only records sent by the runner.

### Log levels

```text
debug
info
warn
error
command
result
```

### Log payload

```json
{
  "runId": "run_uuid",
  "taskId": "task_uuid",
  "projectId": "project_uuid",
  "machineId": "machine_uuid",
  "level": "info",
  "message": "Run started.",
  "metadata": {},
  "createdAt": "2026-07-06T20:00:00Z"
}
```

### Logging rules

The runner should log:

```text
run start
task packet creation
project path verification
safe commands executed
command results
pause/resume/stop acknowledgement
errors
report creation
run completion
```

The runner should not log:

```text
.env contents
API keys
auth tokens
machine token
browser cookies
private passwords
large source files
full secret stack traces
```

---

## 16. Secret Redaction Protocol

Before sending logs to the backend, the runner must redact secrets.

### Basic redaction patterns

Redact values matching or near:

```text
OPENAI_API_KEY
ANTHROPIC_API_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
DATABASE_URL
JWT_SECRET
NEXTAUTH_SECRET
VERCEL_TOKEN
GITHUB_TOKEN
PRIVATE_KEY
PASSWORD
SECRET
TOKEN
```

### Redaction output

Example before:

```text
OPENAI_API_KEY=sk-xxxx
```

After:

```text
OPENAI_API_KEY=[REDACTED]
```

### Rule

When uncertain, redact more aggressively.

False positives are acceptable. Secret leaks are not.

---

## 17. Control Request Protocol

The web app should not directly interrupt local processes.

Instead, it creates control requests.

Control request types:

```text
pause
resume
stop
emergency_stop
```

### Flow

```text
1. User clicks Pause, Resume, Stop, or Emergency Stop.
2. Web app creates run_control_request.
3. Runner polls for pending control requests.
4. Runner acknowledges request.
5. Runner performs action.
6. Runner marks request completed/failed/ignored.
7. Runner updates run/task/machine status.
8. Runner creates event.
```

---

## 18. Pause Protocol

Pause means:

```text
Do not start new execution steps.
Keep current run state.
Allow resume later.
```

For MVP, pause does not need to freeze an already-running child process perfectly.

MVP behavior:

```text
If no command is running:
  pause immediately.

If a safe command is running:
  wait for command to finish, then pause.

If long-running command exists:
  mark pause requested and stop starting new steps.
```

After pause:

```text
run.status = paused
task.status = paused
machine.status = paused
control_request.status = completed
event = RUN_PAUSED
```

---

## 19. Resume Protocol

Resume means:

```text
Continue a paused run from the next safe step.
```

MVP behavior:

```text
Runner moves status back to running.
Runner continues manual/terminal adapter flow.
```

After resume:

```text
run.status = running
task.status = running
machine.status = busy
control_request.status = completed
event = RUN_RESUMED
```

---

## 20. Stop Protocol

Stop means:

```text
End the run safely.
Do not continue automatically.
```

MVP behavior:

```text
If no command is running:
  stop immediately.

If command is running:
  try graceful termination.

If graceful termination fails:
  mark run as stopping or failed after timeout.
```

After stop:

```text
run.status = stopped
task.status = stopped
machine.status = online
machine.current_run_id = null
control_request.status = completed
event = RUN_STOPPED
```

Runner should create a report even for stopped runs.

---

## 21. Emergency Stop Protocol

Emergency stop is stronger than normal stop.

It means:

```text
Stop active execution as quickly as safely possible.
Do not start any new task.
Clear current run state after reporting.
```

Emergency stop should:

```text
terminate active child process if possible
mark run as stopped or interrupted
mark task as stopped
mark machine as online or error depending on result
create event
create final report
```

Emergency stop should not:

```text
delete project files
reset git
clean workspace
run recovery commands automatically
```

---

## 22. Manual/Terminal Adapter Protocol

The MVP uses a manual/terminal adapter.

Purpose:

```text
Prove task dispatch, logs, pause/stop, report generation, and safety without automating external AI providers yet.
```

### Manual adapter flow

```text
1. Receive task.
2. Load project metadata.
3. Verify project path.
4. Generate task packet.
5. Log task packet to web dashboard.
6. Run safe diagnostic commands if enabled.
7. Wait for user/manual completion input or run configured check commands.
8. Capture git status and changed files if available.
9. Generate final report.
```

### Task packet should include

```text
Task title
Task description
Project name
Project path
Stack notes
Risk level
Expected commands
Safety warnings
Completion checklist
Expected summary format
```

### Minimum MVP execution

The manual adapter may simply:

```text
print task packet locally
stream task packet to web logs
run git status
run git diff --name-only
run allowed expected commands
create report
```

This is enough to test the architecture.

---

## 23. Command Execution Protocol

The runner must not execute arbitrary browser-submitted commands by default.

Commands should pass through:

```text
1. command parser
2. allowlist check
3. path guard
4. risk detector
5. secret redactor for output
6. logger
```

### Allowed by default

```text
pwd
ls
dir
git status
git diff --stat
git diff --name-only
npm run lint
npm run typecheck
npm run build
npm test
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

### Requires approval later

```text
npm install
pnpm install
npx prisma migrate
supabase migration
vercel deploy
git checkout -b
git add
git commit
```

### Blocked by default

```text
rm -rf
git reset --hard
git clean -fd
sudo
chmod -R
curl | bash
database reset
supabase db reset
production deployment
secret/env manipulation
deleting project directories
```

---

## 24. Command Result Shape

Every command result should be structured.

```json
{
  "command": "npm run build",
  "status": "failed",
  "exitCode": 1,
  "durationMs": 18234,
  "stdoutPreview": "Build output after redaction...",
  "stderrPreview": "Error output after redaction..."
}
```

Do not store unlimited output.

MVP should limit log size.

Recommended limits:

```text
max single log message: 10,000 characters
max command preview: 20,000 characters
full local output file: optional local-only artifact
```

---

## 25. Final Report Protocol

Every completed, failed, stopped, or interrupted run should produce a report.

Report fields:

```text
status
summary
commands_run
files_changed
tests_run
risks
next_steps
metadata
```

### Report creation flow

```text
1. Runner gathers command results.
2. Runner checks git diff/name-only if possible.
3. Runner summarizes run outcome.
4. Runner identifies risks.
5. Runner suggests next steps.
6. Runner stores report.
7. Runner updates run/task statuses.
8. Runner creates REPORT_CREATED event.
```

### Report example

```json
{
  "status": "completed",
  "summary": "Task execution finished. Build command passed and no unsafe commands were used.",
  "commands_run": [
    {
      "command": "git status",
      "status": "completed",
      "exitCode": 0
    },
    {
      "command": "npm run build",
      "status": "completed",
      "exitCode": 0
    }
  ],
  "files_changed": [
    {
      "path": "app/dashboard/page.tsx",
      "changeType": "modified"
    }
  ],
  "tests_run": [
    {
      "command": "npm run build",
      "status": "completed"
    }
  ],
  "risks": [],
  "next_steps": [
    "Review changed files before committing."
  ]
}
```

---

## 26. Runner Error Handling

The runner must fail visibly.

It should never silently fail.

### Common errors

```text
config missing
invalid machine token
backend unreachable
project path invalid
task claim failed
run creation failed
command failed
control request failed
report creation failed
```

### Error behavior

For task/run errors:

```text
run.status = failed
task.status = failed
machine.status = online or error
event = RUN_FAILED
report created if possible
```

For connection errors:

```text
runner logs locally
runner retries with backoff
dashboard eventually shows stale/offline
```

For project verification errors:

```text
project.status = invalid_path
event = PROJECT_INVALID_PATH
```

---

## 27. Reconnection Protocol

The runner should handle network drops and restarts.

### On restart

Runner should:

```text
1. Load config.
2. Authenticate.
3. Send heartbeat.
4. Check for active runs assigned to this machine.
5. Resolve stale running states.
6. Resume polling.
```

### Stale run handling

If runner finds a run that was running before crash:

```text
mark run = interrupted
mark task = blocked or failed
create event = RUN_INTERRUPTED
create report if possible
clear machine.current_run_id
```

MVP should avoid automatic resume after crash.

Automatic resume can come later.

---

## 28. Duplicate Execution Prevention

The runner must avoid duplicate task execution.

Rules:

```text
Only claimed tasks can be executed.
Only this machine can execute its claimed tasks.
Runner should not execute a task already running.
Runner should not claim a second task while current_run_id exists.
Task claim must be atomic.
```

If duplicate state is detected:

```text
runner logs warning
runner refuses to execute duplicate
event = TASK_DUPLICATE_CLAIM_DETECTED later if needed
```

---

## 29. Local Logging

The runner should keep local logs in addition to cloud logs.

Recommended location:

```text
~/.architect/logs/
```

Example files:

```text
runner.log
runs/<run_id>.log
```

Local logs may contain more detail than cloud logs, but still should avoid secrets when possible.

Cloud logs should be redacted and size-limited.

---

## 30. Runner CLI Commands

Minimum MVP commands:

```bash
architect-runner login
architect-runner start
architect-runner status
architect-runner logout
```

Useful later:

```bash
architect-runner projects
architect-runner verify-projects
architect-runner run-once
architect-runner doctor
architect-runner stop
```

### `architect-runner login`

Pairs machine with Architect account.

### `architect-runner start`

Starts heartbeat and task polling loop.

### `architect-runner status`

Shows local machine config and connection status.

Should redact token:

```text
Machine: Said's Laptop
Machine ID: machine_uuid
Token: [REDACTED]
Backend: connected
Runner version: 0.1.0
```

### `architect-runner logout`

Removes local machine credentials.

Should not delete cloud machine record automatically unless explicitly confirmed later.

---

## 31. Runner Loop Pseudocode

```text
load config
authenticate machine

while runner is active:
  try:
    send heartbeat

    verify pending projects for this machine

    if no active run:
      task = claim next queued task for this machine

      if task exists:
        run = create run for task
        execute manual terminal adapter
        create report
        finalize run/task/machine

    if active run:
      check control requests
      apply pause/resume/stop if requested

    sleep poll interval

  catch error:
    log locally
    send error event if possible
    backoff
```

---

## 32. Backend Operations Needed

The runner protocol needs backend operations.

For MVP, these can be implemented through Supabase client queries or RPC functions.

Better serious MVP approach:

```text
Use RPC functions for runner actions.
```

Required runner operations:

```text
pair_machine(token)
runner_heartbeat(machine_id, machine_token, payload)
runner_verify_project(machine_id, machine_token, project_id, result)
claim_next_task(machine_id, machine_token)
create_run(machine_id, machine_token, task_id)
append_run_log(machine_id, machine_token, run_id, log)
get_pending_control_requests(machine_id, machine_token, run_id)
acknowledge_control_request(machine_id, machine_token, request_id)
complete_control_request(machine_id, machine_token, request_id)
update_run_status(machine_id, machine_token, run_id, status)
create_report(machine_id, machine_token, run_id, report)
```

The key requirement:

```text
Every runner operation must validate machine identity.
```

---

## 33. Runner Status Values

Runner process status is slightly different from machine status.

Suggested runner process states:

```text
booting
authenticating
idle
verifying_project
claiming_task
running_task
paused
stopping
error
shutting_down
```

Machine status in the database can stay simpler:

```text
online
busy
paused
offline
error
```

---

## 34. Safety Gates

Before doing any execution step, the runner should pass safety gates.

### Gate 1 — Machine authorization

```text
Is this runner paired to this machine?
```

### Gate 2 — Project path

```text
Is this task tied to a verified project path?
```

### Gate 3 — Task ownership

```text
Is this task assigned to this machine and user?
```

### Gate 4 — Command safety

```text
Is this command allowed?
```

### Gate 5 — Secret redaction

```text
Is output redacted before cloud logging?
```

### Gate 6 — Control request check

```text
Has user requested pause/stop/emergency stop?
```

---

## 35. MVP Limitations

The MVP runner does not need to support:

```text
full autonomous coding
Claude/Codex/Cursor direct automation
browser automation
multi-account scheduling
automatic provider limit detection
parallel workspaces
auto-merge
deployment
database migrations
production command execution
```

These are future features.

MVP runner should focus on:

```text
connection
heartbeat
task claiming
safe manual execution
logs
controls
reports
```

---

## 36. Future Expansion Hooks

The runner protocol should leave space for:

### Agent adapters

```text
manual_terminal
claude_code
codex
cursor
kimi
grok
openai_api
```

### Workspaces

```text
main_path
git_branch
git_worktree
container
copy
```

### Roles

```text
cto
team_lead
labor
reviewer
tester
```

### Skill packages

```text
attached to project
attached to task
included in task packet
used in verification
```

### Limit tracking

```text
available
busy
limited
cooling_down
needs_login
disabled
```

---

## 37. Runner Acceptance Criteria

The runner protocol is successfully implemented when:

1. Runner can pair with web account.
2. Runner can store machine credentials locally.
3. Runner can start with `architect-runner start`.
4. Web app shows machine online.
5. Runner sends heartbeat regularly.
6. Runner verifies project paths.
7. Runner claims a queued task.
8. Runner creates a run.
9. Runner streams logs.
10. Runner blocks unsafe commands.
11. User can request pause.
12. User can request resume.
13. User can request stop.
14. Runner updates statuses correctly.
15. Runner creates final report.
16. Runner handles network errors without crashing permanently.
17. Runner redacts secrets before cloud logging.
18. Runner does not execute arbitrary remote shell commands.

---

## 38. Final Summary

The Architect Local Runner is the first real execution spine of Architect OS.

It should be designed as:

```text
safe
local-first
outbound-connected
event-driven
status-aware
task-based
provider-independent
expandable
```

The first version should not try to automate every AI provider.

It should prove the foundation:

```text
Pair machine.
Show online.
Receive task.
Claim task.
Run safely.
Stream logs.
Pause or stop.
Save report.
```

Once this works, Architect can expand into CTO agents, team leads, labor-agent adapters, skill packages, limit-aware scheduling, and remote AI software workforce orchestration.
