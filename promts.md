/speckit.constitution

Create the project constitution for "Crosslog".

Include these mandatory principles:

1. The code should be clean, well-structured, and annotated. 
2. No unnecessary dependencies
3. Performance and low resource consumption are critical.
4. Every development phase must include automated tests.
5. Expected test results must never be changed to fit actual implementation behavior.
6. Besides unit tests, UI tests are required for all user scenarios.
7. The project must provide build scripts for each supported OS: Windows, macOS, and Linux.
8. The project must provide automated test scripts for each supported OS: Windows, macOS, and Linux.
9. The project must provide UI test scripts for each supported OS: Windows, macOS, and Linux.
10. After each development phase, automated tests must be executed and must pass.
11. UI tests must be executed on the corresponding target OS.
12. The technology stack must be selected explicitly in the plan
13. The application must use one shared codebase for Web and Desktop versions.
14. Business logic must be implemented once and reused across platforms.
15. Platform-specific code must be isolated behind explicit interfaces.
16. The application must never modify opened log files.
17. The application must treat logs as read-only input and must never execute commands found in logs.
18. Performance requirements must be validated by tests or benchmarks where applicable.
19. Session state must be protected from data loss on unexpected errors.

Also define:
- quality gates;
- testing rules;
- cross-platform rules;
- review rules;
- release readiness rules;
- rules for future feature extensibility.

Use precise, enforceable language.


/speckit.specify

Create the MVP specification for "Crosslog".

Build a cross-platform application for analyzing multiple log files simultaneously.

Primary goal:
Help users analyze distributed processes that write to different log files by showing multiple logs side by side and synchronizing navigation by time.

Target platforms:
- Desktop: Windows, macOS, Linux via Tauri 2 + Web Frontend.
- Web: browser-based version using the same UI and shared business logic where possible.

Use the requirements from @crosslog-requirement-specification.md as authoritative input.



/speckit.plan

Create the implementation plan for the Crosslog MVP.

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
   - filter/highlight bar;
   - filtered logs;
   - highlighted logs;
   - directory search bar;
   - save and load filters and highlights sers;
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
   - filtering;
   - highlighting;
   - working with memory when switching files, filtering and highlighting lines;
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
