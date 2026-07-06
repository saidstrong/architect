# Architect Runner MVP — Data Model

## 1. Purpose

This document defines the database model for Architect Runner MVP.

The data model must support the first core loop:

```text
User logs in
→ machine connects
→ project is registered
→ task is created
→ runner claims task
→ run starts
→ logs stream
→ user can pause/stop
→ run completes/fails/stops
→ report is saved
```

The schema should stay simple, but it must not block future expansion into:

* CTO agents
* team lead agents
* labor agents
* skill packages
* provider accounts
* limit-aware scheduling
* parallel workspaces
* approvals
* artifacts
* multi-user teams

---

## 2. Database Principles

### Principle 1: Every main record belongs to a user

All user-owned data should include:

```text
user_id
```

This keeps RLS simple.

---

### Principle 2: Backend stores metadata, runner accesses files

The cloud database may store:

```text
project name
local path
machine id
stack notes
task description
run logs
reports
```

But actual file access must happen only on the local runner.

The backend should not read the user’s local files.

---

### Principle 3: Runs are separate from tasks

A task is the intention.

A run is one execution attempt.

One task may eventually have multiple runs.

```text
Task: Add login page
Run 1: failed
Run 2: stopped
Run 3: completed
```

Even if MVP uses one run per task, the schema should support retries later.

---

### Principle 4: Events are the audit trail

Every major action should create an event.

Events allow:

* timeline replay
* debugging
* reports
* notifications
* agent memory
* future analytics
* safety audits

---

### Principle 5: Use statuses, not vague booleans

Avoid this:

```text
is_done
is_running
has_error
```

Use explicit status fields:

```text
queued
running
paused
completed
failed
stopped
blocked
```

This makes the system easier to expand.

---

## 3. MVP Tables

Required MVP tables:

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

Supabase Auth already provides:

```text
auth.users
```

Optional later tables:

```text
agents
skills
project_skills
approvals
artifacts
workspaces
provider_accounts
limit_states
teams
team_members
```

Do not build the optional tables in the first MVP unless needed.

---

## 4. Entity Relationship Overview

```text
auth.users
  └── machines
        └── projects
              └── tasks
                    └── runs
                          ├── run_logs
                          ├── run_control_requests
                          └── reports

auth.users
  └── events

machines, projects, tasks, runs can all be linked to events.
```

Important relationships:

```text
One user has many machines.
One machine has many projects.
One project has many tasks.
One task has many runs.
One run has many logs.
One run has many control requests.
One run has one final report.
```

---

## 5. Status Values

### Machine Status

```text
online
offline
busy
paused
error
```

### Project Status

```text
pending_verification
verified
invalid_path
archived
```

### Task Status

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

### Run Status

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

### Run Log Level

```text
debug
info
warn
error
command
result
```

### Control Request Type

```text
pause
resume
stop
emergency_stop
```

### Control Request Status

```text
pending
acknowledged
completed
failed
ignored
```

---

## 6. Table: `machines`

Represents a local laptop or computer running Architect Runner.

### Fields

```text
id
user_id
name
status
runner_version
machine_token_hash
token_last_rotated_at
paired_at
revoked_at
last_heartbeat_at
last_seen_at
current_run_id
error_message
created_at
updated_at
```

### Notes

* `last_heartbeat_at` determines whether the machine is online.
* `current_run_id` helps the dashboard quickly show what the laptop is doing.
* `machine_token_hash` stores only a hash of the runner token for future machine authentication.
* `paired_at`, `revoked_at`, and `token_last_rotated_at` support future credential lifecycle tracking.
* Machine should be considered offline if heartbeat is stale.

### Example

```text
Machine:
- name: Said's Laptop
- status: online
- runner_version: 0.1.0
- last_heartbeat_at: 2026-07-06 20:00:00
```

---

## 7. Table: `machine_pairing_tokens`

Used to securely connect a local runner to the user’s account.

### Fields

```text
id
user_id
machine_id
token_hash
expires_at
used_at
created_at
```

### Notes

* The plain pairing token should be shown only once in the web app.
* Store only a hash in the database.
* Token should expire quickly.
* After the runner uses the token, mark it as used.

### Recommended expiry

```text
10–30 minutes
```

---

## 8. Table: `projects`

Represents a project folder on a specific machine.

### Fields

```text
id
user_id
machine_id
name
local_path
description
stack
status
verification_message
last_verified_at
created_at
updated_at
```

### Notes

* `local_path` is metadata for the runner.
* The runner must verify the path exists.
* The backend should not access the path directly.

### Example

```text
Project:
- name: NU Atrium
- local_path: C:\Users\Said\Projects\nu-atrium
- stack: Next.js, Supabase, Tailwind, Vercel
- status: verified
```

---

## 9. Table: `tasks`

Represents work the user wants Architect Runner to perform.

### Fields

```text
id
user_id
project_id
machine_id
title
description
priority
status
risk_level
expected_commands
notes
claimed_by_machine_id
claimed_at
created_at
updated_at
```

### Notes

* `machine_id` defines where the task should run.
* `claimed_by_machine_id` prevents duplicate execution.
* `expected_commands` can be JSON.
* `risk_level` helps future approval logic.

### Priority

Use integer priority:

```text
1 = low
2 = normal
3 = high
4 = urgent
```

Default:

```text
2
```

### Risk Level

```text
low
medium
high
critical
```

Default:

```text
low
```

---

## 10. Table: `runs`

Represents one execution attempt for a task.

### Fields

```text
id
user_id
task_id
project_id
machine_id
status
started_at
completed_at
summary
error_message
exit_code
created_at
updated_at
```

### Notes

* A task can have multiple runs.
* `exit_code` is useful for terminal-based execution.
* `summary` stores a short final explanation.
* Full final details should go into `reports`.

---

## 11. Table: `run_logs`

Stores logs streamed from the runner.

### Fields

```text
id
user_id
run_id
task_id
project_id
machine_id
level
message
metadata
created_at
```

### Notes

Logs should be append-only.

Do not update logs after creation unless absolutely necessary.

The runner should redact secrets before inserting logs.

### Example log messages

```text
[info] Run started.
[command] git status
[result] Working tree clean.
[command] npm run build
[error] Build failed: missing environment variable.
```

---

## 12. Table: `run_control_requests`

Stores pause, resume, stop, and emergency stop requests from the web app.

### Fields

```text
id
user_id
run_id
task_id
machine_id
type
status
message
requested_at
acknowledged_at
completed_at
created_at
updated_at
```

### Notes

The web app creates a control request.

The runner polls for pending control requests and acknowledges them.

This is cleaner than only using fields like:

```text
pause_requested = true
stop_requested = true
```

Because control requests create history.

---

## 13. Table: `events`

Stores important system events.

### Fields

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

### Notes

Events should be lightweight.

Use them for timeline and audit history.

Do not store huge logs or full files inside events.

### Example event types

```text
MACHINE_CREATED
MACHINE_PAIRING_TOKEN_CREATED
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

---

## 14. Table: `reports`

Stores final output after a run.

### Fields

```text
id
user_id
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
metadata
created_at
```

### Notes

The report is the final artifact of a run.

For MVP, fields may be JSON arrays:

```text
commands_run
files_changed
tests_run
risks
next_steps
```

Future versions can turn these into separate tables if needed.

---

## 15. Recommended PostgreSQL Schema

This is the MVP schema direction.

```sql
create extension if not exists "pgcrypto";

create table public.machines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  status text not null default 'offline',
  runner_version text,
  machine_token_hash text,
  token_last_rotated_at timestamptz,
  paired_at timestamptz,
  revoked_at timestamptz,
  last_heartbeat_at timestamptz,
  last_seen_at timestamptz,
  current_run_id uuid,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint machines_status_check check (
    status in ('online', 'offline', 'busy', 'paused', 'error')
  )
);

create table public.machine_pairing_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  machine_id uuid not null references public.machines(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  machine_id uuid not null references public.machines(id) on delete cascade,
  name text not null,
  local_path text not null,
  description text,
  stack text,
  status text not null default 'pending_verification',
  verification_message text,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint projects_status_check check (
    status in ('pending_verification', 'verified', 'invalid_path', 'archived')
  )
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  machine_id uuid not null references public.machines(id) on delete cascade,
  title text not null,
  description text not null,
  priority integer not null default 2,
  status text not null default 'created',
  risk_level text not null default 'low',
  expected_commands jsonb not null default '[]'::jsonb,
  notes text,
  claimed_by_machine_id uuid references public.machines(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tasks_priority_check check (priority between 1 and 4),

  constraint tasks_status_check check (
    status in (
      'created',
      'queued',
      'claimed_by_runner',
      'running',
      'paused',
      'stopping',
      'stopped',
      'completed',
      'failed',
      'blocked'
    )
  ),

  constraint tasks_risk_level_check check (
    risk_level in ('low', 'medium', 'high', 'critical')
  )
);

create table public.runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  machine_id uuid not null references public.machines(id) on delete cascade,
  status text not null default 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  summary text,
  error_message text,
  exit_code integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint runs_status_check check (
    status in (
      'pending',
      'running',
      'paused',
      'stopping',
      'stopped',
      'completed',
      'failed',
      'interrupted'
    )
  )
);

alter table public.machines
add constraint machines_current_run_id_fkey
foreign key (current_run_id) references public.runs(id) on delete set null;

create table public.run_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  run_id uuid not null references public.runs(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  machine_id uuid not null references public.machines(id) on delete cascade,
  level text not null default 'info',
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint run_logs_level_check check (
    level in ('debug', 'info', 'warn', 'error', 'command', 'result')
  )
);

create table public.run_control_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  run_id uuid not null references public.runs(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  machine_id uuid not null references public.machines(id) on delete cascade,
  type text not null,
  status text not null default 'pending',
  message text,
  requested_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint run_control_requests_type_check check (
    type in ('pause', 'resume', 'stop', 'emergency_stop')
  ),

  constraint run_control_requests_status_check check (
    status in ('pending', 'acknowledged', 'completed', 'failed', 'ignored')
  )
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  machine_id uuid references public.machines(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  run_id uuid references public.runs(id) on delete set null,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  run_id uuid not null references public.runs(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  machine_id uuid not null references public.machines(id) on delete cascade,
  status text not null,
  summary text not null,
  commands_run jsonb not null default '[]'::jsonb,
  files_changed jsonb not null default '[]'::jsonb,
  tests_run jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  next_steps jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint reports_status_check check (
    status in ('completed', 'failed', 'stopped', 'interrupted')
  )
);
```

---

## 16. Recommended Indexes

Add indexes for common dashboard and runner queries.

```sql
create index machines_user_id_idx
on public.machines(user_id);

create index machines_last_heartbeat_at_idx
on public.machines(last_heartbeat_at);

create index projects_user_id_idx
on public.projects(user_id);

create index projects_machine_id_idx
on public.projects(machine_id);

create index tasks_user_id_idx
on public.tasks(user_id);

create index tasks_machine_status_idx
on public.tasks(machine_id, status, priority, created_at);

create index runs_task_id_idx
on public.runs(task_id);

create index runs_machine_status_idx
on public.runs(machine_id, status);

create index run_logs_run_created_idx
on public.run_logs(run_id, created_at);

create index run_control_requests_run_status_idx
on public.run_control_requests(run_id, status, requested_at);

create index events_user_created_idx
on public.events(user_id, created_at desc);

create index events_run_created_idx
on public.events(run_id, created_at desc);

create unique index reports_one_per_run_idx
on public.reports(run_id);
```

---

## 17. `updated_at` Trigger

Use one generic trigger for updated timestamps.

```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_machines_updated_at
before update on public.machines
for each row execute function public.set_updated_at();

create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger set_tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

create trigger set_runs_updated_at
before update on public.runs
for each row execute function public.set_updated_at();

create trigger set_run_control_requests_updated_at
before update on public.run_control_requests
for each row execute function public.set_updated_at();
```

---

## 18. RLS Requirements

Enable RLS on all public tables.

```sql
alter table public.machines enable row level security;
alter table public.machine_pairing_tokens enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.runs enable row level security;
alter table public.run_logs enable row level security;
alter table public.run_control_requests enable row level security;
alter table public.events enable row level security;
alter table public.reports enable row level security;
```

Basic user policy pattern:

```sql
create policy "Users can read own machines"
on public.machines
for select
using (auth.uid() = user_id);

create policy "Users can insert own machines"
on public.machines
for insert
with check (auth.uid() = user_id);

create policy "Users can update own machines"
on public.machines
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own machines"
on public.machines
for delete
using (auth.uid() = user_id);
```

Apply the same ownership pattern to:

```text
projects
tasks
runs
run_logs
run_control_requests
events
reports
machine_pairing_tokens
```

For child tables, keep `user_id` directly on the row to make RLS simple.

---

## 19. Runner Access Model

The runner should not be treated like a normal browser user forever.

For MVP, there are two possible approaches.

### Option A — Simpler MVP

Runner uses a user session token after login.

Pros:

```text
easier to build
fewer backend functions
fastest prototype
```

Cons:

```text
less clean security boundary
runner acts like the user
harder to restrict machine-only actions
```

### Option B — Better Expandable Model

Runner uses machine credentials and calls controlled backend functions.

Pros:

```text
cleaner security boundary
machine can only act as itself
easier to audit
better for future hosted product
```

Cons:

```text
more work
requires RPC functions or Edge Functions
```

Recommendation:

```text
Use Option A only for a very quick prototype.
Use Option B for the serious MVP.
```

For serious architecture, build a small runner API layer that validates machine token and only allows runner-specific actions.

Runner-specific actions:

```text
heartbeat
verify project path
claim task
create run
append log
update run status
complete report
acknowledge control request
```

---

## 20. Task Claiming Rule

The runner must claim a queued task atomically.

Problem to avoid:

```text
Two runners claim the same task.
```

Recommended solution:

Use a database function later.

Conceptual behavior:

```text
Find highest-priority queued task for this machine.
Set status = claimed_by_runner.
Set claimed_by_machine_id = machine_id.
Set claimed_at = now().
Return task.
```

Only claim tasks where:

```text
status = 'queued'
machine_id = current_machine_id
claimed_by_machine_id is null
```

---

## 21. Example Task Claim Function

This is a future-safe direction.

```sql
create or replace function public.claim_next_task_for_machine(
  p_machine_id uuid
)
returns public.tasks
language plpgsql
security definer
as $$
declare
  v_task public.tasks;
begin
  select *
  into v_task
  from public.tasks
  where machine_id = p_machine_id
    and status = 'queued'
    and claimed_by_machine_id is null
  order by priority desc, created_at asc
  limit 1
  for update skip locked;

  if v_task.id is null then
    return null;
  end if;

  update public.tasks
  set
    status = 'claimed_by_runner',
    claimed_by_machine_id = p_machine_id,
    claimed_at = now(),
    updated_at = now()
  where id = v_task.id
  returning * into v_task;

  return v_task;
end;
$$;
```

For production, this function must validate that the runner is authorized for `p_machine_id`.

---

## 22. Event Payload Examples

### `MACHINE_CONNECTED`

```json
{
  "runnerVersion": "0.1.0",
  "platform": "windows",
  "nodeVersion": "22.x"
}
```

### `PROJECT_VERIFIED`

```json
{
  "localPath": "C:\\Users\\Said\\Projects\\nu-atrium",
  "exists": true
}
```

### `TASK_CLAIMED`

```json
{
  "taskId": "uuid",
  "machineId": "uuid",
  "claimedAt": "2026-07-06T20:00:00Z"
}
```

### `RUN_FAILED`

```json
{
  "errorMessage": "npm run build failed",
  "exitCode": 1
}
```

### `REPORT_CREATED`

```json
{
  "status": "completed",
  "commandsRunCount": 3,
  "filesChangedCount": 4,
  "risksCount": 1
}
```

---

## 23. Report JSON Shape

Example `reports` content:

```json
{
  "summary": "Task completed. Runner verified git status and build output.",
  "commands_run": [
    {
      "command": "git status",
      "status": "completed",
      "exitCode": 0
    },
    {
      "command": "npm run build",
      "status": "failed",
      "exitCode": 1
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
      "status": "failed",
      "summary": "Missing environment variable."
    }
  ],
  "risks": [
    {
      "level": "medium",
      "message": "Build depends on local environment variables."
    }
  ],
  "next_steps": [
    "Add missing env variable documentation.",
    "Rerun build after environment setup."
  ]
}
```

---

## 24. Future Tables

Do not build these in the first MVP, but design with them in mind.

### `agents`

Future agent registry.

```text
id
user_id
name
provider
role
status
capabilities
created_at
updated_at
```

### `skills`

Reusable skill packages.

```text
id
name
description
applies_to
version
content
created_at
updated_at
```

### `project_skills`

Skills attached to a project.

```text
id
project_id
skill_id
enabled
created_at
```

### `provider_accounts`

Connected account-based agent tools.

```text
id
user_id
provider
display_name
status
limit_state
last_used_at
created_at
updated_at
```

### `workspaces`

Isolated work areas for parallel agents.

```text
id
project_id
task_id
run_id
machine_id
workspace_path
branch_name
status
created_at
updated_at
```

### `approvals`

Human approval for risky actions.

```text
id
user_id
task_id
run_id
type
status
reason
requested_at
resolved_at
```

---

## 25. What Not To Store In MVP

Do not store:

```text
full source code files
.env contents
API keys
provider passwords
browser session cookies
large terminal dumps
private repo archives
raw AI account credentials
```

For MVP, keep sensitive execution local.

Cloud should store:

```text
status
logs after redaction
reports
metadata
events
```

---

## 26. Data Model Acceptance Criteria

The data model is acceptable when it supports:

1. User-owned machines.
2. Secure machine pairing.
3. Machine online/offline status.
4. Project registration with local path metadata.
5. Runner project verification.
6. Task creation and queueing.
7. Atomic task claiming.
8. Run creation and status tracking.
9. Live log storage.
10. Pause/resume/stop requests.
11. Final report storage.
12. Event timeline.
13. RLS isolation by user.
14. Future expansion into agents, skills, workspaces, and approvals.

---

## 27. Final Summary

The MVP data model should stay simple but serious.

Core tables:

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

This model supports the first real Architect loop:

```text
Control one machine.
Register one project.
Create one task.
Run it safely.
Stream logs.
Stop if needed.
Save report.
```

And it leaves clean space for the future system:

```text
CTO agents
team leads
labor agents
skills
provider accounts
limits
parallel workspaces
human approvals
AI software workforce orchestration
```
