# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

- **Language/Version**: [e.g., TypeScript 5.x, Rust 1.75, or NEEDS CLARIFICATION]
- **Primary Dependencies**: [dependency list with justification for each addition or NEEDS CLARIFICATION]
- **Storage**: [if applicable, e.g., local files, IndexedDB, application state files, or N/A]
- **Testing**: [unit, integration, UI/E2E, OS-specific Desktop, Web, and benchmark tools or NEEDS CLARIFICATION]
- **Target Platform**: Web plus Desktop on Windows, macOS, and Linux unless explicitly out of scope
- **Project Type**: Shared Web/Desktop application
- **Shared Codebase Strategy**: [shared UI/business modules and platform shell layout or NEEDS CLARIFICATION]
- **Platform Interfaces**: [filesystem, file watching, dialogs, drag/drop, persistence, OS automation or N/A]
- **OS Build Scripts**: [Windows command; macOS command; Linux command or NEEDS CLARIFICATION]
- **OS Automated Test Scripts**: [Windows command; macOS command; Linux command or NEEDS CLARIFICATION]
- **OS UI Test Scripts**: [Windows command; macOS command; Linux command or NEEDS CLARIFICATION]
- **Read-Only/Security Model**: [how opened logs remain read-only and inert or NEEDS CLARIFICATION]
- **Session Recovery Model**: [crash-safe session persistence and recovery approach or NEEDS CLARIFICATION]
- **Performance Goals**: [domain-specific, e.g., 10M lines indexed, search latency, memory ceiling or NEEDS CLARIFICATION]
- **Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]
- **Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Technology stack is explicitly selected for Web, Desktop, UI, testing,
  benchmarking, and build tooling.
- Each dependency is necessary, justified, and checked for security,
  performance, and maintenance impact.
- Web and Desktop use one shared codebase; business logic is implemented once in
  shared modules.
- Platform-specific code is isolated behind explicit interfaces with contract
  tests or adapter tests.
- Build scripts are defined for Windows, macOS, and Linux.
- Automated test scripts are defined for Windows, macOS, and Linux.
- UI test scripts are defined for Windows, macOS, and Linux.
- Every development phase has required automated tests and phase-exit commands.
- Every user scenario has a mapped UI test.
- UI tests for OS-specific behavior run on the corresponding target OS.
- Expected test results are derived from requirements and are not rewritten to
  match implementation behavior.
- Opened log files remain read-only and log content is never executed.
- Session state is protected from data loss on unexpected errors.
- Performance requirements have planned tests, benchmarks, or measurements.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
apps/
├── web/                 # Browser shell using shared UI and business logic
└── desktop/             # Desktop shell using shared UI and platform adapters

packages/
├── core/                # Shared business logic: parsing, indexing, search, sync
├── ui/                  # Shared UI components and user-flow state
└── platform/            # Explicit interfaces plus Web/Desktop adapters

tests/
├── unit/
├── integration/
├── ui/
└── performance/

scripts/
├── windows/
├── macos/
└── linux/
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
