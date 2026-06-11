/speckit.constitution

Create the project constitution for "Multi-Log Analyzer".

The constitution must define non-negotiable engineering principles for a cross-platform Web/Desktop log analysis application.

Include these mandatory principles:

1. Every development phase must include automated tests.
2. Expected test results must never be changed to fit actual implementation behavior.
3. Besides unit tests, UI tests are required for all user scenarios.
4. The project must provide build scripts for each supported OS: Windows, macOS, and Linux.
5. The project must provide automated test scripts for each supported OS: Windows, macOS, and Linux.
6. The project must provide UI test scripts for each supported OS: Windows, macOS, and Linux.
7. After each development phase, automated tests must be executed and must pass.
8. UI tests must be executed on the corresponding target OS.
9. The application must use one shared codebase for Web and Desktop versions.
10. Business logic must be implemented once and reused across platforms.
11. Platform-specific code must be isolated behind explicit interfaces.
12. The application must never modify opened log files.
13. The application must treat logs as read-only input and must never execute commands found in logs.
14. Performance requirements must be validated by tests or benchmarks where applicable.
15. Session state must be protected from data loss on unexpected errors.

Also define:
- quality gates;
- testing rules;
- cross-platform rules;
- review rules;
- release readiness rules;
- rules for future feature extensibility.

Use precise, enforceable language.


/speckit.specify

Create the MVP specification for "Multi-Log Analyzer".

Build a cross-platform application for analyzing multiple log files simultaneously.

Primary goal:
Help users analyze distributed processes that write to different log files by showing multiple logs side by side and synchronizing navigation by time.

Target platforms:
- Desktop: Windows, macOS, Linux via Tauri 2 + Web Frontend.
- Web: browser-based version using the same UI and shared business logic where possible.

MVP scope:
- Open individual log files.
- Open directories containing logs.
- Display multiple logs simultaneously in independent Log Panes.
- Synchronize scrolling between panes by recognized timestamps.
- Search within each opened file.
- Automatically display newly appended lines for mutable local files on Desktop.
- Save and restore user sessions.
- Support drag and drop for files and directories.
- Support configurable timestamp formats.
- Support per-pane time offsets.
- Support text selection and copy.
- Handle deleted files and log rotation.

Out of scope for MVP:
- SSH access.
- File manager.
- Log filtering.
- Log highlighting.
- Saved filter sets.
- Recursive directory search.

Use the requirements below as authoritative input.

[PASTE THE FULL REQUIREMENTS FROM THE MESSAGE HERE]

Important specification rules:
- Convert all requirements into testable user stories and acceptance criteria.
- Preserve requirement IDs where possible.
- Explicitly mark Web/Desktop behavioral differences.
- Define user scenarios for UI testing.
- Define edge cases for file deletion, log rotation, timestamp parsing, directory navigation, encoding detection, and session restore.
- Do not choose the final technology stack here except for fixed constraints already stated: Tauri 2, Web Frontend, Windows, macOS, Linux.
- Keep architecture extensible for future filters, highlighting, directory-wide search, and SSH.


/speckit.plan

Create the implementation plan for the Multi-Log Analyzer MVP.

The plan must include explicit phases for:

1. Technology stack selection.
   Evaluate options for:
   - frontend framework;
   - state management;
   - virtualization library;
   - desktop bridge architecture for Tauri 2;
   - shared business-logic package structure;
   - file watching abstraction;
   - encoding detection;
   - timestamp parsing;
   - session persistence.

2. Automated testing framework selection.
   Evaluate options for:
   - unit tests;
   - integration tests;
   - UI/E2E tests;
   - cross-platform desktop tests;
   - browser tests;
   - performance benchmarks.

3. UI/UX design phase.
   Define:
   - Log Pane layout;
   - empty state;
   - add/split pane behavior;
   - resizing behavior;
   - horizontal scrolling behavior;
   - directory navigation controls;
   - search controls;
   - synchronization toggle;
   - time offset controls;
   - deleted-file status;
   - error states.

4. Architecture design.
   Include:
   - shared domain layer;
   - platform adapters;
   - file source abstraction;
   - directory source abstraction;
   - navigation index;
   - timestamp recognition service;
   - synchronization engine;
   - search engine;
   - session storage;
   - file watching and log rotation detection;
   - UI component structure.

5. Development phases.
   Each phase must include:
   - implementation scope;
   - automated tests;
   - UI tests where user scenarios are affected;
   - OS-specific scripts if applicable;
   - acceptance criteria;
   - required test command execution after the phase.

6. Build and test automation.
   Define scripts for:
   - build: Windows, macOS, Linux;
   - unit/integration tests: Windows, macOS, Linux;
   - UI tests: Windows, macOS, Linux;
   - web build;
   - desktop build;
   - performance checks.

7. Quality gates.
   Enforce the constitution:
   - no phase is complete without passing automated tests;
   - expected test results must not be changed to match broken behavior;
   - all user scenarios must have UI tests;
   - UI tests must run on the corresponding OS.

Planning constraints:
- Desktop stack must use Tauri 2.
- Web and Desktop must share as much UI and business logic as possible.
- Business logic must be reusable across platforms.
- Platform-specific code must be isolated behind interfaces.
- MVP must not implement future features, but architecture must allow them.

Produce:
- selected stack recommendation with rationale;
- alternatives considered;
- phase breakdown;
- risk list;
- test strategy;
- script matrix by OS;
- initial project structure.
