# Architect Runner MVP — Product Requirements

## 1. Purpose

This document defines the product requirements for Architect Runner MVP.

The MVP must prove one core product experience:

**A user can open Architect in a browser, see their laptop online, create a project task, send it to the local runner, track execution logs, pause or stop the run, and review a final report.**

This product is the first foundation of the future Architect OS.

---

## 2. Product Summary

Architect Runner MVP is a remote control center for AI-assisted software development tasks running on the user’s own laptop.

The user’s laptop stays switched on and connected to the internet.

The user may be away from the laptop.

From the Architect website, the user can:

* see laptop connection status
* register local projects
* create tasks
* dispatch tasks to the local runner
* track run status
* view live logs
* pause, resume, or stop runs
* review final reports

The MVP does not automate Claude, Codex, Cursor, Kimi, Grok, or other coding agents yet.

The first version uses a **manual/terminal adapter** to prove the control loop.

---

## 3. Product Vision

The long-term vision is:

**Architect OS becomes a remote AI software workforce control system.**

Future Architect OS may include:

* OpenAI API-based CTO agent
* OpenAI API-based team lead agents
* labor agents using Codex, Claude Code, Cursor, Kimi, Grok, and others
* skill packages
* automatic skill selection
* provider availability and limit tracking
* multi-agent scheduling
* parallel workspaces
* remote supervision of multiple software projects

But the MVP must stay narrow.

The MVP should prove:

```text
One user.
One laptop.
One project.
One task.
One run.
Safe logs.
Pause/stop.
Final report.
```

---

## 4. Target User

### Primary User

A solo builder who uses AI tools to build software projects.

The first user is the project owner.

Typical user situation:

```text
The laptop is online.
The user is not physically near the laptop.
The user opens Architect website from another device.
The user wants to supervise software-building work remotely.
```

### Future Users

Later versions may serve:

* solo founders
* indie hackers
* AI-native agencies
* small software teams
* technical product managers
* startup CTOs

These are not MVP users yet.

---

## 5. MVP Goal

The MVP goal is:

**Build a reliable remote laptop control loop for one software task.**

The first version is successful if:

1. The user can sign in.
2. The user can pair a local runner.
3. The website shows the machine as online.
4. The user can register a project path.
5. The runner can verify that project path.
6. The user can create a task.
7. The runner can claim that task.
8. The runner can create a run.
9. The website shows live logs.
10. The user can pause, resume, or stop the run.
11. The runner can complete, fail, or stop the run.
12. The system saves a final report.
13. Major actions are visible in an event timeline.

---

## 6. Non-Goals

The MVP must not include:

* full autonomous coding
* CTO agent
* team lead agents
* direct Claude Code automation
* direct Codex automation
* direct Cursor automation
* Kimi/Grok browser automation
* multi-account scheduling
* usage-limit routing
* automatic skill selection
* skill marketplace
* team collaboration
* billing
* production deployments
* database migrations
* arbitrary remote shell execution

These are future features.

---

## 7. Core Product Principles

### 7.1 Control Over Chaos

Architect should make AI-assisted development controlled, visible, and auditable.

It should not become a chaotic automation toy.

---

### 7.2 Safe Execution

The runner must not behave like an unrestricted remote shell.

Tasks are structured instructions.

Commands are restricted.

Destructive actions are blocked by default.

---

### 7.3 Evidence Over Trust

The system should not trust vague summaries like:

```text
Done, everything works.
```

It should collect evidence:

* logs
* commands run
* files changed
* test/build results
* risks
* final report

---

### 7.4 Local-First File Access

Project files remain on the local laptop.

The cloud backend stores metadata, logs, events, and reports.

The backend should not directly read private local files.

---

### 7.5 Expandable Interfaces

The MVP should be small, but the architecture should leave space for future:

* agent adapters
* skill packages
* roles
* scheduling
* approvals
* workspaces

---

## 8. User Journey

### First-Time Setup

```text
1. User opens Architect website.
2. User signs in.
3. User goes to Machines page.
4. User clicks Add Machine.
5. Website generates pairing token.
6. User runs architect-runner login on laptop.
7. Runner asks for pairing token.
8. Runner pairs with account.
9. User runs architect-runner start.
10. Website shows laptop online.
```

---

### Project Setup

```text
1. User goes to Projects page.
2. User clicks Add Project.
3. User selects machine.
4. User enters local project path.
5. User adds project name, description, and stack notes.
6. Backend stores project metadata.
7. Runner verifies local path.
8. Website shows project as verified or invalid.
```

---

### Task Execution

```text
1. User opens a verified project.
2. User clicks New Task.
3. User enters task title and description.
4. User optionally adds expected safe commands.
5. Task status becomes queued.
6. Runner claims task.
7. Runner creates run.
8. Website opens run page.
9. Logs stream to dashboard.
10. User can pause, resume, or stop.
11. Runner completes/fails/stops.
12. Final report appears.
```

---

### Run Review

```text
1. User opens completed run.
2. User reviews summary.
3. User reviews commands run.
4. User reviews changed files.
5. User reviews risks.
6. User reviews next steps.
7. User decides what to do manually next.
```

---

## 9. Main Product Areas

The MVP has six main product areas:

```text
1. Authentication
2. Machine Management
3. Project Management
4. Task Management
5. Run Monitoring
6. Reports and Events
```

---

# 10. Authentication Requirements

## 10.1 Sign In

The user must be able to sign in.

Recommended:

```text
Supabase Auth
Email magic link or email/password
```

## 10.2 Protected Dashboard

Unauthenticated users should not access:

```text
/dashboard
/machines
/projects
/tasks
/runs
/settings
```

## 10.3 User Data Isolation

Users must only see their own:

* machines
* projects
* tasks
* runs
* logs
* events
* reports

## Acceptance Criteria

Authentication is acceptable when:

1. User can sign in.
2. User can sign out.
3. Dashboard is protected.
4. Unauthenticated users are redirected to login.
5. User cannot access another user’s records.

---

# 11. Machine Management Requirements

## 11.1 Machines Page

The Machines page should show:

* machine name
* status
* runner version
* last heartbeat time
* current active run
* connection health
* add machine button

Machine statuses:

```text
online
offline
busy
paused
error
```

---

## 11.2 Add Machine

User should be able to add a machine.

Flow:

```text
1. User clicks Add Machine.
2. User enters machine name.
3. Backend creates machine record.
4. Backend creates pairing token.
5. Website displays pairing command/instructions.
```

Example instruction:

```bash
architect-runner login
```

Then paste pairing token.

---

## 11.3 Pairing Token

Pairing token must be:

* one-time use
* expiring
* shown once
* stored as hash in database

Recommended expiry:

```text
10–30 minutes
```

---

## 11.4 Machine Heartbeat

Runner should send heartbeat every 15 seconds by default.

Website should show offline if heartbeat is stale.

Recommended offline threshold:

```text
60–90 seconds
```

---

## 11.5 Machine Detail Page

Machine detail page should show:

* machine name
* status
* runner version
* machine ID
* last heartbeat
* linked projects
* recent runs
* recent events

Machine token must never be shown.

---

## Acceptance Criteria

Machine management is acceptable when:

1. User can create a machine.
2. Website generates pairing token.
3. Runner can pair with token.
4. Runner can send heartbeat.
5. Website shows online status.
6. Website shows offline status when heartbeat is stale.
7. Machine token is never exposed.
8. User can see linked projects and recent machine activity.

---

# 12. Project Management Requirements

## 12.1 Projects Page

Projects page should show:

* project name
* linked machine
* local path
* stack notes
* status
* task count
* latest activity

Project statuses:

```text
pending_verification
verified
invalid_path
archived
```

---

## 12.2 Add Project

User should be able to add a project.

Required fields:

```text
project name
machine
local path
description
stack
```

Stack can be simple text in MVP.

Example:

```text
Next.js, Supabase, Tailwind, Vercel
```

---

## 12.3 Project Path Verification

After project creation:

```text
1. Project status = pending_verification.
2. Runner sees pending project.
3. Runner checks path.
4. Runner updates status.
```

If valid:

```text
status = verified
```

If invalid:

```text
status = invalid_path
verification_message = reason
```

---

## 12.4 Project Detail Page

Project detail page should show:

* project metadata
* path verification status
* machine status
* task list
* run history
* recent events
* new task button

---

## Acceptance Criteria

Project management is acceptable when:

1. User can create project.
2. Project is assigned to a machine.
3. Runner verifies local path.
4. Verified project can receive tasks.
5. Invalid project cannot run tasks.
6. User can see verification errors.
7. User can view project task and run history.

---

# 13. Task Management Requirements

## 13.1 Tasks Page

Tasks page should show:

* task title
* project
* machine
* priority
* status
* risk level
* created time
* latest run status

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

---

## 13.2 Create Task

User should be able to create a task.

Required fields:

```text
title
description
project
priority
```

Optional fields:

```text
risk level
expected commands
notes
```

Priority values:

```text
1 = low
2 = normal
3 = high
4 = urgent
```

Risk level values:

```text
low
medium
high
critical
```

---

## 13.3 Queue Task

After creation, the task should become queued if:

* project is verified
* machine is available or can receive queue
* task does not contain obviously blocked risky instruction

If project is invalid:

```text
task.status = blocked
```

If task contains high-risk language:

```text
task.status = blocked
```

MVP can be strict and block suspicious tasks.

---

## 13.4 Task Detail Page

Task detail page should show:

* task title
* description
* status
* priority
* risk level
* project
* machine
* claimed time
* run history
* event timeline

---

## Acceptance Criteria

Task management is acceptable when:

1. User can create task for verified project.
2. Task enters queued state.
3. Runner can claim queued task.
4. Task status updates during execution.
5. Blocked tasks are not executed.
6. User can view task detail and history.
7. Duplicate task execution is prevented.

---

# 14. Run Monitoring Requirements

## 14.1 Run Creation

When runner claims a task, it should create a run.

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

---

## 14.2 Run Page

Run page should show:

* run status
* task title
* project
* machine
* start time
* completion time
* live logs
* controls
* final report when available

Controls:

```text
Pause
Resume
Stop
Emergency Stop
```

For MVP, emergency stop can be visible or reserved for later. Normal stop is required.

---

## 14.3 Live Logs

The run page should show logs in near-real time.

Each log should show:

* timestamp
* level
* message

Log levels:

```text
debug
info
warn
error
command
result
```

Logs should auto-scroll while run is active.

---

## 14.4 Pause

User should be able to request pause.

Pause behavior:

```text
Runner finishes current safe step if needed.
Runner does not start new steps.
Run status becomes paused.
Task status becomes paused.
Machine status becomes paused.
```

---

## 14.5 Resume

User should be able to request resume for paused run.

Resume behavior:

```text
Run status becomes running.
Task status becomes running.
Machine status becomes busy.
Runner continues from next safe step.
```

---

## 14.6 Stop

User should be able to request stop.

Stop behavior:

```text
Runner ends run safely.
Run status becomes stopped.
Task status becomes stopped.
Machine becomes online.
Runner creates final report.
```

---

## Acceptance Criteria

Run monitoring is acceptable when:

1. Runner creates run after claiming task.
2. Run page displays current status.
3. Logs appear during execution.
4. User can request pause.
5. User can request resume.
6. User can request stop.
7. Runner acknowledges control requests.
8. Final run state is accurate.
9. Run does not continue after stop.
10. Stopped run still creates report.

---

# 15. Manual/Terminal Adapter Requirements

The MVP must include one adapter:

```text
manual_terminal
```

## 15.1 Purpose

The manual/terminal adapter proves the execution loop without automating AI providers yet.

It should:

* receive a task packet
* print/log the task packet
* verify project path
* run safe diagnostic commands
* run allowed expected commands
* collect git status
* collect changed file paths
* generate structured result

---

## 15.2 Default Commands

The adapter should be able to run:

```text
git status
git diff --name-only
git diff --stat
```

Optionally, if allowed and configured:

```text
npm run lint
npm run typecheck
npm run build
npm test
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

---

## 15.3 Blocked Behavior

Manual adapter must not:

* edit code automatically
* execute arbitrary commands
* run destructive commands
* deploy to production
* change environment variables
* commit or push code
* run database reset
* upload full source files

---

## Acceptance Criteria

Manual adapter is acceptable when:

1. It receives task packet.
2. It logs task packet.
3. It verifies project path.
4. It runs only allowed commands.
5. It blocks unsafe commands.
6. It streams command output safely.
7. It collects changed files through git where possible.
8. It returns structured adapter result.
9. It supports stop request.
10. It produces data for final report.

---

# 16. Reports Requirements

## 16.1 Report Creation

Every finished run must create a report.

Report should be created for statuses:

```text
completed
failed
stopped
interrupted
```

---

## 16.2 Report Fields

Report should include:

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

---

## 16.3 Report Display

Report page/section should show:

* final status
* summary
* commands run
* files changed
* tests/checks run
* risks
* next steps

---

## Acceptance Criteria

Reports are acceptable when:

1. Completed run has report.
2. Failed run has report if possible.
3. Stopped run has report.
4. Report shows commands run.
5. Report shows changed file paths if available.
6. Report shows risks.
7. Report does not expose secrets.
8. Report is accessible from task and run pages.

---

# 17. Event Timeline Requirements

## 17.1 Event Creation

Every major system action should create an event.

Required event types:

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

---

## 17.2 Event Display

Events should appear on:

* dashboard
* machine detail page
* project detail page
* task detail page
* run detail page

MVP can use a simple timeline list.

---

## Acceptance Criteria

Events are acceptable when:

1. Major actions create events.
2. Events include timestamps.
3. Events are linked to relevant machine/project/task/run.
4. User can see recent events.
5. Events do not contain secrets.

---

# 18. Dashboard Requirements

## 18.1 Dashboard Page

Dashboard should show:

* machine status card
* active run card
* queued tasks
* recent runs
* recent events
* quick links to create project/task
* stop control for active run if applicable

---

## 18.2 Empty State

If no machine exists, dashboard should guide user:

```text
Add your first machine.
Install and start Architect Runner.
```

If no project exists:

```text
Register your first local project.
```

If no task exists:

```text
Create your first task.
```

---

## Acceptance Criteria

Dashboard is acceptable when:

1. User can understand system status in one screen.
2. Online/offline machine state is visible.
3. Active run is visible.
4. Queued tasks are visible.
5. Recent events are visible.
6. Empty states guide the user.

---

# 19. Settings Requirements

MVP settings can be simple.

Settings page should show:

* account email
* runner installation instructions
* command allowlist explanation
* security warnings
* future adapter placeholders

Do not build complex settings yet.

---

# 20. Safety Requirements

Safety is not optional.

## 20.1 No Arbitrary Remote Shell

The browser must not allow the user to execute arbitrary commands directly.

Tasks are structured instructions.

Runner uses allowlisted commands only.

---

## 20.2 Command Allowlist

Allowed by default:

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

Blocked by default:

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
production deploy
secret/env manipulation
```

---

## 20.3 Secret Redaction

Before uploading logs, runner must redact likely secrets.

Secret indicators:

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

---

## 20.4 Project Path Guard

Runner may only operate inside verified project paths.

Blocked paths include:

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

---

## Acceptance Criteria

Safety is acceptable when:

1. Arbitrary browser commands are impossible.
2. Runner blocks unsafe commands.
3. Runner blocks invalid project paths.
4. Runner redacts secrets.
5. Runner does not upload `.env`.
6. Runner does not deploy to production.
7. Runner does not reset databases.
8. Runner does not delete project files.
9. Runner logs blocked actions.
10. Runner creates safety events.

---

# 21. Reliability Requirements

The system should handle common failures.

## 21.1 Runner Offline

If heartbeat is stale:

```text
Machine displays offline.
Queued tasks remain queued or blocked.
Active run becomes stale/interrupted after threshold.
```

---

## 21.2 Network Drop

Runner should:

```text
retry with backoff
keep local logs
resume heartbeat when connection returns
avoid duplicate task execution
```

---

## 21.3 Runner Restart

On restart, runner should:

```text
load config
authenticate
send heartbeat
check incomplete runs
mark stale run as interrupted if needed
resume polling
```

---

## 21.4 Duplicate Task Claim

System must avoid duplicate execution.

Use atomic task claim when possible.

---

## Acceptance Criteria

Reliability is acceptable when:

1. Offline machine is detected.
2. Runner reconnects after network drop.
3. Stale active run is handled.
4. Duplicate task execution is prevented.
5. Errors produce visible messages.
6. Runner does not silently fail.

---

# 22. Performance Requirements

MVP performance requirements are modest.

Recommended targets:

```text
Dashboard loads within 2 seconds for normal data size.
Heartbeat updates every 15 seconds.
Task polling every 5 seconds.
Logs appear within 1–5 seconds.
Run page can handle at least 1,000 log lines.
```

Do not optimize prematurely.

---

# 23. Data Requirements

The MVP must store:

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

Every main table should include:

```text
user_id
created_at
updated_at where useful
```

RLS must be enabled.

---

# 24. UI Requirements

## 24.1 Style Direction

The UI should feel like a command center.

Recommended style:

```text
dark mode first
compact dashboard
clear status badges
monospace logs
strong contrast
minimal distractions
```

Do not over-design.

Operational clarity matters more than decoration.

---

## 24.2 Status Badges

Use clear statuses:

```text
Online
Offline
Busy
Paused
Error

Queued
Running
Completed
Failed
Stopped
Blocked
```

---

## 24.3 Logs UI

Logs should use:

* monospace font
* timestamp
* level badge
* scroll area
* auto-scroll toggle later
* copy button later

---

## 24.4 Forms

Forms should be simple.

Add Project form:

```text
name
machine
local path
description
stack
```

Add Task form:

```text
title
project
description
priority
risk level
expected commands
notes
```

---

# 25. Runner CLI Requirements

Minimum CLI commands:

```bash
architect-runner login
architect-runner start
architect-runner status
architect-runner logout
```

## 25.1 `login`

Pairs local runner with web account.

## 25.2 `start`

Starts heartbeat and task loop.

## 25.3 `status`

Shows local runner status.

Must redact token.

## 25.4 `logout`

Removes local machine credentials.

Should not delete cloud machine record automatically.

---

# 26. MVP Build Phases

## Phase 1 — Web Shell

Build:

* auth
* dashboard shell
* sidebar
* machines page
* projects page
* tasks page
* runs page
* settings page

---

## Phase 2 — Database

Build:

* Supabase schema
* RLS policies
* indexes
* seed/status constants if needed

---

## Phase 3 — Machine Pairing

Build:

* add machine
* pairing token
* runner login
* local config
* heartbeat
* online/offline status

---

## Phase 4 — Project Registration

Build:

* create project
* assign to machine
* runner verifies path
* project status updates

---

## Phase 5 — Task Dispatch

Build:

* create task
* queue task
* runner polls
* runner claims task
* task status updates

---

## Phase 6 — Run Execution

Build:

* create run
* manual/terminal adapter
* safe command execution
* live logs
* run statuses

---

## Phase 7 — Controls

Build:

* pause request
* resume request
* stop request
* runner acknowledgement
* status updates

---

## Phase 8 — Reports and Events

Build:

* final report creation
* report page/section
* event timeline
* dashboard recent activity

---

## Phase 9 — Safety Hardening

Build:

* command allowlist
* path guard
* secret redactor
* risky task blocker
* duplicate claim protection
* stale run handling

---

# 27. MVP Acceptance Test

The full MVP passes when this exact scenario works:

```text
1. User signs in.
2. User creates machine called "Said's Laptop".
3. Website shows pairing token.
4. User runs architect-runner login.
5. User pastes token.
6. Runner stores credentials.
7. User runs architect-runner start.
8. Website shows machine online.
9. User creates project with local path.
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

---

# 28. Future Expansion Requirements

The MVP should leave clear room for future features.

## 28.1 CTO Agent

Future CTO agent should:

* understand project
* break goals into tasks
* detect risks
* assign priorities
* create mission plan

Not in MVP.

---

## 28.2 Team Lead Agent

Future team lead should:

* create task packets
* attach skill packages
* review labor output
* request fixes

Not in MVP.

---

## 28.3 Labor Agent Adapters

Future labor adapters:

```text
Claude Code
Codex
Cursor
Kimi
Grok
Other providers
```

Not in MVP.

---

## 28.4 Skill Packages

Future skill packages:

```text
nextjs-app-router
supabase-rls
tailwind-ui
vercel-deployment
playwright-testing
auth-system
dashboard-ui
```

MVP may include only placeholder interface or markdown references.

---

## 28.5 Provider Limit Tracking

Future provider status:

```text
available
busy
limited
cooling_down
needs_login
disabled
```

Not in MVP.

---

## 28.6 Parallel Workspaces

Future workspaces:

```text
git branch
git worktree
copied workspace
container
```

MVP uses one active run only.

---

# 29. Product Risks

## Risk 1: Overbuilding too early

Mitigation:

```text
Do not implement CTO/team leads/labor agents in MVP.
Build runner control loop first.
```

---

## Risk 2: Unsafe remote execution

Mitigation:

```text
No arbitrary shell.
Command allowlist.
Path guard.
Secret redaction.
Blocked destructive commands.
```

---

## Risk 3: Browser/provider automation fragility

Mitigation:

```text
Do not automate providers in MVP.
Use manual/terminal adapter first.
Prefer official APIs/CLIs later.
```

---

## Risk 4: Data model becomes too narrow

Mitigation:

```text
Separate tasks and runs.
Use events.
Use adapter interface.
Keep future fields optional.
```

---

## Risk 5: Logs expose secrets

Mitigation:

```text
Redact aggressively.
Limit output size.
Do not upload .env.
Do not upload full source files.
```

---

# 30. Definition of Done

Architect Runner MVP is done when:

```text
A user can remotely control and observe one safe task running on their laptop through the Architect website.
```

Detailed definition:

1. Auth works.
2. Machine pairing works.
3. Runner heartbeat works.
4. Project registration works.
5. Project path verification works.
6. Task creation works.
7. Task claiming works.
8. Run creation works.
9. Live logs work.
10. Pause works.
11. Resume works.
12. Stop works.
13. Final report works.
14. Event timeline works.
15. Safety rules are enforced.
16. RLS is enabled.
17. Unsafe commands are blocked.
18. Secrets are redacted.
19. Duplicate execution is prevented.
20. UI is usable enough for real testing.

---

## 31. Final Summary

Architect Runner MVP should be a small, serious, expandable product.

It should not try to become the full AI workforce immediately.

The first product must prove:

```text
Remote dashboard
connected laptop runner
verified project
queued task
claimed run
live logs
pause/resume/stop
final report
event history
safe execution
```

Once this works, Architect can expand into the larger vision:

```text
CTO agents
team leads
labor agents
skill packages
provider adapters
limit-aware scheduling
parallel workspaces
AI software workforce orchestration
```

The correct MVP is not impressive because it has many agents.

It is impressive because the control loop is real, safe, and expandable.
