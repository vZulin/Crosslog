<!--
Sync Impact Report
Version change: N/A -> 1.0.0
Modified principles:
- Template placeholder -> I. Clean, Minimal, Annotated Code
- Template placeholder -> II. Performance and Resource Discipline
- Template placeholder -> III. Test Integrity and Phase Gates
- Template placeholder -> IV. Shared Cross-Platform Codebase
- Template placeholder -> V. Read-Only Log Safety and Session Resilience
Added sections:
- Quality Gates and Testing Rules
- Cross-Platform Architecture and Extensibility
- Review and Release Readiness
Removed sections:
- Template placeholder sections
Templates requiring updates:
- ✅ updated: .specify/templates/plan-template.md
- ✅ updated: .specify/templates/spec-template.md
- ✅ updated: .specify/templates/tasks-template.md
- ✅ reviewed: .specify/templates/checklist-template.md
- ✅ reviewed: .specify/templates/agent-file-template.md
- ✅ reviewed: .specify/templates/commands/*.md (directory absent)
- ✅ reviewed: .specify/extensions/git/commands/*.md
- ✅ reviewed: crosslog-requirement-specification.md
Follow-up TODOs: None
-->

# Crosslog Constitution

## Core Principles

### I. Clean, Minimal, Annotated Code
Production code MUST be clean, cohesive, and organized around explicit
responsibilities. Public interfaces, non-obvious decisions, and safety-critical
paths MUST be documented in English. Comments MUST explain why a decision exists,
not repeat what the code already states. New dependencies MUST be rejected unless
the implementation plan documents the need, alternatives considered, resource
impact, security impact, and maintenance cost. Dead code, speculative
abstractions, and dependency additions without a direct requirement are
constitution violations.

Rationale: Crosslog is a log-analysis tool that must remain maintainable across
Web and Desktop targets without accumulating platform drift or avoidable supply
chain risk.

### II. Performance and Resource Discipline
Performance and low resource consumption are critical requirements. Every plan
MUST define measurable performance goals and resource constraints for the feature
or explicitly state that the feature has no measurable performance impact.
Parsing, indexing, rendering, file watching, and search behavior MUST be designed
for large log files and multiple simultaneous panes. Applicable performance
requirements MUST be validated by automated tests, benchmarks, or recorded
measurements before release readiness is claimed.

Rationale: Crosslog exists to inspect active and historical logs efficiently; a
slow or memory-heavy implementation defeats the primary product purpose.

### III. Test Integrity and Phase Gates
Every development phase MUST include automated tests. Unit tests are required for
business logic, parsing, indexing, search, session handling, and platform
interfaces. UI tests are required for every user scenario. Expected test results
MUST be derived from requirements and MUST NOT be changed to match actual
implementation behavior. If implementation behavior differs from expected test
results, the implementation or the approved requirement MUST be corrected before
the phase can pass.

After each development phase, the required automated tests MUST be executed and
MUST pass. UI tests MUST be executed on the corresponding target OS for
OS-specific behavior. A phase with skipped, failing, or unexecuted required tests
is incomplete.

Rationale: Test baselines protect product behavior. Rewriting expectations to
fit defects removes the only objective signal that the implementation still
matches the specification.

### IV. Shared Cross-Platform Codebase
Crosslog MUST use one shared codebase for Web and Desktop versions. Business
logic MUST be implemented once and reused across platforms. Platform-specific
code MUST be isolated behind explicit interfaces with contract tests or adapter
tests. The implementation plan MUST select the technology stack explicitly,
including the Web runtime, Desktop runtime, UI framework, test frameworks,
benchmark tooling, and build tooling.

The project MUST provide build scripts, automated test scripts, and UI test
scripts for each supported OS: Windows, macOS, and Linux. Script names and exact
commands MUST be documented in the plan and kept runnable from a clean checkout.

Rationale: Shared logic prevents inconsistent behavior between Web and Desktop
while explicit adapters keep platform capabilities testable and replaceable.

### V. Read-Only Log Safety and Session Resilience
Crosslog MUST treat opened log files as read-only input. The application MUST
NOT modify opened log files, truncate them, normalize them in place, rewrite
encoding, or create sidecar state beside them unless the user explicitly chooses
a separate export or project-state location. The application MUST NOT execute
commands, scripts, links, escape sequences, or instructions found in logs. Log
content MUST be rendered and processed as inert data.

Session state MUST be protected from data loss on unexpected errors. Session
persistence MUST use crash-safe writes, validation, and recovery behavior that
prevents corrupt session state from deleting the last known usable session.

Rationale: Logs may contain untrusted production data. The analyzer must not
change evidence, execute untrusted content, or lose the user's analysis context
after a crash.

## Quality Gates and Testing Rules

Each specification, plan, task list, implementation phase, and release candidate
MUST pass these gates:

- Requirement gate: user scenarios, acceptance criteria, edge cases,
  performance expectations, read-only log safety, and session recovery behavior
  are stated before implementation begins.
- Plan gate: technology stack, dependencies, shared-codebase strategy, platform
  interfaces, build scripts, automated test scripts, UI test scripts, and
  benchmark strategy are explicitly selected.
- Test-design gate: unit, integration, UI, and applicable benchmark tests are
  mapped to requirements before implementation tasks are marked complete.
- Test-integrity gate: expected results are reviewed against requirements, not
  current implementation output.
- Phase-completion gate: required automated tests for the phase pass on the
  required OS targets before the next phase starts.
- Performance gate: applicable performance targets have passing tests,
  benchmarks, or recorded measurements.
- Security gate: opened logs are read-only and log content remains inert.
- Session gate: unexpected errors preserve or recover the last valid session
  state.

Testing rules:

- Unit tests MUST cover reusable business logic and platform interface
  contracts.
- Integration tests MUST cover file opening, directory indexing, file watching,
  search, synchronization, and session persistence where affected by a feature.
- UI tests MUST cover every user scenario from the specification.
- UI tests for OS-specific Desktop behavior MUST run on the corresponding OS:
  Windows tests on Windows, macOS tests on macOS, and Linux tests on Linux.
- Web UI tests MUST run in the browser targets selected in the implementation
  plan.
- Automated test scripts MUST exist for Windows, macOS, and Linux and MUST be
  documented with exact commands.
- UI test scripts MUST exist for Windows, macOS, and Linux and MUST be
  documented with exact commands.
- Failing tests MUST block phase completion and release readiness.

## Cross-Platform Architecture and Extensibility

Cross-platform rules:

- The repository MUST keep Web and Desktop implementations in one shared
  codebase.
- Business logic MUST live in shared modules and MUST NOT be duplicated inside
  platform shells.
- Platform-specific behavior MUST be isolated behind explicit interfaces for
  filesystem access, file watching, window integration, drag and drop, dialogs,
  persistence, and OS automation.
- Platform adapters MUST have tests proving conformance to shared contracts.
- Shared UI components MUST be reused between Web and Desktop wherever the
  selected technology stack allows it.
- Feature plans MUST describe any unavoidable platform divergence and provide a
  test strategy for each divergent behavior.

Future feature extensibility rules:

- Features such as SSH sources, recursive directory scanning, filtering,
  highlighting, saved filter sets, and alternate log sources MUST be added
  through extension points or explicit interfaces rather than by duplicating
  core parsing, indexing, synchronization, or UI state logic.
- New source types MUST preserve read-only input handling and inert log content.
- New parsing or indexing strategies MUST expose measurable performance
  expectations and tests.
- New platform capabilities MUST be introduced as adapters with contract tests.
- Dependency additions for future features MUST pass the dependency justification
  required by Principle I.

## Review and Release Readiness

Review rules:

- Every change MUST be reviewed for constitutional compliance before merge.
- Reviewers MUST verify that tests map to requirements and that expected results
  were not changed to fit defective behavior.
- Reviewers MUST verify that opened logs remain read-only and untrusted log
  content is never executed.
- Reviewers MUST verify that business logic remains shared and platform-specific
  code remains isolated behind explicit interfaces.
- Reviewers MUST require benchmark or measurement evidence when a feature
  affects parsing, indexing, search, synchronization, rendering, file watching,
  or session persistence performance.
- Reviewers MUST reject unnecessary dependencies, unclear ownership boundaries,
  duplicated business logic, and undocumented platform divergence.

Release readiness rules:

- Release candidates MUST have passing automated tests for Windows, macOS, and
  Linux using the documented OS-specific scripts.
- Release candidates MUST have passing UI tests on each supported target OS
  using the documented UI test scripts.
- Release candidates MUST have passing Web UI tests for the selected browser
  targets.
- Release candidates MUST include passing build outputs for Windows, macOS, and
  Linux using the documented build scripts.
- Release candidates MUST include performance evidence for applicable
  performance requirements.
- Release candidates MUST include verified crash-safe session recovery behavior.
- Release candidates MUST NOT ship with unresolved violations of read-only log
  handling, inert log content, duplicated business logic, or unapproved
  dependency additions.

## Governance

This constitution supersedes conflicting project guidance, templates, plans, and
informal practices. When another artifact conflicts with this constitution, the
constitution controls and the artifact MUST be updated before the related work
continues.

Amendments MUST be made through a documented change that includes the rationale,
affected principles or sections, migration impact, required template updates,
and compliance impact for active feature work. Amendments require review before
adoption.

Versioning policy:

- MAJOR version increments apply to incompatible governance changes, principle
  removals, or redefinitions that weaken or materially alter existing
  obligations.
- MINOR version increments apply to added principles, added sections, or
  materially expanded guidance.
- PATCH version increments apply to clarifications, wording corrections, and
  non-semantic refinements.

Compliance review MUST occur during specification, planning, task generation,
implementation review, and release readiness review. Any approved exception MUST
be documented in the implementation plan with a time-bounded mitigation and
follow-up task.

**Version**: 1.0.0 | **Ratified**: 2026-06-15 | **Last Amended**: 2026-06-15
