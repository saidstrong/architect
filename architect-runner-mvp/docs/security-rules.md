# Architect Runner MVP — Security Rules

## 1. Purpose

This document defines the security rules for Architect Runner MVP.

Architect Runner MVP controls a real local laptop through a web dashboard. That makes security a core system requirement, not an optional improvement.

The system must be designed so that:

```text
User can remotely supervise their laptop.
Runner can execute controlled project workflows.
Backend can store state and logs.
No one gets arbitrary shell access.
Secrets are not leaked.
Destructive actions are blocked by default.
```

---

## 2. Core Security Principle

Architect Runner is **not** a remote shell.

It is a controlled task runner.

The web app should not be able to send arbitrary terminal commands directly to the laptop.

Correct model:

```text
User creates structured task
→ backend stores task
→ runner claims task
→ runner checks safety rules
→ runner executes only allowed workflow
→ runner streams redacted logs
→ runner saves report
```

Incorrect model:

```text
User types any command in browser
→ laptop executes it immediately
```

That would be dangerous and should not be built.

---

## 3. Main Threats

Architect must protect against these risks:

```text
Unauthorized access to dashboard
Unauthorized pairing of a machine
Stolen machine token
Arbitrary command execution
Execution outside project directory
Secret leakage through logs
Destructive git commands
Database destruction
Production deployment by mistake
Provider account misuse
Malicious task instructions
Runner crash leaving stale state
Duplicate task execution
```

---

## 4. Trust Boundaries

The system has four main trust zones.

```text
1. Browser Dashboard
   User-facing control interface.

2. Cloud Backend
   Stores metadata, task state, logs, events, and reports.

3. Local Runner
   Executes safe workflows on the user’s machine.

4. Local Project Files
   Private source code and secrets.
```

Important rule:

```text
The backend should not directly access private local project files.
```

The runner is the only component that touches the local filesystem.

---

## 5. Authentication Rules

### Web user authentication

The web app must require user login.

Use Supabase Auth.

Rules:

```text
Only authenticated users can access dashboard.
Users can only access their own machines, projects, tasks, runs, logs, events, and reports.
Sessions should be protected by Supabase Auth defaults.
Sensitive actions should require authenticated user context.
```

---

## 6. Machine Pairing Rules

Machine pairing connects a local runner to a user account.

Pairing must be controlled.

### Required pairing flow

```text
1. User logs into web dashboard.
2. User creates a new machine.
3. Backend creates a one-time pairing token.
4. Web app shows token once.
5. User runs architect-runner login locally.
6. Runner submits pairing token.
7. Backend validates token.
8. Backend returns machine credentials.
9. Runner stores machine credentials locally.
10. Pairing token is marked as used.
```

### Pairing token rules

```text
Token must expire.
Token must be single-use.
Plain token must not be stored in the database.
Only token hash should be stored.
Used token cannot be reused.
Expired token cannot be reused.
Token should be shown once in the web UI.
```

Recommended expiry:

```text
10–30 minutes
```

---

## 7. Machine Token Rules

The runner should authenticate using:

```text
machine_id + machine_token
```

Rules:

```text
Machine token must be stored locally.
Only a hash of the machine token may be stored in the database.
Machine token must never be committed to git.
Machine token must never be printed in logs.
Machine token must never be sent to run_logs.
Machine token must be revocable from the web dashboard later.
```

Recommended local config location:

```text
Windows:
C:\Users\<User>\.architect\config.json

macOS/Linux:
~/.architect/config.json
```

The config file should be outside project folders.

---

## 8. Runner Authorization Rules

The runner should only perform actions for its own machine.

Allowed runner actions:

```text
send heartbeat
verify projects assigned to its machine
claim tasks assigned to its machine
create runs for claimed tasks
append logs for its own runs
read pending control requests for its own runs
acknowledge control requests
complete control requests
update statuses for its own runs
create reports for its own runs
```

Runner should not be allowed to:

```text
read all user data
create arbitrary tasks
create arbitrary projects
access other machines
access other users
modify user settings
delete user account data
access projects not assigned to it
execute tasks not claimed by it
```

---

## 9. Row-Level Security Rules

All public database tables must have RLS enabled.

Tables requiring RLS:

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

Basic user rule:

```text
auth.uid() = user_id
```

Every user-owned row should contain `user_id`.

This keeps RLS simple and reduces accidental cross-user access.

---

## 10. Runner API Security

For a serious MVP, runner actions should go through controlled RPC functions or backend endpoints.

Runner requests must validate:

```text
machine_id exists
machine_token is valid
machine belongs to expected user
task belongs to machine
run belongs to machine
project belongs to machine
control request belongs to run
```

Do not trust client-submitted IDs alone.

Every runner action should verify ownership and relationship chain.

Example:

```text
Can runner append log to this run?

Check:
1. machine token valid
2. run.machine_id = machine.id
3. run.user_id = machine.user_id
4. run.status allows logging
```

---

## 11. Local File Access Rules

The runner may only access registered and verified project directories.

Rules:

```text
Runner must reject unknown paths.
Runner must reject unverified project paths.
Runner must not access system directories.
Runner must not access home directory as a whole project.
Runner must not access ~/.ssh.
Runner must not access ~/.architect except for its own config.
Runner must not access directories outside the project unless explicitly allowed later.
```

Blocked path examples:

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

Allowed path example:

```text
C:\Users\Said\Projects\nu-atrium
```

---

## 12. Path Guard Rules

Before any file or command operation, the runner must pass a path guard.

Path guard checks:

```text
project path exists
project path is a directory
project path is registered in backend
project status is verified
resolved command working directory is inside project path
no path traversal outside project
no symlink escape if possible
```

The runner should normalize paths before checking.

Dangerous examples:

```text
..\..\Windows
../../.ssh
project/../../secrets
symlink to system folder
```

When uncertain, block.

---

## 13. Command Execution Rules

The MVP must not support arbitrary command execution from the browser.

The runner may execute only allowed commands.

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

### Requires approval in future versions

```text
npm install
pnpm install
yarn install
npx prisma migrate
supabase migration
git checkout -b
git add
git commit
vercel deploy
```

### Blocked by default

```text
rm -rf
del /s /q
rmdir /s
git reset --hard
git clean -fd
sudo
chmod -R
chown -R
curl | bash
wget | bash
database reset
supabase db reset
production deployment
environment variable modification
secret file reading
deleting project directories
formatting drives
```

---

## 14. Command Allowlist Rules

Commands must be checked before execution.

Rules:

```text
Use exact command allowlist where possible.
Do not allow shell pipes by default.
Do not allow command chaining by default.
Do not allow arbitrary arguments for risky commands.
Do not allow commands containing destructive substrings.
Do not execute if command cannot be parsed safely.
```

Dangerous shell patterns:

```text
|
&&
||
;
>
>>
`
$()
curl
wget
sudo
rm
del
rmdir
chmod
chown
reset --hard
clean -fd
```

Some of these may be allowed later under controlled approval, but not in MVP.

---

## 15. Environment Secret Rules

The runner must not expose secrets.

Never upload these to backend logs:

```text
.env
.env.local
.env.production
API keys
database passwords
JWT secrets
machine token
provider account tokens
browser cookies
SSH keys
private keys
Supabase service role key
```

The runner should not read `.env` files unless a future approved feature explicitly needs environment inspection.

Even then, values should be redacted.

---

## 16. Secret Redaction Rules

Before sending logs to the backend, redact secrets.

Redact values near these names:

```text
OPENAI_API_KEY
ANTHROPIC_API_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
DATABASE_URL
POSTGRES_URL
JWT_SECRET
NEXTAUTH_SECRET
VERCEL_TOKEN
GITHUB_TOKEN
PRIVATE_KEY
PASSWORD
SECRET
TOKEN
COOKIE
SESSION
```

Example before:

```text
OPENAI_API_KEY=sk-abc123
```

After:

```text
OPENAI_API_KEY=[REDACTED]
```

Redaction principle:

```text
False positive redaction is acceptable.
Secret leakage is not acceptable.
```

---

## 17. Log Safety Rules

Cloud logs should be useful but limited.

Rules:

```text
Redact secrets before upload.
Limit single log message size.
Do not upload full source files by default.
Do not upload full terminal dumps without truncation.
Do not upload .env contents.
Do not upload browser cookies.
Do not upload private keys.
```

Recommended limits:

```text
Single log message: max 10,000 characters
Command output preview: max 20,000 characters
Full output: local-only artifact unless explicitly approved later
```

---

## 18. Report Safety Rules

Reports may include:

```text
summary
commands run
changed file paths
test results
risks
next steps
```

Reports should not include:

```text
full source code
secret values
private keys
raw environment files
provider credentials
browser session data
```

File paths are allowed, but values inside sensitive files are not.

---

## 19. Project Registration Safety

When user registers a project path, the runner must verify it.

Project should be rejected if:

```text
path does not exist
path is not a directory
path points to system directory
path points to user home root
path points to ~/.ssh
path points to ~/.architect
path is unreadable
path is suspicious
```

Project can be verified if:

```text
path exists
path is directory
path is not blocked
runner can access it
project seems like a normal code project
```

---

## 20. Task Safety Rules

Tasks are instructions, not commands.

The task description may say:

```text
Delete everything and rebuild.
```

The runner must not obey that literally.

The runner should treat task text as untrusted input.

Task execution must still pass:

```text
project path guard
command allowlist
risk detector
adapter safety rules
control request checks
```

---

## 21. Risk Detection Rules

The runner should detect risky task language.

Risky phrases:

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

If detected, MVP behavior should be conservative:

```text
mark task as blocked
log safety warning
create event
require future approval mechanism
```

For MVP, it is acceptable to block rather than approve.

---

## 22. Pause / Stop Safety Rules

Pause and stop must be safe.

### Pause

Pause means:

```text
Do not start new execution steps.
Wait for current safe step to finish if needed.
Keep run state.
Allow resume later.
```

### Stop

Stop means:

```text
End the run safely.
Do not continue automatically.
Create final report.
```

### Emergency stop

Emergency stop means:

```text
Stop active execution as quickly as safely possible.
Do not start new tasks.
Create event and report if possible.
```

Emergency stop must not automatically:

```text
delete files
reset git
clean worktree
rollback migrations
deploy recovery changes
```

---

## 23. Destructive Action Rules

Destructive actions are blocked in MVP.

Blocked examples:

```text
delete files
delete directories
reset git
clean git
drop database
reset database
remove packages
overwrite environment files
force push
production deployment
system-level changes
```

Future versions may allow some risky actions through an approval system.

Approval system must include:

```text
action type
risk level
exact command or operation
reason
affected project
affected files if known
human approval
audit event
```

---

## 24. Git Safety Rules

Allowed in MVP:

```text
git status
git diff --stat
git diff --name-only
```

Blocked in MVP:

```text
git reset --hard
git clean -fd
git push --force
git checkout main with uncommitted changes
git rebase
git commit without review
```

Future allowed with approval:

```text
git checkout -b
git add
git commit
git merge
git worktree
```

Architect should not automatically commit or push in the first version.

---

## 25. Database Safety Rules

The runner must not execute database-destructive commands in MVP.

Blocked:

```text
supabase db reset
drop table
truncate table
delete from without where
production migrations
schema reset
```

Future database actions should require:

```text
explicit approval
migration preview
backup warning
environment detection
local vs production confirmation
```

Important rule:

```text
Never run production database operations by default.
```

---

## 26. Deployment Safety Rules

Production deployments are blocked in MVP.

Blocked:

```text
vercel deploy --prod
supabase deploy to production
database production migration
any command that changes live customer-facing systems
```

Future deployment should require:

```text
human approval
build success
test summary
target environment confirmation
rollback plan
deployment event
```

---

## 27. Provider Account Safety

Future labor agents may use account-based tools like Codex, Claude Code, Cursor, Kimi, Grok, or others.

Rules:

```text
Use only authorized accounts.
Respect provider terms and usage limits.
Do not bypass or evade provider limits.
Do not scrape credentials.
Do not store raw provider passwords.
Do not upload browser cookies to backend.
Do not automate fragile browser sessions in MVP.
```

Architect may track legitimate availability:

```text
available
busy
limited
cooling_down
needs_login
offline
```

But it should not be designed to abuse limits.

---

## 28. Browser Automation Safety

Browser/account automation should not be part of MVP.

If added later:

```text
must be opt-in
must respect provider terms
must not steal cookies
must not bypass captchas
must not evade rate limits
must not hide automation from providers where prohibited
must isolate sessions
must log actions safely
```

Prefer official APIs and official CLIs.

---

## 29. AI Instruction Safety

AI-generated task packets should not override system safety.

If an AI agent says:

```text
Run rm -rf and rebuild.
```

The runner still blocks it.

Safety hierarchy:

```text
1. Runner safety rules
2. User approvals
3. Project constraints
4. Task packet
5. AI agent suggestions
```

AI output is advisory, not authority.

---

## 30. Control Request Authorization

Only the authenticated owner should be able to create control requests for their own runs.

Control requests include:

```text
pause
resume
stop
emergency_stop
```

Rules:

```text
User can only control own run.
Runner can only acknowledge requests for its own run.
Completed requests should not be reused.
All control requests should be recorded.
```

---

## 31. Event Audit Rules

Every major security-relevant action should create an event.

Security-relevant events:

```text
MACHINE_PAIRING_TOKEN_CREATED
MACHINE_CONNECTED
MACHINE_TOKEN_USED
PROJECT_VERIFIED
PROJECT_INVALID_PATH
TASK_CREATED
TASK_BLOCKED_FOR_RISK
TASK_CLAIMED
RUN_STARTED
COMMAND_BLOCKED
RUN_PAUSE_REQUESTED
RUN_STOP_REQUESTED
RUN_EMERGENCY_STOP_REQUESTED
RUN_FAILED
REPORT_CREATED
```

Events should include enough metadata for debugging, but not secrets.

---

## 32. Error Handling Security

Errors must not leak secrets.

Bad error:

```text
Build failed because DATABASE_URL=postgres://user:password@host...
```

Good error:

```text
Build failed because DATABASE_URL=[REDACTED] appears misconfigured.
```

Rules:

```text
Redact before logging.
Do not expose stack traces with secrets.
Do not print machine token.
Do not expose full local paths unnecessarily in public contexts.
```

For this MVP, local project paths may appear in the user’s private dashboard, but should still be treated as sensitive metadata.

---

## 33. Offline / Stale State Safety

If runner goes offline during a run:

```text
web app should show stale/offline state
run should not be marked completed automatically
after threshold, mark interrupted or stale
runner should resolve state on restart
```

The backend should not assume success without runner report.

---

## 34. Duplicate Execution Safety

The runner must avoid executing the same task twice.

Rules:

```text
task must be atomically claimed
task must be assigned to this machine
runner must not claim task if current_run_id exists
runner must not execute already-running task
runner must not create duplicate active runs for same task
```

If duplicate is detected:

```text
block execution
log warning
create event
require manual review later
```

---

## 35. Local Runner Process Safety

The local runner should be conservative.

Rules:

```text
Do not run as administrator/root unless necessary.
Do not request system-wide permissions in MVP.
Do not modify system files.
Do not install global packages automatically.
Do not change firewall/router settings.
Do not open inbound ports.
Use outbound backend connection only.
```

---

## 36. Network Security Rules

The runner should communicate only with the configured Architect backend.

Rules:

```text
Use HTTPS.
Do not send machine token over insecure channels.
Do not open inbound ports.
Do not expose localhost publicly.
Do not accept unauthenticated local network commands.
```

The runner should not become a LAN-accessible remote executor.

---

## 37. Local Artifacts Rules

Local logs and artifacts may be stored in:

```text
~/.architect/logs/
~/.architect/runs/
```

Rules:

```text
Do not store provider passwords.
Do not store raw browser cookies.
Do not store secrets in plain logs if avoidable.
Keep artifacts local unless explicitly uploaded.
```

---

## 38. MVP Security Defaults

MVP should default to:

```text
single user
one machine
one active run
manual/terminal adapter only
restricted commands
no destructive actions
no production deployment
no browser automation
no provider credentials stored
no full source upload
redacted logs
event audit trail
```

These limits are not weakness. They are what make the system buildable and safe.

---

## 39. Future Approval System

Later, Architect should support approvals for risky actions.

Approval required for:

```text
database migrations
package installation
git commits
git pushes
deployment
file deletion
auth/security changes
RLS changes
environment variable changes
production actions
```

Approval record should include:

```text
requested action
risk level
exact command or operation
reason
affected project
requested by agent/user
approved by user
timestamp
result
```

Until approval system exists, block risky actions.

---

## 40. Security Acceptance Criteria

Security is acceptable for MVP when:

1. Web dashboard requires authentication.
2. Users can only access their own records.
3. Runner pairs through a one-time token.
4. Pairing token expires and is single-use.
5. Runner token is stored locally and redacted.
6. Runner only acts for its own machine.
7. Runner only accesses verified project paths.
8. Runner blocks suspicious paths.
9. Runner does not execute arbitrary browser commands.
10. Runner uses command allowlist.
11. Destructive commands are blocked.
12. Production deployments are blocked.
13. Database reset/destruction is blocked.
14. Logs are redacted before upload.
15. `.env` files are not uploaded.
16. Full source files are not uploaded by default.
17. Pause/stop/emergency stop are supported.
18. Duplicate execution is prevented.
19. Major actions create events.
20. Runner does not open inbound laptop ports.

---

## 41. Final Summary

Architect Runner MVP must be secure by design because it controls a real machine.

The correct security posture is:

```text
structured tasks, not arbitrary shell
outbound runner connection, not open ports
verified project paths, not full filesystem access
allowed commands, not free execution
redacted logs, not raw terminal dumps
events and reports, not hidden actions
human approval for risky future actions
```

The first version should be boring, strict, and safe.

That is what allows Architect to later expand into CTO agents, team leads, labor agents, provider adapters, skill packages, and multi-agent scheduling without becoming dangerous.
