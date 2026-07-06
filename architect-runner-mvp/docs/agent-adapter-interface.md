# Architect Runner MVP — Agent Adapter Interface

## 1. Purpose

This document defines how Architect should plug in different AI agents and execution tools over time.

The MVP starts with only one adapter:

```text
manual_terminal
```

Future versions may add:

```text
claude_code
codex
cursor
kimi
grok
openai_api
local_model
github_actions
custom_agent
```

The goal is to avoid hardcoding Architect around one provider.

Architect should treat agents as replaceable workers behind a common interface.

---

## 2. Core Principle

Architect must separate these three concepts:

```text
Role
Provider
Adapter
```

They are not the same thing.

---

## 3. Role vs Provider vs Adapter

### Role

A role describes what the agent is responsible for.

Examples:

```text
CTO
Team Lead
Labor Agent
Reviewer
Tester
Security Reviewer
Deployment Operator
```

### Provider

A provider describes where the intelligence or execution comes from.

Examples:

```text
OpenAI
Claude
Codex
Cursor
Kimi
Grok
Manual
Local Model
```

### Adapter

An adapter is the technical integration that lets Architect use that provider.

Examples:

```text
OpenAI API Adapter
Claude Code Adapter
Codex Adapter
Cursor Adapter
Manual Terminal Adapter
```

Correct model:

```text
Role: CTO
Provider: OpenAI
Adapter: openai_api

Role: Labor Agent
Provider: Claude
Adapter: claude_code

Role: Labor Agent
Provider: Codex
Adapter: codex

Role: Tester
Provider: Manual / Terminal
Adapter: manual_terminal
```

Bad model:

```text
Claude = CTO
Codex = labor
OpenAI = always team lead
```

That would make the system rigid.

---

## 4. MVP Adapter Strategy

The MVP should only implement:

```text
Manual Terminal Adapter
```

The manual adapter proves the core system:

```text
task dispatch
run creation
log streaming
pause/stop controls
report creation
safe command execution
```

Do not start with Claude, Codex, Cursor, Kimi, or Grok automation.

Those should plug in later after the runner protocol works.

---

## 5. Adapter Responsibilities

An agent adapter is responsible for turning a task into execution.

Depending on the adapter, execution may mean:

* printing a task packet for manual use
* running safe terminal commands
* launching a local coding tool
* calling an API model
* supervising a CLI coding agent
* collecting logs and summaries
* reporting completion or failure

The adapter should not own the whole system.

The adapter should not directly control task lifecycle, database ownership, or security policy.

Architect Core owns:

```text
task state
run state
machine state
event history
security rules
control requests
final report storage
```

Adapter owns:

```text
how the work is executed
how output is collected
how status is interpreted
how provider-specific behavior is handled
```

---

## 6. Adapter Lifecycle

Every adapter should follow the same lifecycle.

```text
1. Check availability
2. Prepare task packet
3. Start execution
4. Stream logs
5. Watch control requests
6. Pause/resume/stop if supported
7. Collect result
8. Produce adapter result
9. Let Architect create final report
```

Lifecycle flow:

```text
Task
  ↓
Adapter.canRun()
  ↓
Adapter.prepare()
  ↓
Adapter.start()
  ↓
Adapter.stream/logs/status
  ↓
Adapter.stop/pause/resume if needed
  ↓
Adapter.collectResult()
  ↓
Run Report
```

---

## 7. Adapter Types

Architect should support different adapter types.

### 7.1 Manual Adapter

Human or external tool performs the work.

Architect provides task packet, logs, checks, and report.

```text
manual_terminal
```

Used in MVP.

---

### 7.2 API Agent Adapter

Uses an official API.

Examples:

```text
openai_api
anthropic_api later if needed
local_model_api
```

Best for:

```text
CTO reasoning
team lead planning
reviewing
summarizing
risk analysis
task packet generation
```

---

### 7.3 Local CLI Agent Adapter

Uses a local CLI tool installed on the laptop.

Examples:

```text
claude_code
codex_cli
cursor_cli if available
custom_cli_agent
```

Best for:

```text
labor-agent implementation
code editing
test fixing
repo-level work
```

---

### 7.4 Browser/Account Adapter

Uses an account-based browser or desktop session.

Examples:

```text
cursor_account
kimi_account
grok_account
other browser-based AI tools
```

This is fragile and should come later.

Risks:

```text
login expiry
UI changes
captchas
provider rules
session instability
inconsistent output
```

Architect should prefer official APIs and official CLIs where possible.

Browser/account adapters must respect provider terms and should manage availability, pausing, and legitimate usage limits — not bypass or evade them.

---

## 8. Adapter Interface — TypeScript Direction

Suggested core interface:

```ts
export interface AgentAdapter {
  id: string;
  name: string;
  provider: AgentProvider;
  adapterType: AgentAdapterType;
  supportedRoles: AgentRole[];
  capabilities: AgentCapability[];

  canRun(input: AdapterCanRunInput): Promise<AdapterCanRunResult>;

  prepare(input: AdapterPrepareInput): Promise<TaskPacket>;

  start(input: AdapterStartInput): Promise<AdapterRunHandle>;

  getStatus(input: AdapterStatusInput): Promise<AdapterStatusResult>;

  pause(input: AdapterControlInput): Promise<AdapterControlResult>;

  resume(input: AdapterControlInput): Promise<AdapterControlResult>;

  stop(input: AdapterControlInput): Promise<AdapterControlResult>;

  collectResult(input: AdapterCollectResultInput): Promise<AdapterRunResult>;
}
```

MVP does not need to implement every method fully.

For `manual_terminal`, pause/resume/stop can be simple and conservative.

---

## 9. Core Types

### Agent Provider

```ts
export type AgentProvider =
  | "manual"
  | "openai"
  | "claude"
  | "codex"
  | "cursor"
  | "kimi"
  | "grok"
  | "local_model"
  | "custom";
```

---

### Agent Adapter Type

```ts
export type AgentAdapterType =
  | "manual"
  | "api"
  | "local_cli"
  | "browser_account"
  | "desktop_app"
  | "custom";
```

---

### Agent Role

```ts
export type AgentRole =
  | "cto"
  | "team_lead"
  | "labor"
  | "reviewer"
  | "tester"
  | "security_reviewer"
  | "deployment_operator";
```

---

### Agent Capability

```ts
export type AgentCapability =
  | "planning"
  | "task_breakdown"
  | "code_editing"
  | "terminal_commands"
  | "testing"
  | "debugging"
  | "code_review"
  | "security_review"
  | "deployment"
  | "documentation"
  | "summarization"
  | "vision"
  | "browser_use";
```

---

## 10. Adapter Availability

Before Architect assigns work to an adapter, it must check availability.

### Availability statuses

```ts
export type AdapterAvailabilityStatus =
  | "available"
  | "busy"
  | "paused"
  | "limited"
  | "cooling_down"
  | "needs_login"
  | "missing_dependency"
  | "offline"
  | "disabled"
  | "error";
```

### `canRun` input

```ts
export interface AdapterCanRunInput {
  task: ArchitectTask;
  project: ArchitectProject;
  machine: ArchitectMachine;
  requiredRole: AgentRole;
  requiredCapabilities: AgentCapability[];
  requiredSkills: string[];
}
```

### `canRun` result

```ts
export interface AdapterCanRunResult {
  canRun: boolean;
  status: AdapterAvailabilityStatus;
  reason?: string;
  missingCapabilities?: AgentCapability[];
  missingSkills?: string[];
  estimatedRisk?: "low" | "medium" | "high" | "critical";
}
```

Example:

```json
{
  "canRun": false,
  "status": "limited",
  "reason": "Claude Code account is currently usage-limited.",
  "missingCapabilities": [],
  "estimatedRisk": "low"
}
```

---

## 11. Task Packet

Every adapter receives a structured task packet.

The task packet is the contract between Architect and the agent.

```ts
export interface TaskPacket {
  id: string;
  taskId: string;
  runId: string;
  projectId: string;
  machineId: string;

  title: string;
  objective: string;
  description: string;

  projectContext: ProjectContextSummary;
  role: AgentRole;
  adapterId: string;

  allowedActions: string[];
  forbiddenActions: string[];
  requiredChecks: string[];
  expectedOutputFormat: string;

  skills: SkillInstruction[];
  riskLevel: "low" | "medium" | "high" | "critical";

  createdAt: string;
}
```

The packet should be explicit enough that a labor agent does not guess the mission.

---

## 12. Project Context Summary

Adapters should not always receive the whole project.

They should receive a compact project context summary.

```ts
export interface ProjectContextSummary {
  name: string;
  localPath: string;
  stack?: string;
  description?: string;
  knownConstraints?: string[];
  recentDecisions?: string[];
  relevantFiles?: string[];
  testCommands?: string[];
}
```

Important rule:

The backend should not upload private source files by default.

The local runner can inspect files locally if the adapter needs them.

---

## 13. Skill Instructions

Future skill packages should be injected into task packets.

```ts
export interface SkillInstruction {
  id: string;
  name: string;
  version?: string;
  instructions: string;
  forbiddenPatterns?: string[];
  verificationSteps?: string[];
  checklist?: string[];
}
```

Example:

```json
{
  "id": "supabase-rls",
  "name": "Supabase RLS",
  "instructions": "Before changing RLS, inspect existing policies. Never use service role keys in client code.",
  "forbiddenPatterns": [
    "service role key in browser",
    "bypassing RLS from client"
  ],
  "verificationSteps": [
    "Confirm policies exist for select/insert/update/delete where needed.",
    "Test unauthorized access."
  ]
}
```

---

## 14. Start Execution

The `start` method begins the adapter run.

```ts
export interface AdapterStartInput {
  taskPacket: TaskPacket;
  project: ArchitectProject;
  machine: ArchitectMachine;
  run: ArchitectRun;
  signal: AdapterControlSignal;
  logger: AdapterLogger;
}
```

### Run handle

```ts
export interface AdapterRunHandle {
  adapterRunId: string;
  pid?: number;
  startedAt: string;
  status: "running" | "paused" | "completed" | "failed" | "stopped";
}
```

For manual adapter:

```text
adapterRunId = local generated ID
pid = optional
```

For CLI adapter:

```text
pid = child process ID if applicable
```

For browser/account adapter:

```text
adapterRunId = browser session or internal run ID
```

---

## 15. Adapter Logger

Adapters should not write directly to the database.

They should log through the runner’s logging layer so secrets can be redacted.

```ts
export interface AdapterLogger {
  debug(message: string, metadata?: Record<string, unknown>): Promise<void>;
  info(message: string, metadata?: Record<string, unknown>): Promise<void>;
  warn(message: string, metadata?: Record<string, unknown>): Promise<void>;
  error(message: string, metadata?: Record<string, unknown>): Promise<void>;
  command(message: string, metadata?: Record<string, unknown>): Promise<void>;
  result(message: string, metadata?: Record<string, unknown>): Promise<void>;
}
```

Runner logging layer must apply:

```text
secret redaction
size limits
run_id attachment
task_id attachment
machine_id attachment
timestamp
```

---

## 16. Adapter Control Signal

Adapters need a way to respond to pause/stop requests.

```ts
export interface AdapterControlSignal {
  isPauseRequested(): boolean;
  isStopRequested(): boolean;
  isEmergencyStopRequested(): boolean;
  waitIfPaused(): Promise<void>;
  throwIfStopped(): void;
}
```

For MVP, this can be simple.

Future adapters can support stronger process control.

---

## 17. Status Result

```ts
export interface AdapterStatusInput {
  adapterRunId: string;
  runId: string;
}

export interface AdapterStatusResult {
  status:
    | "pending"
    | "running"
    | "paused"
    | "stopping"
    | "stopped"
    | "completed"
    | "failed"
    | "unknown";

  message?: string;
  progress?: {
    currentStep?: string;
    completedSteps?: number;
    totalSteps?: number;
  };

  providerState?: {
    availability?: AdapterAvailabilityStatus;
    limitResetAt?: string;
    needsLogin?: boolean;
  };
}
```

---

## 18. Control Methods

### Pause

```ts
pause(input: AdapterControlInput): Promise<AdapterControlResult>;
```

Pause means:

```text
Do not start new steps.
Hold current run state if possible.
Allow resume later.
```

---

### Resume

```ts
resume(input: AdapterControlInput): Promise<AdapterControlResult>;
```

Resume means:

```text
Continue from the next safe step.
```

---

### Stop

```ts
stop(input: AdapterControlInput): Promise<AdapterControlResult>;
```

Stop means:

```text
End the run safely.
Do not continue automatically.
```

---

### Control input

```ts
export interface AdapterControlInput {
  adapterRunId: string;
  runId: string;
  taskId: string;
  reason?: string;
}
```

### Control result

```ts
export interface AdapterControlResult {
  accepted: boolean;
  status: "completed" | "failed" | "ignored";
  message?: string;
}
```

---

## 19. Collect Result

After execution, the adapter returns a structured result.

```ts
export interface AdapterCollectResultInput {
  adapterRunId: string;
  runId: string;
  taskId: string;
  project: ArchitectProject;
}
```

```ts
export interface AdapterRunResult {
  status: "completed" | "failed" | "stopped" | "interrupted";

  summary: string;

  commandsRun: CommandRunResult[];

  filesChanged: FileChangeResult[];

  testsRun: TestRunResult[];

  risks: RiskResult[];

  nextSteps: string[];

  rawOutputPreview?: string;

  metadata?: Record<string, unknown>;
}
```

---

## 20. Command Result

```ts
export interface CommandRunResult {
  command: string;
  status: "completed" | "failed" | "blocked" | "skipped";
  exitCode?: number;
  durationMs?: number;
  stdoutPreview?: string;
  stderrPreview?: string;
}
```

---

## 21. File Change Result

```ts
export interface FileChangeResult {
  path: string;
  changeType:
    | "added"
    | "modified"
    | "deleted"
    | "renamed"
    | "unknown";
}
```

For MVP, this can come from:

```bash
git diff --name-only
git status --porcelain
```

---

## 22. Test Run Result

```ts
export interface TestRunResult {
  command: string;
  status: "passed" | "failed" | "skipped" | "blocked";
  summary?: string;
  exitCode?: number;
}
```

---

## 23. Risk Result

```ts
export interface RiskResult {
  level: "low" | "medium" | "high" | "critical";
  message: string;
  source?: "adapter" | "runner" | "test" | "human" | "provider";
}
```

Example:

```json
{
  "level": "medium",
  "message": "Build failed because local environment variables are missing.",
  "source": "test"
}
```

---

## 24. Manual Terminal Adapter

The MVP adapter.

### Adapter ID

```text
manual_terminal
```

### Provider

```text
manual
```

### Adapter Type

```text
manual
```

### Supported roles

```text
labor
tester
reviewer
```

### Capabilities

```text
terminal_commands
testing
documentation
summarization
```

### Responsibilities

The manual terminal adapter should:

* receive a task packet
* print task packet locally
* stream task packet to web logs
* run safe diagnostic commands
* collect git status
* optionally run expected safe commands
* respect pause/stop requests
* create structured result

### MVP flow

```text
1. Receive task packet.
2. Log task packet.
3. Verify project path.
4. Run `git status`.
5. Run `git diff --name-only`.
6. Run allowed expected commands if provided.
7. Collect command results.
8. Generate report.
```

### Not required in MVP

The manual adapter does not need to:

```text
edit code by itself
control Claude or Codex
open browser sessions
perform autonomous implementation
run unsafe commands
commit changes
deploy to production
```

---

## 25. OpenAI API Adapter — Future

The OpenAI API adapter should mainly be used for management roles.

Suggested roles:

```text
CTO
Team Lead
Reviewer
Security Reviewer
Tester
```

Best use cases:

```text
mission planning
task breakdown
risk detection
task packet generation
review summaries
report interpretation
architecture recommendations
```

It should not be the first code-editing labor adapter.

Future flow:

```text
User goal
  ↓
OpenAI CTO Adapter
  ↓
mission plan
  ↓
OpenAI Team Lead Adapter
  ↓
task packets
  ↓
Labor Adapter
```

---

## 26. Claude Code Adapter — Future

Suggested role:

```text
Labor Agent
```

Best use cases:

```text
implementation
debugging
refactoring
test fixing
repo-level code edits
```

The adapter should:

* check whether Claude Code is installed and authenticated
* prepare task packet
* start Claude Code session if supported
* monitor logs/output
* detect limit or login problems
* collect final summary
* return structured result

Possible statuses:

```text
available
busy
limited
needs_login
missing_dependency
error
```

---

## 27. Codex Adapter — Future

Suggested role:

```text
Labor Agent
```

Best use cases:

```text
implementation
bug fixes
code generation
test repair
small-to-medium tasks
```

The adapter should:

* verify Codex CLI/app availability if applicable
* check session/account state if possible
* prepare task packet
* run task in isolated workspace later
* collect changed files and command results
* detect usage limit state
* return structured result

---

## 28. Cursor Adapter — Future

Suggested role:

```text
Labor Agent
```

Best use cases:

```text
interactive code editing
larger refactors
UI changes
manual-supervised implementation
```

Cursor may be harder to automate cleanly unless official hooks or CLI support exists.

Treat it as a later adapter.

---

## 29. Kimi / Grok / Other Adapters — Future

These should follow the same interface.

Do not create provider-specific core logic.

Each provider adapter should answer:

```text
Can I run this task?
What role do I support?
What capabilities do I have?
Am I available?
Do I have usage limits?
Can I pause/resume/stop?
How do I return structured results?
```

---

## 30. Provider Limit State

Future adapters should expose legitimate availability and limit state.

```ts
export interface ProviderLimitState {
  status:
    | "unknown"
    | "available"
    | "near_limit"
    | "limited"
    | "cooling_down"
    | "needs_login";

  remainingRequests?: number;
  remainingTokens?: number;
  resetAt?: string;
  message?: string;
}
```

Usage-limit behavior:

```text
If provider is available:
  adapter can accept task.

If provider is limited:
  adapter should refuse new task.

If provider is cooling down:
  scheduler may wait or choose another adapter.

If provider needs login:
  user must fix account/session manually.
```

Important boundary:

Architect should manage availability and scheduling of authorized tools. It should not be designed to bypass, evade, or abuse provider limits.

---

## 31. Adapter Selection — Future

The scheduler should eventually select adapters based on:

```text
required role
required capabilities
required skills
project stack
task risk
agent availability
provider limit state
current workload
workspace availability
user preference
```

Example:

```text
Task: Add Supabase RLS policy
Required skills: supabase-rls, sql
Risk: high

Preferred flow:
1. OpenAI Team Lead creates task packet.
2. Labor agent implements.
3. Security reviewer checks RLS.
4. Human approves migration.
```

MVP does not need full scheduler logic.

---

## 32. Workspace Requirements — Future

For future labor adapters, each agent should work in an isolated workspace.

Possible workspace types:

```text
main project path
git branch
git worktree
copied workspace
container
remote sandbox
```

Rule for multi-agent future:

```text
One labor agent = one task workspace.
```

The adapter interface should eventually receive:

```ts
export interface WorkspaceContext {
  type: "main" | "git_branch" | "git_worktree" | "copy" | "container";
  path: string;
  branchName?: string;
}
```

MVP can use the main project path.

---

## 33. Adapter Safety Rules

All adapters must obey runner safety rules.

Adapters must not:

```text
run destructive commands without approval
expose secrets in logs
send .env files to cloud
change files outside project path
deploy to production by default
bypass provider limits
modify system directories
delete project directories
```

Adapters should:

```text
use task packets
log actions
return structured results
respect pause/stop requests
report uncertainty
fail visibly
avoid hidden side effects
```

---

## 34. Adapter Output Rules

Adapters must return structured output.

Bad output:

```text
Done. Everything works.
```

Good output:

```json
{
  "status": "completed",
  "summary": "Implemented task and build passed.",
  "commandsRun": [
    {
      "command": "npm run build",
      "status": "completed",
      "exitCode": 0
    }
  ],
  "filesChanged": [
    {
      "path": "app/tasks/page.tsx",
      "changeType": "modified"
    }
  ],
  "testsRun": [
    {
      "command": "npm run build",
      "status": "passed"
    }
  ],
  "risks": [],
  "nextSteps": [
    "Review UI manually before merging."
  ]
}
```

Architect should not trust vague summaries.

---

## 35. Adapter Failure Rules

If an adapter fails, it must explain why.

Failure types:

```text
provider_limited
needs_login
missing_dependency
unsafe_command_blocked
project_path_invalid
execution_failed
user_stopped
network_error
unknown_error
```

Failure result example:

```json
{
  "status": "failed",
  "summary": "Adapter could not start because Claude Code is not authenticated.",
  "commandsRun": [],
  "filesChanged": [],
  "testsRun": [],
  "risks": [
    {
      "level": "low",
      "message": "No code changes were made.",
      "source": "adapter"
    }
  ],
  "nextSteps": [
    "Authenticate Claude Code locally.",
    "Retry the task."
  ],
  "metadata": {
    "failureType": "needs_login"
  }
}
```

---

## 36. Adapter Registry

Architect should have an adapter registry.

```ts
export interface AdapterRegistry {
  register(adapter: AgentAdapter): void;
  get(adapterId: string): AgentAdapter | undefined;
  list(): AgentAdapter[];
  listByRole(role: AgentRole): AgentAdapter[];
  listByCapability(capability: AgentCapability): AgentAdapter[];
}
```

Initial registry:

```ts
registry.register(manualTerminalAdapter);
```

Future:

```ts
registry.register(openAiCtoAdapter);
registry.register(claudeCodeAdapter);
registry.register(codexAdapter);
registry.register(cursorAdapter);
```

---

## 37. Adapter Configuration

Each adapter may need configuration.

```ts
export interface AdapterConfig {
  adapterId: string;
  enabled: boolean;
  provider: AgentProvider;
  displayName: string;
  defaultRole?: AgentRole;
  capabilities: AgentCapability[];
  settings: Record<string, unknown>;
}
```

Examples:

```json
{
  "adapterId": "manual_terminal",
  "enabled": true,
  "provider": "manual",
  "displayName": "Manual Terminal",
  "defaultRole": "labor",
  "capabilities": ["terminal_commands", "testing", "summarization"],
  "settings": {
    "runGitStatus": true,
    "runGitDiffNameOnly": true,
    "allowExpectedCommands": true
  }
}
```

---

## 38. Minimum MVP Implementation

For the MVP, implement only:

```text
AgentAdapter interface
Adapter registry
Manual Terminal Adapter
Task packet generation
Safe command execution
Structured adapter result
```

Do not implement:

```text
OpenAI CTO adapter
Claude Code adapter
Codex adapter
Cursor adapter
Kimi adapter
Grok adapter
provider account tracking
automatic scheduler
multi-agent execution
browser automation
```

---

## 39. MVP Acceptance Criteria

The adapter system is acceptable when:

1. Architect Core can call an adapter through a common interface.
2. Manual Terminal Adapter is registered.
3. Manual Terminal Adapter can receive a task packet.
4. Manual Terminal Adapter can stream logs.
5. Manual Terminal Adapter can run only allowed commands.
6. Manual Terminal Adapter can respect stop requests.
7. Manual Terminal Adapter can collect command results.
8. Manual Terminal Adapter can detect changed files through git.
9. Manual Terminal Adapter can return a structured result.
10. Architect can convert adapter result into a final report.
11. The core system does not contain provider-specific Claude/Codex/Cursor logic.
12. Future adapters can be added without rewriting task/run architecture.

---

## 40. Expansion Path

Add adapters in this order:

```text
1. manual_terminal
2. openai_api_planner
3. openai_api_reviewer
4. claude_code_labor
5. codex_labor
6. cursor_labor
7. other providers
8. browser/account adapters only if necessary
```

This order is safer because:

```text
manual adapter proves execution loop
OpenAI planner adds management intelligence
reviewer adds quality control
labor adapters add real coding power
browser/account adapters come last because they are fragile
```

---

## 41. Final Summary

The Agent Adapter Interface is the expansion layer of Architect.

It lets Architect grow from:

```text
one manual runner
```

into:

```text
CTO agents
team leads
labor agents
reviewers
testers
multi-provider execution
limit-aware scheduling
skill-based task assignment
```

without rewriting the core system.

The first implementation should stay narrow:

```text
manual_terminal only
```

But the architecture should already assume:

```text
many roles
many providers
many adapters
many capabilities
many future execution styles
```

Architect should not be a Claude wrapper, Codex wrapper, or Cursor wrapper.

Architect should be the control system above them.
