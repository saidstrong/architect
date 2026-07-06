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

comment on table public.machines is 'Local computers paired with Architect Runner.';
comment on column public.machines.machine_token_hash is 'Hash of the machine token. Plain machine token must never be stored.';

create table public.machine_pairing_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  machine_id uuid not null references public.machines(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.machine_pairing_tokens is 'Single-use, expiring pairing tokens for local runner setup.';
comment on column public.machine_pairing_tokens.token_hash is 'Hash of the one-time pairing token. Plain pairing token must never be stored.';

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

comment on table public.projects is 'Local project folders registered for a paired machine.';
comment on column public.projects.local_path is 'Project path metadata. File access happens only on the local runner.';

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

comment on table public.tasks is 'Structured work items created by the user for a local runner.';

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

comment on table public.runs is 'Execution attempts for tasks.';

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

comment on table public.run_logs is 'Append-only run log records after runner-side redaction and truncation.';

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

comment on table public.run_control_requests is 'Pause, resume, stop, and emergency stop requests for active runs.';

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  machine_id uuid references public.machines(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  run_id uuid references public.runs(id) on delete set null,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint events_type_check check (
    type in (
      'MACHINE_CREATED',
      'MACHINE_PAIRING_TOKEN_CREATED',
      'MACHINE_CONNECTED',
      'MACHINE_HEARTBEAT',
      'MACHINE_OFFLINE_DETECTED',
      'PROJECT_CREATED',
      'PROJECT_VERIFIED',
      'PROJECT_INVALID_PATH',
      'TASK_CREATED',
      'TASK_BLOCKED_FOR_RISK',
      'TASK_CLAIMED',
      'RUN_CREATED',
      'RUN_STARTED',
      'RUN_LOG_RECEIVED',
      'RUN_PAUSE_REQUESTED',
      'RUN_PAUSED',
      'RUN_RESUME_REQUESTED',
      'RUN_RESUMED',
      'RUN_STOP_REQUESTED',
      'RUN_STOPPED',
      'RUN_COMPLETED',
      'RUN_FAILED',
      'RUN_INTERRUPTED',
      'REPORT_CREATED',
      'COMMAND_BLOCKED'
    )
  )
);

comment on table public.events is 'Auditable event stream for Architect Runner MVP.';

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

comment on table public.reports is 'Final structured reports for completed, failed, stopped, or interrupted runs.';

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

create index machines_user_id_idx
on public.machines(user_id);

create index machines_last_heartbeat_at_idx
on public.machines(last_heartbeat_at);

create index machine_pairing_tokens_machine_id_idx
on public.machine_pairing_tokens(machine_id);

create index machine_pairing_tokens_expires_at_idx
on public.machine_pairing_tokens(expires_at);

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

alter table public.machines enable row level security;
alter table public.machine_pairing_tokens enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.runs enable row level security;
alter table public.run_logs enable row level security;
alter table public.run_control_requests enable row level security;
alter table public.events enable row level security;
alter table public.reports enable row level security;

create policy "Users can read own machines"
on public.machines
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own machines"
on public.machines
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own machines"
on public.machines
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own machines"
on public.machines
for delete
to authenticated
using (auth.uid() = user_id);

create policy "Users can read own machine pairing tokens"
on public.machine_pairing_tokens
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own machine pairing tokens"
on public.machine_pairing_tokens
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own machine pairing tokens"
on public.machine_pairing_tokens
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own machine pairing tokens"
on public.machine_pairing_tokens
for delete
to authenticated
using (auth.uid() = user_id);

create policy "Users can read own projects"
on public.projects
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own projects"
on public.projects
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own projects"
on public.projects
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own projects"
on public.projects
for delete
to authenticated
using (auth.uid() = user_id);

create policy "Users can read own tasks"
on public.tasks
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own tasks"
on public.tasks
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own tasks"
on public.tasks
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own tasks"
on public.tasks
for delete
to authenticated
using (auth.uid() = user_id);

create policy "Users can read own runs"
on public.runs
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own runs"
on public.runs
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own runs"
on public.runs
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can read own run logs"
on public.run_logs
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own run logs"
on public.run_logs
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can read own run control requests"
on public.run_control_requests
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own run control requests"
on public.run_control_requests
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own run control requests"
on public.run_control_requests
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can read own events"
on public.events
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own events"
on public.events
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can read own reports"
on public.reports
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own reports"
on public.reports
for insert
to authenticated
with check (auth.uid() = user_id);
