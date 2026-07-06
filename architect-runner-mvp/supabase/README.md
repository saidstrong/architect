# Supabase

This folder contains the Architect Runner MVP database foundation.

Apply migrations with the Supabase CLI from the repo root:

```bash
supabase db push
```

The Phase 2 migration creates:

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

RLS is enabled on every public table. Policies use direct ownership through `auth.uid() = user_id`.

Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Never expose it to browser code or commit real environment values.
