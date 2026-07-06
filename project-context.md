# Architect Runner MVP — Project Context

## 1. Product Name

**Architect Runner MVP**

Future product name: **Architect OS**

This MVP is the first foundation of Architect OS.

---

## 2. One-Sentence Vision

Architect Runner MVP is a web-based control center connected to a local laptop runner that lets the user remotely launch, track, pause, stop, and review AI-assisted software development tasks running on their own machine.

---

## 3. Core Idea

The user’s laptop is connected to the internet and switched on, but the user may not be physically near it.

By opening the Architect website from any browser, the user should be able to:

* see whether the laptop runner is online
* register local projects from the laptop
* create software-building tasks
* send tasks to the laptop runner
* launch a safe manual/terminal execution flow
* track logs and progress remotely
* pause or stop the task
* receive a final task report

This is the foundation for a future multi-agent AI software workforce system.

---

## 4. Future Vision

The final Architect OS may eventually support:

* multiple AI agents
* multiple AI providers
* OpenAI API-based CTO agents
* OpenAI API-based team lead agents
* account-based labor agents using Codex, Claude Code, Cursor, Kimi, Grok, and others
* skill packages for specific technologies
* automatic skill selection
* provider usage-limit tracking
* task reassignment when an agent hits a limit
* parallel execution across isolated workspaces
* remote supervision of the entire build process

However, this MVP must stay focused.

The MVP should not try to build the full system immediately.

---

## 5. MVP Goal

The MVP goal is:

**Prove that a browser-based Architect dashboard can safely communicate with a local laptop runner and control one software task from start to finish.**

The first version is successful if the following flow works:

1. User logs into Architect website.
2. User starts Architect Runner on their laptop.
3. Website shows the laptop as online.
4. User registers a local project path.
5. User creates a task from the website.
6. Task is sent to the local runner.
7. Runner executes the task through a manual/terminal adapter.
8. Logs stream back to the website.
9. User can pause or stop the run.
10. Runner saves a final run report.
11. Website displays the completed run report.

---

## 6. What This MVP Is

This MVP is:

* a remote control plane
* a local runner system
* a task execution tracker
* a safe command/log bridge
* a foundation for future agent orchestration

---

## 7. What This MVP Is Not

This MVP is not yet:

* a full autonomous AI company
* a multi-agent swarm
* a browser automation system for all AI providers
* an account-limit bypassing tool
* a full CTO/team lead/labor-agent hierarchy
* a marketplace for skill packages
* a hosted team collaboration product
* a production-grade enterprise system

---

## 8. Main User

The first user is a solo builder/founder who uses AI tools to build software projects.

The first real user is the project owner.

The system should be optimized for one person controlling their own laptop and their own projects.

Team features can come later.

---

## 9. Core Components

The MVP has three main components:

```text
1. Architect Web App
   Browser dashboard used by the user.

2. Architect Cloud Backend
   Stores users, machines, projects, tasks, runs, logs, events, and reports.

3. Architect Local Runner
   Runs on the user’s laptop and receives tasks from the cloud backend.
```

High-level architecture:

```text
Browser Dashboard
        ↓
Architect Web App / Backend
        ↓
Realtime connection
        ↓
Local Architect Runner on laptop
        ↓
Local project folder / terminal / future AI agents
```

The local runner should create an outbound connection to the backend.

The backend should not need to connect directly into the laptop through open ports.

---

## 10. Recommended Stack

### Web App

Use:

* Next.js App Router
* TypeScript
* Tailwind CSS
* Supabase Auth
* Supabase Postgres
* Supabase Realtime

### Local Runner

Use:

* Node.js
* TypeScript
* simple CLI command
* local config file
* child process execution for safe terminal commands

### Package Structure

Recommended monorepo:

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

---

## 11. MVP Pages

The web app should include these pages:

```text
/dashboard
/projects
/projects/[id]
/tasks
/tasks/[id]
/runs/[id]
/machines
/settings
```

### Dashboard

Shows:

* connected laptop status
* current active project
* active task
* latest runs
* recent events
* emergency stop button

### Machines

Shows:

* laptop name
* online/offline status
* last heartbeat time
* runner version
* current active run
* connection health

### Projects

Shows:

* registered projects
* local path
* stack notes
* linked machine
* task count
* latest activity

### Tasks

Shows:

* task title
* status
* assigned project
* assigned machine
* priority
* created time
* current run status

### Runs

Shows:

* run status
* live logs
* started time
* completed time
* commands executed
* result report
* pause/stop controls

---

## 12. Core Data Entities

Minimum database entities:

```text
users
machines
projects
tasks
runs
run_logs
events
reports
```

Optional but useful:

```text
agents
skills
project_skills
approvals
artifacts
```

Do not overbuild optional entities in the first version.

---

## 13. Entity Definitions

### User

Represents the authenticated Architect user.

Fields:

```text
id
email
created_at
```

---

### Machine

Represents a connected laptop or local computer running Architect Runner.

Fields:

```text
id
user_id
name
status
last_heartbeat_at
runner_version
created_at
updated_at
```

Statuses:

```text
online
offline
busy
paused
error
```

---

### Project

Represents a local project folder on the user’s laptop.

Fields:

```text
id
user_id
machine_id
name
local_path
description
stack
status
created_at
updated_at
```

Important rule:

The cloud backend stores the project path as metadata, but actual file access happens only on the local runner.

---

### Task

Represents a user-created work item.

Fields:

```text
id
user_id
project_id
machine_id
title
description
status
priority
created_at
updated_at
```

Statuses:

```text
queued
sent_to_runner
running
paused
stopping
stopped
completed
failed
blocked
```

---

### Run

Represents one execution attempt for a task.

Fields:

```text
id
task_id
project_id
machine_id
status
started_at
completed_at
summary
error_message
created_at
updated_at
```

Statuses:

```text
pending
running
paused
stopped
completed
failed
```

---

### Run Log

Represents streamed output from the runner.

Fields:

```text
id
run_id
level
message
created_at
```

Levels:

```text
info
warn
error
debug
command
result
```

---

### Event

Represents important system activity.

Fields:

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

Example event types:

```text
MACHINE_CONNECTED
MACHINE_HEARTBEAT
MACHINE_DISCONNECTED
PROJECT_REGISTERED
TASK_CREATED
TASK_SENT_TO_RUNNER
RUN_STARTED
RUN_LOG_RECEIVED
RUN_PAUSED
RUN_STOP_REQUESTED
RUN_STOPPED
RUN_COMPLETED
RUN_FAILED
REPORT_CREATED
```

Events are important because they make the system auditable and expandable.

---

### Report

Represents final output after a run finishes.

Fields:

```text
id
run_id
task_id
project_id
machine_id
status
summary
commands_run
files_changed
tests_run
risks
next_steps
created_at
```

---

## 14. Local Runner Responsibilities

The local runner should:

* authenticate with the backend
* identify the local machine
* maintain heartbeat
* receive queued tasks
* verify project path exists
* create a run
* execute safe commands or manual adapter flow
* stream logs back
* react to pause/stop commands
* generate final report
* avoid destructive actions unless explicitly approved

The runner should be started with:

```bash
architect-runner start
```

Optional future commands:

```bash
architect-runner login
architect-runner status
architect-runner projects
architect-runner stop
```

---

## 15. Runner Safety Rules

The runner must be safe by default.

Initial rules:

1. The runner may only access registered project directories.
2. The runner must reject tasks for unknown paths.
3. The runner must not run destructive commands by default.
4. The runner must maintain an allowlist of safe commands.
5. The runner must stream logs to the dashboard.
6. The runner must support emergency stop.
7. The runner must record every command it runs.
8. The runner must not expose environment secrets in logs.
9. The runner must not send full private files to the backend unless explicitly requested.
10. The runner should require approval for risky actions.

Risky commands include:

```text
rm -rf
git reset --hard
git clean -fd
supabase db reset
database migrations
production deployment
package removal
environment variable changes
```

---

## 16. Manual/Terminal Adapter

The first MVP should use a manual/terminal adapter.

This means Architect does not yet need to directly automate Claude, Codex, Cursor, or any browser-based tool.

The manual adapter should:

* receive a task
* show the task instructions
* optionally run predefined commands
* allow the user or future AI agent to perform the task locally
* collect logs
* collect final summary
* generate a report

This adapter is the simplest foundation for later labor-agent adapters.

Future adapters can include:

```text
Claude Code Adapter
Codex Adapter
Cursor Adapter
Kimi Adapter
Grok Adapter
OpenAI API Adapter
```

But the MVP should only require the manual/terminal adapter.

---

## 17. Future Agent Role Model

The future system should support roles:

```text
CTO
Team Lead
Labor Agent
Reviewer
Tester
```

### CTO Agent

Uses OpenAI API.

Responsibilities:

* understand project direction
* break goals into missions
* assign task priorities
* detect architectural risks
* approve or reject high-level plans

### Team Lead Agent

Uses OpenAI API.

Responsibilities:

* convert CTO plans into detailed task packets
* attach relevant skills
* review labor-agent output
* ask for fixes when necessary

### Labor Agent

Uses account-based tools or local coding agents.

Responsibilities:

* implement code changes
* run commands
* fix bugs
* report results

The MVP should not implement this hierarchy yet, but the data model should not block it.

---

## 18. Future Skill Package System

Architect should later support skill packages.

Skill packages are reusable instruction sets for specific technologies or workflows.

Examples:

```text
nextjs-app-router
supabase-rls
tailwind-ui
vercel-deployment
playwright-testing
auth-system
landing-page
dashboard-ui
marketplace-feature
```

A skill package may include:

```text
skill.md
checklist.md
verification.md
forbidden-patterns.md
task-template.md
examples.md
```

Each skill package should define:

* purpose
* when to use
* implementation rules
* common mistakes
* forbidden patterns
* verification steps
* task prompt fragments
* acceptance criteria templates

In the MVP, skill packages may be represented only as simple metadata or markdown files.

Automatic skill selection should come later.

---

## 19. First Version Functional Requirements

### Authentication

The user should be able to sign in.

Use Supabase Auth.

---

### Machine Connection

The runner should connect to the backend.

The web app should show:

```text
Laptop online
Laptop offline
Laptop busy
Laptop paused
Laptop error
```

---

### Project Registration

The user should be able to register a project.

Required fields:

```text
project name
local path
description
stack
machine
```

The runner should verify that the path exists locally.

---

### Task Creation

The user should be able to create a task from the website.

Required fields:

```text
title
description
project
priority
```

Optional fields:

```text
expected commands
notes
risk level
```

---

### Task Dispatch

The backend should send the task to the connected runner.

The runner should claim the task and create a run.

---

### Run Execution

The runner should execute the manual/terminal adapter flow.

At minimum, the runner should:

* mark run as started
* stream log messages
* support pause
* support stop
* mark run as completed or failed
* create report

---

### Live Logs

The web app should show logs in real time or near-real time.

Logs should include:

```text
timestamp
level
message
```

---

### Pause / Stop

The user should be able to pause or stop a run from the website.

Pause means:

```text
Do not start new execution steps.
Keep current state.
Allow resume later.
```

Stop means:

```text
End the run safely.
Mark it as stopped.
Do not continue automatically.
```

---

### Final Report

After completion, the runner should create a report.

Report should include:

```text
task title
run status
summary
commands run
files changed if detectable
tests run
risks
next steps
```

---

## 20. Non-Functional Requirements

### Security

Security is critical because Architect can control a real laptop.

Requirements:

* authenticated user only
* runner bound to user account
* machine token stored locally
* no open inbound laptop ports
* command allowlist
* project path restrictions
* emergency stop
* event logging
* secret redaction

---

### Reliability

The system should handle:

* laptop going offline
* network drop
* runner restart
* task stuck in running state
* backend reconnect
* duplicate task dispatch prevention

---

### Expandability

The system must be designed around interfaces:

```text
Agent Adapter Interface
Runner Protocol
Skill Package Format
Role Model
Event System
Task Lifecycle
```

Avoid hardcoding specific providers into the core system.

---

## 21. Suggested Task Lifecycle

```text
created
queued
sent_to_runner
claimed_by_runner
running
paused
completed
failed
stopped
```

The backend should never assume the task completed unless the runner reports it.

---

## 22. Suggested Run Lifecycle

```text
pending
running
paused
stopped
completed
failed
```

Each task may have multiple runs over time.

---

## 23. Suggested Event-First Design

Every major action should create an event.

This allows future features like:

* audit trail
* notifications
* dashboards
* analytics
* agent memory
* debugging
* timeline replay

The event system is a foundation, not an extra feature.

---

## 24. Suggested Development Phases

### Phase 1 — Web App Shell

Build:

* auth
* dashboard layout
* sidebar navigation
* machines page
* projects page
* tasks page
* runs page

---

### Phase 2 — Database and Supabase Setup

Build tables:

```text
machines
projects
tasks
runs
run_logs
events
reports
```

Add RLS policies.

---

### Phase 3 — Local Runner Connection

Build:

* runner login/config
* machine registration
* heartbeat
* online/offline status

---

### Phase 4 — Task Dispatch

Build:

* task creation from web
* runner polling or realtime subscription
* task claiming
* run creation

---

### Phase 5 — Logs and Controls

Build:

* run log streaming
* pause request
* stop request
* run status updates

---

### Phase 6 — Final Report

Build:

* report creation
* report display
* run history

---

### Phase 7 — Safety Hardening

Build:

* command allowlist
* secret redaction
* path validation
* emergency stop
* better error handling

---

## 25. MVP Acceptance Criteria

The MVP is acceptable when:

1. User can sign in.
2. User can start the local runner.
3. Web app shows the machine as online.
4. User can register a project.
5. User can create a task.
6. Runner receives and claims the task.
7. Runner creates a run.
8. Logs appear in the web dashboard.
9. User can pause or stop a run.
10. Runner can complete or fail a run.
11. Final report appears in the dashboard.
12. All major actions create events.
13. Runner does not execute unknown or unsafe commands by default.

---

## 26. Product Philosophy

Architect should not be built as a chaotic automation toy.

It should be built as a serious control system.

Core values:

```text
Control over chaos
Evidence over trust
Safe execution
Expandable interfaces
Human approval for risky actions
Local-first project access
Provider-independent architecture
```

---

## 27. Immediate Build Instruction

Start by building the foundation, not the full future vision.

Do not implement:

* CTO agent
* team lead agents
* Claude/Codex/Cursor automation
* multi-account scheduling
* automatic skill selection
* skill marketplace
* complex browser automation

First implement:

```text
Web dashboard
Supabase backend
Local runner
Machine heartbeat
Project registration
Task creation
Task dispatch
Run logs
Pause/stop
Final report
```

The goal is to make the remote laptop control loop work reliably.

---

## 28. Final Summary

Architect Runner MVP is the first step toward Architect OS.

It should prove that a browser dashboard can securely control a local laptop runner and supervise one software-building task.

Once this foundation works, the system can expand into:

```text
OpenAI CTO agent
team lead agents
labor-agent adapters
skill packages
multi-agent scheduling
usage-limit tracking
parallel workspaces
AI software workforce orchestration
```

But the first version must stay narrow:

**Control one machine. Run one task. Stream logs. Stop safely. Save report.**
