# Architect Runner MVP — Build Phases

## 1. Purpose

This document defines the strict implementation order for Architect Runner MVP.

The goal is to prevent chaotic building.

The MVP must be built in controlled phases:

```text
1. Set up foundation.
2. Build web shell.
3. Build database.
4. Build runner pairing.
5. Build heartbeat.
6. Build project verification.
7. Build task dispatch.
8. Build run execution.
9. Build logs and controls.
10. Build reports.
11. Harden safety.
```

Do not build advanced AI orchestration before the basic runner loop works.

---

## 2. Final MVP Target

The MVP is complete when this works:

```text
User signs in
→ adds machine
→ pairs local runner
→ runner appears online
→ user registers local project
→ runner verifies project path
→ user creates task
→ runner claims task
→ runner creates run
→ logs stream to dashboard
→ user can pause/resume/stop
→ runner creates final report
→ event timeline shows what happened
```

The MVP should support:

```text
one user
one local runner
one machine
one project
one active task
one active run
manual/terminal adapter only
```

---

# Phase 0 — Project Setup

## Goal

Create the monorepo foundation.

## Build

Recommended structure:

```text
architect-runner-mvp/
  apps/
    web/
    runner/
  packages/
    shared/
  docs/
  package.json
  turbo.json
  tsconfig.json
```

## Tasks

1. Create monorepo.
2. Add TypeScript.
3. Add shared package.
4. Add lint/build scripts.
5. Add environment examples.
6. Add docs folder.
7. Add base README.

## Required Files

```text
README.md
.env.example
docs/project-context.md
docs/system-architecture.md
docs/data-model.md
docs/runner-protocol.md
docs/agent-adapter-interface.md
docs/security-rules.md
docs/product-requirements.md
docs/build-phases.md
```

## Acceptance Criteria

Phase 0 is complete when:

1. Monorepo installs successfully.
2. TypeScript compiles.
3. Web app placeholder runs.
4. Runner placeholder runs.
5. Shared package can export types.
6. README explains setup.

---

# Phase 1 — Shared Types

## Goal

Create shared status constants and types used by both web app and runner.

## Build

Inside:

```text
packages/shared/src/
```

Create:

```text
statuses.ts
events.ts
types.ts
schemas.ts
constants.ts
index.ts
```

## Required Types

Machine statuses:

```text
online
offline
busy
paused
error
```

Project statuses:

```text
pending_verification
verified
invalid_path
archived
```

Task statuses:

```text
created
queued
claimed_by_runner
running
paused
stopping
stopped
completed
failed
blocked
```

Run statuses:

```text
pending
running
paused
stopping
stopped
completed
failed
interrupted
```

Log levels:

```text
debug
info
warn
error
command
result
```

Control request types:

```text
pause
resume
stop
emergency_stop
```

## Acceptance Criteria

Phase 1 is complete when:

1. Shared types export correctly.
2. Web app imports shared types.
3. Runner imports shared types.
4. No duplicated status strings exist across web and runner.
5. TypeScript build passes.

---

# Phase 2 — Supabase Schema

## Goal

Create the MVP database schema.

## Build Tables

Required tables:

```text
machines
machine_pairing_tokens
projects
tasks
runs
run_logs
run_control_requests
events
reports
```

## Tasks

1. Create SQL migration.
2. Add constraints for status fields.
3. Add indexes.
4. Add `updated_at` trigger.
5. Enable RLS.
6. Add basic user policies.
7. Add seed/test notes if needed.

## Required Constraints

Every user-owned table should include:

```text
user_id
created_at
```

Tables with mutable status should include:

```text
updated_at
```

## Required Indexes

Add indexes for:

```text
machines(user_id)
machines(last_heartbeat_at)
projects(user_id)
projects(machine_id)
tasks(user_id)
tasks(machine_id, status, priority, created_at)
runs(task_id)
runs(machine_id, status)
run_logs(run_id, created_at)
run_control_requests(run_id, status, requested_at)
events(user_id, created_at desc)
events(run_id, created_at desc)
reports(run_id)
```

## Acceptance Criteria

Phase 2 is complete when:

1. Migration runs successfully.
2. RLS is enabled.
3. Authenticated user can access own records.
4. User cannot access other users’ records.
5. Status constraints work.
6. Indexes are created.
7. Schema matches `data-model.md`.

---

# Phase 3 — Web App Shell

## Goal

Build the basic Architect dashboard shell.

## Pages

Create:

```text
/login
/dashboard
/machines
/machines/[id]
/projects
/projects/[id]
/tasks
/tasks/[id]
/runs/[id]
/settings
```

## Layout Requirements

The app should include:

* sidebar
* top bar
* authenticated layout
* status badge component
* empty states
* loading states
* error states

## Style Direction

Use:

```text
dark mode first
compact layout
monospace logs
clear status badges
minimal visual noise
```

## Acceptance Criteria

Phase 3 is complete when:

1. User can sign in.
2. User can sign out.
3. Protected pages require authentication.
4. Sidebar navigation works.
5. Empty dashboard displays setup guidance.
6. All MVP pages exist.
7. No fake advanced AI-agent UI is shown yet.

---

# Phase 4 — Machine Creation and Pairing Token

## Goal

Allow user to create a machine and generate a pairing token.

## Web Tasks

On Machines page:

1. Add “Add Machine” button.
2. Create machine form.
3. User enters machine name.
4. Backend creates machine record.
5. Backend creates one-time pairing token.
6. Web app shows pairing token once.
7. Web app shows pairing instructions.

Example instruction:

```bash
architect-runner login
```

Then paste the pairing token.

## Security Rules

Pairing token must be:

```text
single-use
expiring
stored as hash
shown once
```

## Acceptance Criteria

Phase 4 is complete when:

1. User can create a machine.
2. Machine appears in Machines page.
3. Pairing token is generated.
4. Pairing token expires.
5. Plain token is not stored in database.
6. Token is shown once.
7. Event is created: `MACHINE_PAIRING_TOKEN_CREATED`.

---

# Phase 5 — Runner CLI Foundation

## Goal

Create the local runner CLI.

## Runner Commands

Implement:

```bash
architect-runner login
architect-runner start
architect-runner status
architect-runner logout
```

## Local Config

Store config at:

```text
Windows:
C:\Users\<User>\.architect\config.json

macOS/Linux:
~/.architect/config.json
```

Config shape:

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

## Acceptance Criteria

Phase 5 is complete when:

1. Runner CLI starts.
2. `architect-runner login` asks for pairing token.
3. Runner exchanges token for machine credentials.
4. Runner stores credentials locally.
5. `architect-runner status` shows machine info.
6. Token is redacted in CLI output.
7. `architect-runner logout` removes local credentials.
8. Runner does not store config inside project repo.

---

# Phase 6 — Machine Heartbeat

## Goal

Runner connects to backend and keeps machine online.

## Runner Behavior

When user runs:

```bash
architect-runner start
```

Runner should:

1. Load config.
2. Authenticate machine.
3. Send heartbeat every 15 seconds.
4. Update machine status.
5. Retry on network failure.
6. Log local status.

## Web Behavior

Machines page should show:

```text
online
offline
busy
paused
error
```

Machine should appear offline if heartbeat is stale.

Recommended stale threshold:

```text
60–90 seconds
```

## Acceptance Criteria

Phase 6 is complete when:

1. Runner starts with saved config.
2. Runner sends heartbeat.
3. Web app shows machine online.
4. Web app shows last heartbeat time.
5. Machine appears offline when heartbeat stops.
6. Event is created: `MACHINE_CONNECTED`.
7. Event is created periodically or selectively for heartbeat.
8. Runner handles backend connection errors without crashing permanently.

---

# Phase 7 — Project Registration

## Goal

User can register a project path from the web dashboard.

## Web Tasks

Projects page:

1. Add “New Project” button.
2. Create project form.
3. Required fields:

   * name
   * machine
   * local path
   * description
   * stack
4. Project status starts as `pending_verification`.

## Runner Tasks

Runner should:

1. Poll for pending projects assigned to its machine.
2. Verify local path exists.
3. Verify path is directory.
4. Reject blocked paths.
5. Update project status.
6. Create event.

## Blocked Paths

Reject:

```text
/
C:\
C:\Windows
C:\Program Files
C:\Users\<User>
~/
~/.ssh
~/.architect
/etc
/usr
/var
```

## Acceptance Criteria

Phase 7 is complete when:

1. User can create project from web.
2. Project appears as `pending_verification`.
3. Runner verifies valid local path.
4. Valid path becomes `verified`.
5. Invalid path becomes `invalid_path`.
6. Verification message is visible.
7. Blocked paths are rejected.
8. Event is created: `PROJECT_VERIFIED` or `PROJECT_INVALID_PATH`.

---

# Phase 8 — Task Creation and Queueing

## Goal

User can create a task for a verified project.

## Web Tasks

Task form fields:

```text
title
description
project
priority
risk level
expected commands
notes
```

Default values:

```text
priority = 2
risk_level = low
status = queued
```

## Blocking Rules

Task should be blocked if:

```text
project is not verified
task contains obviously destructive language
machine does not exist
```

Risky phrases to detect:

```text
delete all
reset database
drop table
wipe
remove auth
disable RLS
bypass security
use service role in client
deploy production
force push
reset hard
clean repository
change .env
expose key
```

## Acceptance Criteria

Phase 8 is complete when:

1. User can create task.
2. Task is linked to project and machine.
3. Verified project task becomes `queued`.
4. Invalid project task becomes `blocked`.
5. Risky task becomes `blocked`.
6. Task appears in Tasks page.
7. Task detail page shows status and metadata.
8. Event is created: `TASK_CREATED`.
9. Blocked task creates event: `TASK_BLOCKED_FOR_RISK`.

---

# Phase 9 — Task Claiming

## Goal

Runner claims queued tasks assigned to its machine.

## Runner Tasks

Runner should:

1. Poll for queued tasks.
2. Only claim tasks for its own machine.
3. Only claim tasks where project is verified.
4. Only claim task if no active run exists.
5. Claim task atomically.
6. Set task status to `claimed_by_runner`.
7. Set `claimed_by_machine_id`.
8. Set `claimed_at`.

## One Active Run Rule

For MVP:

```text
One machine can run only one active task at a time.
```

## Acceptance Criteria

Phase 9 is complete when:

1. Runner claims queued task.
2. Runner does not claim blocked task.
3. Runner does not claim task for another machine.
4. Runner does not claim second task while active run exists.
5. Task status becomes `claimed_by_runner`.
6. Duplicate task execution is prevented.
7. Event is created: `TASK_CLAIMED`.

---

# Phase 10 — Run Creation

## Goal

Runner creates a run after claiming a task.

## Runner Tasks

After task claim:

1. Create run.
2. Set run status to `running`.
3. Set task status to `running`.
4. Set machine status to `busy`.
5. Set `machine.current_run_id`.
6. Add initial run log.
7. Create events.

## Required Initial Log

```text
[info] Run started.
```

## Acceptance Criteria

Phase 10 is complete when:

1. Runner creates run for claimed task.
2. Run appears in web app.
3. Run status is `running`.
4. Task status is `running`.
5. Machine status is `busy`.
6. Machine current run is visible.
7. Initial log appears.
8. Event is created: `RUN_CREATED`.
9. Event is created: `RUN_STARTED`.

---

# Phase 11 — Manual Terminal Adapter

## Goal

Implement MVP execution through the manual/terminal adapter.

## Adapter ID

```text
manual_terminal
```

## Adapter Behavior

The adapter should:

1. Receive task packet.
2. Log task packet.
3. Verify project path.
4. Run safe diagnostic commands.
5. Run allowed expected commands.
6. Collect command results.
7. Collect changed file paths through git.
8. Return structured result.

## Default Commands

Run:

```bash
git status
git diff --name-only
git diff --stat
```

Optional expected commands if allowed:

```bash
npm run lint
npm run typecheck
npm run build
npm test
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

## Blocked

The adapter must not:

```text
edit code automatically
run arbitrary commands
delete files
reset git
deploy production
change environment variables
commit or push code
reset database
```

## Acceptance Criteria

Phase 11 is complete when:

1. Adapter receives task packet.
2. Adapter streams task packet to logs.
3. Adapter runs `git status`.
4. Adapter runs `git diff --name-only`.
5. Adapter runs only allowed expected commands.
6. Adapter blocks unsafe expected commands.
7. Command output appears in run logs.
8. Changed files are collected when available.
9. Adapter returns structured result.
10. Event is created for blocked command: `COMMAND_BLOCKED`.

---

# Phase 12 — Live Logs

## Goal

Run logs appear in the web dashboard.

## Runner Tasks

Runner should:

1. Send logs to `run_logs`.
2. Redact secrets before upload.
3. Limit message size.
4. Include log level.
5. Include timestamp.
6. Include run/task/project/machine IDs.

## Web Tasks

Run page should show:

* timestamp
* level
* message
* auto-refresh or realtime updates
* scrollable log area

## Log Levels

```text
debug
info
warn
error
command
result
```

## Acceptance Criteria

Phase 12 is complete when:

1. Logs appear on Run page.
2. Logs update while run is active.
3. Logs include timestamp and level.
4. Command logs are distinguishable.
5. Result logs are distinguishable.
6. Secrets are redacted.
7. Large messages are truncated.
8. `.env` contents are not uploaded.

---

# Phase 13 — Pause, Resume, Stop

## Goal

User can control active run from the web app.

## Web Tasks

Run page should include:

```text
Pause
Resume
Stop
```

Each button creates a `run_control_request`.

## Runner Tasks

Runner should:

1. Poll pending control requests.
2. Acknowledge request.
3. Apply control action.
4. Update statuses.
5. Complete or fail request.
6. Create event.

## Pause Behavior

```text
Do not start new execution steps.
Finish current safe step if needed.
Set run/task/machine to paused.
```

## Resume Behavior

```text
Continue from next safe step.
Set run/task to running.
Set machine to busy.
```

## Stop Behavior

```text
End run safely.
Do not continue automatically.
Create final report.
Set machine back to online.
```

## Acceptance Criteria

Phase 13 is complete when:

1. User can click Pause.
2. Runner acknowledges pause.
3. Run becomes `paused`.
4. User can click Resume.
5. Runner resumes.
6. User can click Stop.
7. Runner stops safely.
8. Run becomes `stopped`.
9. Task becomes `stopped`.
10. Machine becomes `online`.
11. Stopped run creates report.
12. Events are created for request and completion.

---

# Phase 14 — Final Reports

## Goal

Every finished run creates a report.

## Report Statuses

Create report for:

```text
completed
failed
stopped
interrupted
```

## Report Fields

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

## Web Display

Run page should display report with:

* final summary
* commands run
* changed files
* tests/checks
* risks
* next steps

## Acceptance Criteria

Phase 14 is complete when:

1. Completed run has report.
2. Failed run has report if possible.
3. Stopped run has report.
4. Report is visible on Run page.
5. Report is linked from Task page.
6. Report includes commands run.
7. Report includes changed files when available.
8. Report includes risks.
9. Report excludes secrets.
10. Event is created: `REPORT_CREATED`.

---

# Phase 15 — Event Timeline

## Goal

Make system activity auditable.

## Required Events

```text
MACHINE_CREATED
MACHINE_PAIRING_TOKEN_CREATED
MACHINE_CONNECTED
MACHINE_HEARTBEAT
PROJECT_CREATED
PROJECT_VERIFIED
PROJECT_INVALID_PATH
TASK_CREATED
TASK_BLOCKED_FOR_RISK
TASK_CLAIMED
RUN_CREATED
RUN_STARTED
RUN_LOG_RECEIVED
RUN_PAUSE_REQUESTED
RUN_PAUSED
RUN_RESUME_REQUESTED
RUN_RESUMED
RUN_STOP_REQUESTED
RUN_STOPPED
RUN_COMPLETED
RUN_FAILED
REPORT_CREATED
COMMAND_BLOCKED
```

## Web Display

Show timeline on:

```text
/dashboard
/machines/[id]
/projects/[id]
/tasks/[id]
/runs/[id]
```

## Acceptance Criteria

Phase 15 is complete when:

1. Major actions create events.
2. Events show timestamps.
3. Events link to machine/project/task/run.
4. Events appear in dashboard.
5. Events appear in detail pages.
6. Events do not expose secrets.
7. Timeline helps debug a run.

---

# Phase 16 — Safety Hardening

## Goal

Make the MVP safe enough for real local testing.

## Implement

```text
command allowlist
blocked command detector
path guard
secret redactor
log truncation
risky task blocker
duplicate task claim protection
stale heartbeat detection
stale run handling
```

## Secret Redaction

Redact values near:

```text
API_KEY
SECRET
TOKEN
PASSWORD
DATABASE_URL
PRIVATE_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
ANTHROPIC_API_KEY
GITHUB_TOKEN
VERCEL_TOKEN
```

## Blocked Commands

```text
rm -rf
del /s /q
rmdir /s
git reset --hard
git clean -fd
sudo
chmod -R
curl | bash
wget | bash
supabase db reset
vercel deploy --prod
```

## Acceptance Criteria

Phase 16 is complete when:

1. Unsafe commands are blocked.
2. Suspicious paths are blocked.
3. Secrets are redacted.
4. Large logs are truncated.
5. Risky tasks are blocked.
6. Duplicate execution is prevented.
7. Stale machine status is handled.
8. Stale active run is handled.
9. Safety events are created.
10. Runner fails visibly, not silently.

---

# Phase 17 — Dashboard Polish

## Goal

Make the MVP usable enough for real daily testing.

## Dashboard Should Show

```text
machine status
active run
queued tasks
recent runs
recent events
quick create project/task buttons
stop button for active run
```

## Empty States

No machine:

```text
Add your first machine and start Architect Runner.
```

No project:

```text
Register your first local project.
```

No task:

```text
Create your first task.
```

## Acceptance Criteria

Phase 17 is complete when:

1. User understands system status quickly.
2. Setup path is clear.
3. Active run is obvious.
4. Queued tasks are visible.
5. Recent events are visible.
6. Important errors are visible.
7. UI is simple but operational.

---

# Phase 18 — End-to-End MVP Test

## Goal

Verify the full product loop.

## Test Scenario

Run this exact test:

```text
1. User signs in.
2. User creates machine called "Said's Laptop".
3. Website shows pairing token.
4. User runs architect-runner login.
5. User pastes token.
6. Runner stores credentials.
7. User runs architect-runner start.
8. Website shows machine online.
9. User creates project with valid local path.
10. Runner verifies path.
11. Website shows project verified.
12. User creates task: "Run project health check".
13. Task becomes queued.
14. Runner claims task.
15. Runner creates run.
16. Website shows run running.
17. Runner streams logs.
18. Runner runs git status and git diff --name-only.
19. User clicks pause.
20. Runner pauses after safe step.
21. User clicks resume.
22. Runner resumes.
23. User clicks stop or runner completes.
24. Runner creates final report.
25. Website shows report.
26. Event timeline shows major actions.
27. No unsafe command was executed.
28. No secrets were exposed.
```

## Acceptance Criteria

Phase 18 is complete when the full scenario works without manual database edits.

---

# Phase 19 — Cleanup and Documentation

## Goal

Prepare the MVP for repeated testing.

## Build

1. Update README.
2. Add setup instructions.
3. Add runner installation instructions.
4. Add Supabase setup instructions.
5. Add environment variable guide.
6. Add known limitations.
7. Add troubleshooting guide.
8. Add MVP demo script.

## README Should Include

```text
what Architect Runner MVP is
what it is not
setup steps
web app setup
runner setup
Supabase setup
security rules
how to run E2E test
known limitations
future roadmap
```

## Acceptance Criteria

Phase 19 is complete when:

1. A builder can install the project from README.
2. Runner setup is clear.
3. Supabase setup is clear.
4. MVP test script is documented.
5. Security limitations are documented.
6. Future features are clearly marked as future.

---

# Implementation Rules for Builders

## Rule 1 — Do not skip phases

Build in order.

Do not jump to agents before the runner loop works.

---

## Rule 2 — Do not add provider automation early

Do not implement:

```text
Claude Code adapter
Codex adapter
Cursor adapter
Kimi adapter
Grok adapter
browser automation
multi-account scheduling
```

before MVP completion.

---

## Rule 3 — Keep the MVP strict

MVP supports:

```text
manual_terminal adapter only
one active run
safe commands only
verified project paths only
redacted logs
no production deployment
no database resets
```

---

## Rule 4 — Use events for visibility

Every important action should create an event.

No hidden state transitions.

---

## Rule 5 — Security beats convenience

When uncertain:

```text
block the action
log the reason
create an event
show clear message
```

Do not guess and execute.

---

# Recommended First Coding Prompt

Use this prompt when starting implementation:

```text
You are building Architect Runner MVP.

Read these docs first:
- docs/project-context.md
- docs/system-architecture.md
- docs/data-model.md
- docs/runner-protocol.md
- docs/agent-adapter-interface.md
- docs/security-rules.md
- docs/product-requirements.md
- docs/build-phases.md

Start with Phase 0 only.

Do not implement future AI agents.
Do not implement Claude/Codex/Cursor automation.
Do not implement browser automation.
Do not implement arbitrary remote shell.

Build the monorepo foundation:
- apps/web
- apps/runner
- packages/shared
- docs
- root package scripts
- TypeScript setup
- README
- .env.example

After Phase 0, stop and report:
1. Files created
2. Commands run
3. What works
4. What is incomplete
5. Next recommended phase
```

---

# Build Sequence Summary

```text
Phase 0  — Project Setup
Phase 1  — Shared Types
Phase 2  — Supabase Schema
Phase 3  — Web App Shell
Phase 4  — Machine Creation and Pairing Token
Phase 5  — Runner CLI Foundation
Phase 6  — Machine Heartbeat
Phase 7  — Project Registration
Phase 8  — Task Creation and Queueing
Phase 9  — Task Claiming
Phase 10 — Run Creation
Phase 11 — Manual Terminal Adapter
Phase 12 — Live Logs
Phase 13 — Pause, Resume, Stop
Phase 14 — Final Reports
Phase 15 — Event Timeline
Phase 16 — Safety Hardening
Phase 17 — Dashboard Polish
Phase 18 — End-to-End MVP Test
Phase 19 — Cleanup and Documentation
```

---

# Final Summary

Architect Runner MVP should be built like infrastructure, not like a flashy demo.

The correct first build is:

```text
web dashboard
local runner
machine heartbeat
project verification
task queue
run logs
pause/resume/stop
final report
event timeline
strict safety
```

Only after this foundation works should Architect expand into:

```text
OpenAI CTO agents
team leads
Claude/Codex/Cursor labor adapters
skill packages
provider limit tracking
multi-agent scheduling
parallel workspaces
AI software workforce orchestration
```

The MVP is successful when one safe remote task can run on one laptop from one browser dashboard with full visibility and control.
