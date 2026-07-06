# Architect Runner MVP

Architect Runner MVP is the first foundation of **Architect OS**.

It is a web-based control center connected to a local laptop runner. The goal is to let the user remotely launch, track, pause, stop, and review safe software-development tasks running on their own machine.

This MVP is not the full Architect OS yet.

It proves the core control loop:

```text
Browser dashboard
→ cloud backend
→ local laptop runner
→ verified project path
→ task execution
→ live logs
→ pause/resume/stop
→ final report
```

---

## 1. Product Summary

Architect Runner MVP allows a user to:

* sign into a web dashboard
* pair a local laptop runner
* see whether the laptop is online
* register local project folders
* create tasks from the website
* send tasks to the local runner
* run safe manual/terminal checks
* view live logs
* pause, resume, or stop runs
* review final reports
* inspect event history

The laptop must be switched on and connected to the internet.

The user does not need to be physically near the laptop after the runner is started.

---

## 2. Long-Term Vision

The future version, **Architect OS**, may support:

* OpenAI API-based CTO agents
* OpenAI API-based team lead agents
* labor agents using Claude Code, Codex, Cursor, Kimi, Grok, and others
* skill packages
* automatic skill selection
* provider availability and limit tracking
* multi-agent scheduling
* parallel workspaces
* AI software workforce orchestration

The MVP does not implement these yet.

The MVP focuses only on the remote runner foundation.

---

## 3. MVP Scope

The MVP supports:

```text
one user
one local runner
one machine
one project
one active task
one active run
manual/terminal adapter only
safe command execution
live logs
pause/resume/stop
final report
event timeline
```

The MVP does **not** support:

```text
full autonomous coding
CTO agent
team lead agents
Claude Code automation
Codex automation
Cursor automation
Kimi/Grok automation
multi-account scheduling
browser automation
arbitrary remote shell
production deployment
database reset
automatic skill selection
team collaboration
billing
```

---

## 4. System Architecture

Architect Runner MVP has three primary components:

```text
1. Architect Web App
   Browser dashboard used by the user.

2. Architect Cloud Backend
   Supabase-backed state layer for users, machines, projects, tasks, runs, logs, events, and reports.

3. Architect Local Runner
   Local Node.js process running on the user’s laptop.
```

High-level flow:

```text
User Browser
    ↓
Next.js Web App
    ↓
Supabase Auth / Postgres / Realtime or Polling
    ↓
Local Architect Runner
    ↓
Local Project Folder / Terminal / Future Agent Adapters
```

The runner uses an outbound connection to the backend.

The laptop should not expose inbound ports.

---

## 5. Recommended Stack

### Web App

```text
Next.js App Router
TypeScript
Tailwind CSS
Supabase Auth
Supabase Postgres
Supabase Realtime later if needed
```

### Local Runner

```text
Node.js
TypeScript
CLI command
Local config file
Child process execution
Safe command allowlist
```

### Shared Package

```text
TypeScript shared types
status constants
event constants
schemas
adapter interfaces
```

---

## 6. Monorepo Structure

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
  README.md
  .env.example
```

Expected docs:

```text
docs/project-context.md
docs/system-architecture.md
docs/data-model.md
docs/runner-protocol.md
docs/agent-adapter-interface.md
docs/security-rules.md
docs/product-requirements.md
docs/build-phases.md
```

---

## 7. Required Environment Variables

Create:

```bash
.env.local
```

Use `.env.example` as the template.

Example:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ARCHITECT_APP_URL=http://localhost:3000
```

Rules:

* Do not commit `.env.local`.
* Do not expose service role key in the browser.
* Do not print secrets in logs.
* Do not upload `.env` contents to the backend.

---

## 8. Local Runner Config

The runner stores machine credentials locally.

Recommended locations:

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

* Never commit this file.
* Never print the full machine token.
* Never send the token to cloud logs.
* `architect-runner status` must redact the token.

---

## 9. Database Tables

The MVP requires these Supabase tables:

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

RLS must be enabled on all public tables.

Users must only access their own records.

---

## 10. Runner Commands

Minimum CLI commands:

```bash
architect-runner login
architect-runner start
architect-runner status
architect-runner logout
```

### `architect-runner login`

Pairs the local laptop with the user’s Architect account.

Expected flow:

```text
1. User creates machine in web dashboard.
2. Web dashboard shows one-time pairing token.
3. User runs architect-runner login locally.
4. Runner asks for token.
5. Runner exchanges token for machine credentials.
6. Runner stores credentials locally.
```

### `architect-runner start`

Starts the local runner loop.

Runner should:

```text
load config
authenticate machine
send heartbeat
verify pending projects
poll for queued tasks
claim tasks
create runs
stream logs
check control requests
create final reports
```

### `architect-runner status`

Shows local runner status.

Must redact token.

Example:

```text
Machine: Said's Laptop
Machine ID: machine_uuid
Token: [REDACTED]
Backend: connected
Runner version: 0.1.0
```

### `architect-runner logout`

Removes local credentials.

It should not delete the cloud machine record automatically.

---

## 11. First-Time User Flow

```text
1. User opens Architect website.
2. User signs in.
3. User opens Machines page.
4. User clicks Add Machine.
5. Website generates pairing token.
6. User runs architect-runner login on laptop.
7. User pastes pairing token.
8. Runner stores machine credentials.
9. User runs architect-runner start.
10. Website shows laptop online.
```

---

## 12. Project Flow

```text
1. User opens Projects page.
2. User clicks New Project.
3. User selects machine.
4. User enters local project path.
5. User adds project name, description, and stack.
6. Project status becomes pending_verification.
7. Runner verifies local path.
8. Project becomes verified or invalid_path.
```

A project can receive tasks only if status is:

```text
verified
```

---

## 13. Task Flow

```text
1. User opens verified project.
2. User clicks New Task.
3. User enters task title and description.
4. User optionally adds expected safe commands.
5. Task becomes queued.
6. Runner claims task.
7. Runner creates run.
8. Run starts.
9. Logs stream to dashboard.
10. User can pause, resume, or stop.
11. Runner completes/fails/stops.
12. Final report appears.
```

---

## 14. Manual Terminal Adapter

The MVP uses only:

```text
manual_terminal
```

The adapter should:

* receive a task packet
* log the task packet
* verify project path
* run safe diagnostic commands
* run allowed expected commands
* collect command results
* collect changed file paths through git
* return structured result

Default commands:

```bash
git status
git diff --name-only
git diff --stat
```

Allowed expected commands:

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

---

## 15. Safety Rules

Architect Runner MVP is not a remote shell.

The browser must not be able to send arbitrary commands to the laptop.

The runner must enforce:

```text
verified project paths only
command allowlist
blocked destructive commands
secret redaction
log size limits
risky task detection
one active run rule
event audit trail
```

### Blocked commands by default

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
database reset
production deployment
environment variable modification
secret file reading
```

### Blocked paths

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

### Secret indicators to redact

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

When uncertain, block or redact.

---

## 16. Status Values

### Machine

```text
online
offline
busy
paused
error
```

### Project

```text
pending_verification
verified
invalid_path
archived
```

### Task

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

### Run

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

### Log Level

```text
debug
info
warn
error
command
result
```

### Control Request

```text
pause
resume
stop
emergency_stop
```

---

## 17. Events

Every major action should create an event.

Required events:

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

Events should not contain secrets.

---

## 18. Build Order

Build in this order:

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

Do not skip phases.

Do not start with AI-agent automation.

---

## 19. Development Rules

### Rule 1: Build foundation first

Do not implement CTO agents, team leads, labor agents, or provider scheduling before the runner loop works.

### Rule 2: Keep provider logic out of core

The core system should not be hardcoded around Claude, Codex, Cursor, Kimi, or Grok.

Use adapter interfaces.

### Rule 3: No arbitrary remote shell

The web app creates structured tasks.

The runner decides what can safely execute.

### Rule 4: Events for visibility

Every important state change should create an event.

No hidden actions.

### Rule 5: Security beats convenience

When uncertain:

```text
block the action
log the reason
create an event
show a clear message
```

---

## 20. MVP End-to-End Test

The MVP passes when this scenario works:

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

---

## 21. Setup Instructions

### 21.1 Install dependencies

```bash
npm install
```

Or with pnpm:

```bash
pnpm install
```

### 21.2 Start web app

```bash
npm run dev --workspace apps/web
```

Or:

```bash
pnpm --filter web dev
```

### 21.3 Start runner

```bash
npm run dev --workspace apps/runner
```

Or after CLI setup:

```bash
architect-runner start
```

Exact commands may change depending on package setup.

Keep this README updated as implementation progresses.

---

## 22. Supabase Setup

Required Supabase features:

```text
Auth
Postgres
RLS
optional Realtime later
```

Setup steps:

```text
1. Create Supabase project.
2. Copy project URL.
3. Copy anon key.
4. Copy service role key for server-only use.
5. Add environment variables.
6. Run database migration.
7. Verify RLS policies.
8. Test sign-in.
```

Important:

```text
SUPABASE_SERVICE_ROLE_KEY must never be exposed to browser code.
```

---

## 23. Known MVP Limitations

The MVP intentionally does not support:

```text
automatic code editing
direct Claude Code control
direct Codex control
direct Cursor control
multi-agent execution
account usage-limit scheduling
skill package automation
parallel workspaces
production deployment
database migrations
team accounts
billing
```

These are future phases.

---

## 24. Future Roadmap

After the MVP works, expand in this order:

```text
1. Project scanner
2. Git diff and file-change detection improvements
3. Skill package attachment
4. OpenAI CTO planning agent
5. OpenAI team lead task packet generator
6. Claude Code labor adapter
7. Codex labor adapter
8. Agent status and limit tracking
9. Parallel workspaces
10. Multi-agent scheduler
11. Automatic skill selection
```

---

## 25. Builder Start Prompt

Use this prompt when giving the project to Codex, Claude Code, or another builder:

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
- README.md

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

## 26. Definition of Done

Architect Runner MVP is done when:

```text
A user can remotely control and observe one safe task running on their laptop through the Architect website.
```

Detailed definition:

```text
Auth works.
Machine pairing works.
Runner heartbeat works.
Project registration works.
Project path verification works.
Task creation works.
Task claiming works.
Run creation works.
Live logs work.
Pause works.
Resume works.
Stop works.
Final report works.
Event timeline works.
Safety rules are enforced.
RLS is enabled.
Unsafe commands are blocked.
Secrets are redacted.
Duplicate execution is prevented.
UI is usable enough for real testing.
```

---

## 27. Final Note

Architect Runner MVP should be built like infrastructure, not a flashy demo.

The first version is successful if it proves:

```text
remote dashboard
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

Only after this foundation works should Architect expand into the larger AI software workforce vision.
