# Architect Runner MVP — System Architecture

## 1. Purpose

This document defines the technical architecture for Architect Runner MVP.

The MVP must prove one core capability:

**A browser-based Architect dashboard can securely communicate with a local laptop runner and supervise one software task from start to finish.**

This architecture must stay small enough to build quickly, but strong enough to expand later into:

* CTO agents
* team lead agents
* labor agents
* skill packages
* multi-agent scheduling
* usage-limit tracking
* parallel workspaces
* provider-specific adapters

---

## 2. High-Level Architecture

Architect Runner MVP has three primary parts:

```text
1. Architect Web App
   The browser dashboard used by the user.

2. Architect Cloud Backend
   The Supabase-backed control layer that stores tasks, machines, runs, logs, events, and reports.

3. Architect Local Runner
   A local process running on the user’s laptop that receives tasks and executes safe local workflows.
```

Architecture flow:

```text
User Browser
    ↓
Architect Web App
    ↓
Supabase Auth / Database / Realtime
    ↓
Architect Local Runner
    ↓
Local Project Folder / Terminal / Future AI Agent Adapters
```

The local runner creates an outbound connection to the backend.

The backend does not directly connect into the laptop through open inbound ports.

---

## 3. Core Design Principle

The system must be built around **interfaces**, not specific AI providers.

Bad architecture:

```text
Claude-specific dashboard
Codex-specific task system
Cursor-specific runner
```

Good architecture:

```text
Task System
Runner Protocol
Agent Adapter Interface
Skill Package Interface
Event System
```

This makes it possible to add Claude Code, Codex, Cursor, Kimi, Grok, OpenAI API agents, and future providers later without rewriting the foundation.

---

## 4. Component Overview

## 4.1 Architect Web App

The web app is the user-facing control center.

Responsibilities:

* authenticate the user
* show connected machines
* show machine online/offline/busy state
* create and manage projects
* create and manage tasks
* show live runs
* show streamed logs
* provide pause/stop controls
* display final reports
* show event history

Recommended stack:

```text
Next.js App Router
TypeScript
Tailwind CSS
Supabase Auth
Supabase client
```

---

## 4.2 Architect Cloud Backend

The cloud backend stores system state.

In the MVP, Supabase provides:

```text
Authentication
Postgres database
Realtime subscriptions
RLS policies
```

The backend stores:

* users
* machines
* projects
* tasks
* runs
* logs
* events
* reports

The backend is the source of truth for task state, run state, and event history.

The backend should not access local files directly.

---

## 4.3 Architect Local Runner

The local runner is the execution process on the user’s laptop.

Responsibilities:

* authenticate with the backend
* register the machine
* send heartbeat updates
* listen for queued tasks
* claim tasks
* verify registered project paths
* create runs
* execute manual/terminal adapter flow
* stream logs back to the backend
* respond to pause/stop requests
* create final reports
* enforce local safety rules

Recommended stack:

```text
Node.js
TypeScript
CLI entrypoint
Local config file
Child process execution
```

Example command:

```bash
architect-runner start
```

---

## 5. Communication Model

The MVP should use a simple communication model.

### Runner → Backend

The runner writes:

* heartbeat updates
* task claim updates
* run status updates
* run logs
* events
* reports

### Web App → Backend

The web app writes:

* new projects
* new tasks
* pause requests
* stop requests
* user approvals later

### Backend → Runner

The runner receives work by either:

```text
Option A: Supabase Realtime subscription
Option B: polling every few seconds
```

For the MVP, choose the simpler and more reliable implementation.

Recommended:

```text
Use polling first.
Add Realtime later if needed.
```

Polling is easier to debug and less fragile during early development.

Example runner loop:

```text
1. Send heartbeat.
2. Check for queued tasks assigned to this machine.
3. Claim one task.
4. Create run.
5. Execute run.
6. Stream logs.
7. Check for pause/stop requests.
8. Finish report.
9. Repeat.
```

---

## 6. Why Outbound Runner Connection

The runner should connect outward to the backend.

Do not require:

* opening laptop ports
* exposing localhost publicly
* configuring router/firewall
* direct inbound access to the machine

Correct model:

```text
Runner starts locally
Runner authenticates
Runner polls/subscribes to backend
Runner pulls tasks
Runner pushes logs/results
```

This is simpler and safer.

---

## 7. Data Flow: Machine Connection

```text
1. User starts local runner.
2. Runner loads local machine token.
3. Runner authenticates with backend.
4. Runner creates or updates machine record.
5. Runner sets machine status to online.
6. Runner sends heartbeat every N seconds.
7. Web dashboard reads latest machine status.
8. If heartbeat is stale, machine is shown as offline.
```

Suggested heartbeat interval:

```text
10–30 seconds
```

Suggested offline threshold:

```text
60–90 seconds without heartbeat
```

---

## 8. Data Flow: Project Registration

```text
1. User creates project in web dashboard.
2. User provides project name, local path, stack, and machine.
3. Backend stores project metadata.
4. Runner detects project assigned to its machine.
5. Runner verifies that local path exists.
6. Runner updates project status.
7. Web app shows project as verified or invalid.
```

Important rule:

**The cloud stores path metadata, but file access happens only on the local runner.**

---

## 9. Data Flow: Task Execution

```text
1. User creates task in web dashboard.
2. Task status becomes queued.
3. Runner finds queued task for its machine.
4. Runner claims task.
5. Task status becomes sent_to_runner or running.
6. Runner creates run.
7. Run status becomes running.
8. Runner executes manual/terminal adapter.
9. Runner streams logs.
10. Runner watches for pause/stop requests.
11. Runner completes, fails, or stops the run.
12. Runner creates final report.
13. Task status updates.
14. Web app displays report.
```

---

## 10. Task State Machine

Suggested task states:

```text
created
queued
sent_to_runner
claimed_by_runner
running
paused
stopping
stopped
completed
failed
blocked
```

State rules:

```text
created → queued
queued → claimed_by_runner
claimed_by_runner → running
running → paused
paused → running
running → stopping
stopping → stopped
running → completed
running → failed
queued → blocked
```

The backend should not mark a task completed by itself.

Only the runner should report execution completion.

---

## 11. Run State Machine

Suggested run states:

```text
pending
running
paused
stopping
stopped
completed
failed
```

State rules:

```text
pending → running
running → paused
paused → running
running → stopping
stopping → stopped
running → completed
running → failed
```

Each task can have multiple runs later.

For the MVP, one task may have one run, but the schema should not block retries.

---

## 12. Event-First Architecture

Every important action should create an event.

Events make the system auditable and expandable.

Example events:

```text
MACHINE_CONNECTED
MACHINE_HEARTBEAT
MACHINE_OFFLINE_DETECTED
PROJECT_CREATED
PROJECT_VERIFIED
PROJECT_INVALID_PATH
TASK_CREATED
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
```

Events should include:

```text
id
user_id
machine_id
project_id
task_id
run_id
type
payload
created_at
```

The event log later supports:

* audit trail
* timeline replay
* debugging
* notifications
* analytics
* agent memory
* risk review
* governance

---

## 13. Local Runner Internal Architecture

The runner should be modular.

Recommended structure:

```text
apps/runner/src/
  index.ts
  cli.ts
  config/
    load-config.ts
    save-config.ts
  auth/
    login.ts
    tokens.ts
  machine/
    register-machine.ts
    heartbeat.ts
    status.ts
  projects/
    verify-project.ts
    project-paths.ts
  tasks/
    poll-tasks.ts
    claim-task.ts
    execute-task.ts
  runs/
    create-run.ts
    update-run.ts
    stream-log.ts
    complete-run.ts
  controls/
    check-control-signals.ts
    pause-run.ts
    stop-run.ts
  adapters/
    manual-terminal-adapter.ts
    types.ts
  safety/
    command-allowlist.ts
    path-guard.ts
    secret-redactor.ts
    risk-detector.ts
  reports/
    create-report.ts
  supabase/
    client.ts
  utils/
    logger.ts
    sleep.ts
```

---

## 14. Web App Internal Architecture

Recommended structure:

```text
apps/web/
  app/
    dashboard/
    machines/
    projects/
    projects/[id]/
    tasks/
    tasks/[id]/
    runs/
    runs/[id]/
    settings/
    login/
  components/
    layout/
    machines/
    projects/
    tasks/
    runs/
    logs/
    reports/
    ui/
  lib/
    supabase/
    auth/
    queries/
    mutations/
    realtime/
    formatters/
  types/
```

Use simple server/client boundaries.

For MVP speed:

* server components for loading lists
* client components for live logs and controls
* Supabase client for browser updates

---

## 15. Shared Package

Create a shared package for types and validation.

Recommended structure:

```text
packages/shared/src/
  types.ts
  statuses.ts
  events.ts
  schemas.ts
  constants.ts
```

Shared definitions should include:

* machine statuses
* task statuses
* run statuses
* event types
* log levels
* adapter types
* report structure

This prevents web and runner from drifting apart.

---

## 16. Database Tables

MVP tables:

```text
machines
projects
tasks
runs
run_logs
events
reports
```

Optional future tables:

```text
agents
skills
project_skills
approvals
artifacts
workspaces
provider_accounts
limit_states
```

Do not add optional future tables unless the MVP needs them.

---

## 17. Database Ownership Model

Every main row should belong to a user.

Minimum rule:

```text
user_id = auth.uid()
```

Tables requiring user ownership:

```text
machines
projects
tasks
events
```

Tables related through parent records:

```text
runs
run_logs
reports
```

RLS should prevent users from reading or modifying other users’ data.

---

## 18. Runner Authentication

The runner needs a secure way to connect to the backend.

For MVP, use a machine token flow.

Suggested flow:

```text
1. User signs into Architect web app.
2. User creates a new machine in dashboard.
3. Dashboard shows a one-time pairing token.
4. User runs architect-runner login.
5. Runner asks for pairing token.
6. Runner exchanges token for machine credentials.
7. Runner stores local token in config.
8. Pairing token expires.
```

Local config example:

```json
{
  "machineId": "machine_123",
  "machineToken": "secret_token",
  "supabaseUrl": "...",
  "runnerVersion": "0.1.0"
}
```

Token storage should be local and not committed to git.

---

## 19. Security Boundary

Architect has the ability to control local execution, so the system must be conservative.

Security rules:

```text
1. Runner only executes tasks for its own machine ID.
2. Runner only accesses registered project paths.
3. Runner rejects unknown paths.
4. Runner refuses destructive commands by default.
5. Runner redacts secrets from logs.
6. Runner logs every command it runs.
7. Runner supports emergency stop.
8. Runner never exposes full project files unless explicitly designed later.
9. Runner should not upload .env files.
10. Runner should not run production deployments by default.
```

---

## 20. Command Execution Model

The MVP should not allow arbitrary remote shell commands from the browser.

Instead, use a restricted command model.

Allowed MVP commands may include:

```text
pwd
ls
git status
git diff --stat
git diff --name-only
npm run lint
npm run typecheck
npm run build
npm test
```

Potentially allowed later with approval:

```text
npm install
npx prisma migrate
supabase migration
vercel deploy
```

Blocked by default:

```text
rm -rf
git reset --hard
git clean -fd
sudo
chmod -R
curl | bash
database reset
production deploy
secret/env manipulation
```

The runner should treat browser-created tasks as instructions, not unrestricted shell control.

---

## 21. Manual/Terminal Adapter Architecture

The first adapter is manual/terminal.

Purpose:

**Prove task dispatch, run tracking, logs, controls, and reports without provider-specific automation.**

Flow:

```text
1. Runner receives task.
2. Runner creates task packet.
3. Runner logs task instructions.
4. Runner optionally runs safe diagnostic commands.
5. User or local AI agent performs implementation outside the runner.
6. Runner can monitor git diff/status.
7. Runner records summary.
8. Runner generates report.
```

Minimum implementation:

```text
- Print task packet locally.
- Stream task packet to web logs.
- Run safe commands such as git status and npm run build if configured.
- Create report from status, commands, and user-provided summary.
```

Future adapter interface should allow replacing manual execution with Claude Code, Codex, Cursor, and others.

---

## 22. Future Agent Adapter Interface

Do not implement all adapters now, but design for them.

Suggested interface:

```ts
export interface AgentAdapter {
  id: string;
  provider: string;
  role: "cto" | "team_lead" | "labor" | "reviewer" | "tester";
  capabilities: string[];

  canRun(input: AdapterCanRunInput): Promise<boolean>;
  prepare(input: AdapterPrepareInput): Promise<TaskPacket>;
  start(input: AdapterStartInput): Promise<RunHandle>;
  pause(input: AdapterControlInput): Promise<void>;
  resume(input: AdapterControlInput): Promise<void>;
  stop(input: AdapterControlInput): Promise<void>;
  getStatus(input: AdapterStatusInput): Promise<AdapterStatus>;
}
```

The core system should call this interface, not provider-specific code.

---

## 23. Future Role Architecture

Roles should be independent from providers.

Correct model:

```text
Role: CTO
Provider: OpenAI API

Role: Team Lead
Provider: OpenAI API

Role: Labor Agent
Provider: Claude Code / Codex / Cursor / Kimi / Grok / other
```

This allows the system to later switch models or providers without changing the role structure.

Future flow:

```text
User goal
  ↓
CTO Agent creates mission plan
  ↓
Team Lead Agent creates task packet
  ↓
Labor Agent implements
  ↓
Team Lead reviews
  ↓
CTO approves or escalates
```

MVP should not implement this yet.

The architecture should simply avoid blocking it.

---

## 24. Future Skill Package Architecture

Skill packages should be project-independent and reusable.

Future structure:

```text
skills/
  nextjs-app-router/
    skill.md
    checklist.md
    verification.md
    forbidden-patterns.md
    task-template.md
    examples.md

  supabase-rls/
    skill.md
    checklist.md
    verification.md
    forbidden-patterns.md
    task-template.md
    examples.md
```

Skill package fields:

```text
id
name
description
applies_to
instructions
forbidden_patterns
verification_steps
prompt_fragments
acceptance_criteria_templates
version
```

MVP may represent skills only as simple markdown references or metadata.

Automatic selection comes later.

---

## 25. Future Multi-Agent Scheduling

The future scheduler should assign tasks based on:

```text
agent availability
role
capabilities
skills required
provider status
usage limit state
risk level
task priority
workspace availability
```

But MVP should not include this scheduler.

MVP only needs:

```text
One machine
One project
One task
One manual/terminal adapter
One active run at a time
```

Design the schema so it can later support more.

---

## 26. Workspace Isolation

Future multi-agent work requires workspace isolation.

Rule:

```text
One labor agent = one task workspace.
```

Possible future strategies:

```text
Git branch per task
Git worktree per task
Separate copied workspace per task
Containerized workspace
```

MVP can use the main project path, but should already record:

```text
project_id
task_id
run_id
workspace_path optional later
branch_name optional later
```

Do not let early architecture assume only one permanent working directory forever.

---

## 27. Error Handling

The system should handle:

```text
runner offline
heartbeat stale
task stuck in queued
task stuck in running
project path invalid
backend connection failure
duplicate task claim
command failure
user stop request
runner crash
```

Basic recovery rules:

```text
If runner heartbeat is stale:
  show machine offline.

If task is queued but machine offline:
  keep task queued or mark blocked.

If task is running and runner goes offline:
  mark run as interrupted or stale after threshold.

If runner restarts:
  check for incomplete runs assigned to this machine.

If duplicate claim detected:
  only one runner may own the task claim.
```

---

## 28. Observability

The MVP should expose enough information to debug problems.

Required observability:

```text
machine status
last heartbeat time
task status
run status
run logs
event timeline
error messages
report summary
```

Every failure should produce:

```text
human-readable message
event entry
run log entry if related to a run
status update
```

---

## 29. MVP Deployment Model

Recommended deployment:

```text
Web app: Vercel
Backend: Supabase
Runner: local Node.js process on laptop
```

The runner is not hosted.

The runner runs only on the user’s laptop.

---

## 30. MVP Build Order

Build in this order:

```text
1. Monorepo setup
2. Shared types
3. Supabase schema
4. Web auth and layout
5. Machines page
6. Runner machine registration
7. Runner heartbeat
8. Machine online/offline display
9. Project creation
10. Runner project path verification
11. Task creation
12. Runner task polling
13. Task claiming
14. Run creation
15. Live run logs
16. Pause/stop controls
17. Report creation
18. Event timeline
19. Safety hardening
```

Do not build agent automation until this loop works.

---

## 31. MVP Acceptance Criteria

The architecture is successful when:

```text
1. User logs into web app.
2. User starts local runner.
3. Runner registers or reconnects to machine.
4. Web app shows machine online.
5. User creates project with local path.
6. Runner verifies project path.
7. User creates task.
8. Runner claims task.
9. Runner creates run.
10. Runner streams logs.
11. User can pause or stop run.
12. Runner completes or fails run.
13. Web app shows final report.
14. Events are recorded.
15. Unsafe commands are blocked by default.
```

---

## 32. Expansion Path

After this architecture works, expansion should happen in this order:

```text
1. Project scanner
2. Git diff and file change detection
3. Skill package attachment
4. OpenAI CTO planning agent
5. Team lead task packet generator
6. Claude Code / Codex labor adapter
7. Agent status and limit tracking
8. Parallel workspaces
9. Multi-agent scheduler
10. Automatic skill selection
```

This order keeps the system controlled.

---

## 33. Final Architecture Summary

Architect Runner MVP should be a small but serious control system.

It has:

```text
Browser dashboard
Supabase backend
Local laptop runner
Machine heartbeat
Project registry
Task queue
Run tracking
Live logs
Pause/stop controls
Final reports
Event history
Safety rules
```

The system must avoid provider-specific assumptions.

The first version should not try to become the full AI workforce.

It should prove the foundation:

**remote control of one local machine, one project, one task, one run, safely and visibly.**
