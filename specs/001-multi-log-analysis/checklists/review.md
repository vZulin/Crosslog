# Requirements Review Checklist: Crosslog MVP

**Purpose**: Validate Crosslog MVP requirements, plan, and task clarity before implementation
**Created**: 2026-06-15
**Feature**: [spec.md](../spec.md)

**Note**: This checklist tests whether the requirements are complete, clear,
consistent, measurable, and ready for implementation review. It does not test
the implementation.

## Requirement Completeness

- [ ] CHK001 Are all seven user scenarios represented by functional requirements and task phases? [Completeness, Spec §User Scenarios, Tasks §Phases 3-9]
- [ ] CHK002 Are file opening, directory opening, live update, deletion, replacement, search, synchronization, and session restore requirements all documented? [Completeness, Spec §FR-001-FR-064]
- [ ] CHK003 Are platform capability differences between Desktop and Web fully specified, including unavailable browser monitoring behavior? [Completeness, Spec §FR-060-FR-062, Plan §Technical Context]
- [ ] CHK004 Are MVP exclusions for remote access, file manager features, filtering, highlighting, saved sets, and recursive search consistently documented? [Completeness, Spec §FR-063-FR-064, Plan §Constraints]
- [ ] CHK005 Are future extension points documented without implying MVP behavior for excluded features? [Completeness, Spec §FR-064, Plan §Future UI Slots]
- [ ] CHK006 Are all required OS build, automated test, UI test, Web build, Desktop build, and performance scripts specified? [Completeness, Plan §Script Matrix by OS, Tasks §Phase 1]

## Requirement Clarity

- [ ] CHK007 Is "newest file" clearly defined by creation time with file-name fallback? [Clarity, Spec §FR-019-FR-020]
- [ ] CHK008 Is directory "top-level files only" scope unambiguous for empty directories and subdirectories? [Clarity, Spec §FR-003, Spec §Edge Cases]
- [ ] CHK009 Are file deletion and same-name replacement requirements distinguishable and non-overlapping? [Clarity, Spec §FR-047-FR-048]
- [ ] CHK010 Is timestamp recognition behavior clear for multiple candidates, invalid candidates, and untimed lines? [Clarity, Spec §FR-031-FR-037]
- [ ] CHK011 Is synchronized scrolling selection defined precisely as greatest timestamp less than or equal to anchor time? [Clarity, Spec §FR-041]
- [ ] CHK012 Are time offset units and synchronization effects specified without ambiguity? [Clarity, Spec §FR-044-FR-046]
- [ ] CHK013 Is the browser capability limitation wording specific enough to prevent unsupported behavior from being promised? [Clarity, Spec §FR-062, Plan §Test Strategy]

## Requirement Consistency

- [ ] CHK014 Do spec, plan, and tasks consistently exclude filtering and highlighting from MVP while reserving extension points? [Consistency, Spec §FR-063-FR-064, Plan §Future UI Slots, Tasks §T053-T055]
- [ ] CHK015 Do Desktop UI test requirements consistently account for Windows/Linux tauri-driver and macOS XCTest/Accessibility differences? [Consistency, Plan §Testing, Plan §Script Matrix by OS, Tasks §T016-T017]
- [ ] CHK016 Are read-only log requirements consistent across security requirements, platform contracts, and tasks? [Consistency, Spec §CR-001-CR-002, Contracts §FileAccessPort, Tasks §T043/T125/T168]
- [ ] CHK017 Are session restore requirements consistent about preserving pane/source state but not scroll positions? [Consistency, Spec §FR-050-FR-051, Data Model §Session, Tasks §T147]
- [ ] CHK018 Are performance targets consistent between success criteria, plan performance goals, and benchmark tasks? [Consistency, Spec §SC-002-SC-004, Plan §Performance Goals, Tasks §T113/T170/T171]
- [ ] CHK019 Are task phase dependencies consistent with the user story priorities and MVP slice definition? [Consistency, Spec §User Scenarios, Tasks §Dependencies]

## Acceptance Criteria Quality

- [ ] CHK020 Are success criteria quantified with concrete limits or percentages where required? [Measurability, Spec §SC-001-SC-010]
- [ ] CHK021 Are reference test conditions for 20 MB open/search and 200 ms switching explicitly deferred to planning and benchmark tasks? [Measurability, Spec §SC-002-SC-004, Plan §Test Strategy]
- [ ] CHK022 Can synchronized scrolling correctness be objectively measured from the current acceptance criteria? [Acceptance Criteria, Spec §SC-005, Spec §User Story 2]
- [ ] CHK023 Can live update visibility be objectively evaluated without relying on vague timing language? [Acceptance Criteria, Spec §SC-006, Spec §User Story 5]
- [ ] CHK024 Are UI-test coverage requirements tied to every user scenario and each supported target where available? [Acceptance Criteria, Spec §CR-006, Tasks §Format Validation]
- [ ] CHK025 Are phase-completion criteria defined in terms of required scripts and passing tests rather than informal review? [Acceptance Criteria, Plan §Quality Gates, Tasks §Quality Gate Enforcement]

## Scenario Coverage

- [ ] CHK026 Are primary flows covered for opening multiple files/directories and comparing them side by side? [Coverage, Spec §User Story 1]
- [ ] CHK027 Are alternate flows covered for disabling synchronization and handling untimed panes? [Coverage, Spec §User Story 2]
- [ ] CHK028 Are directory alternate flows covered for missing creation time, new files, deleted files, and recreated same-name files? [Coverage, Spec §User Story 3]
- [ ] CHK029 Are search alternate and exception flows covered for regex mode, case sensitivity, appended lines, and invalid regex? [Coverage, Spec §User Story 4, Spec §Edge Cases]
- [ ] CHK030 Are live file exception flows covered for corrupted files, read errors, deletion, and replacement? [Coverage, Spec §User Story 5, Spec §FR-047-FR-059]
- [ ] CHK031 Are recovery flows covered for session corruption and last-valid session restore? [Coverage, Spec §User Story 6, Plan §Session Recovery Model]
- [ ] CHK032 Are browser-specific flows covered for available file/directory loading and unavailable monitoring capabilities? [Coverage, Spec §User Story 7]

## Edge Case Coverage

- [ ] CHK033 Are file size and insufficient memory boundaries specified with user-visible outcomes? [Edge Case, Spec §FR-054-FR-057]
- [ ] CHK034 Are encoding detection failures and manual encoding selection requirements specified? [Edge Case, Spec §FR-052-FR-053]
- [ ] CHK035 Are empty directory and subdirectory-only cases addressed in requirements, not only listed as edge cases? [Gap, Spec §Edge Cases]
- [ ] CHK036 Are requirements defined for invalid timestamp parser configuration files? [Gap, Spec §FR-031-FR-033]
- [ ] CHK037 Are requirements defined for simultaneous file append and search result update interactions? [Coverage, Spec §FR-030, Spec §FR-047]
- [ ] CHK038 Are requirements defined for pane overflow when many panes exceed viewport width? [Edge Case, Spec §FR-017-FR-018]

## Non-Functional Requirements

- [ ] CHK039 Are read-only and inert-content security requirements specific enough to reject command-like text, links, and terminal escape sequences? [Security, Spec §CR-001-CR-002, Spec §Edge Cases]
- [ ] CHK040 Are performance requirements defined for all critical high-cost paths: open, search, switch, synchronization, live append, and session write? [Performance, Spec §SC-002-SC-007, Tasks §Performance]
- [ ] CHK041 Are low-resource requirements translated into measurable memory or stopping criteria? [Gap, Plan §Performance Goals, Spec §FR-057]
- [ ] CHK042 Are accessibility requirements for keyboard selection, copying, pane controls, search controls, and status messages specified? [Gap, Spec §FR-049, Plan §UI/UX Design]
- [ ] CHK043 Are OS-specific UI-test requirements complete for Windows, macOS, Linux, and browser targets? [Coverage, Spec §CR-006, Plan §Testing]
- [ ] CHK044 Are data-loss prevention requirements specified for unexpected errors and corrupt session snapshots? [Reliability, Spec §CR-004, Plan §Session Recovery Model]

## Dependencies & Assumptions

- [ ] CHK045 Are assumptions about browser filesystem capability variance documented and linked to requirements? [Assumption, Spec §Assumptions, Plan §Risk List]
- [ ] CHK046 Are dependency choices justified by requirement needs and no-unnecessary-dependency policy? [Dependency, Plan §Selected Stack Recommendation, Plan §Alternatives Considered]
- [ ] CHK047 Are platform adapter boundaries specified for all platform-specific behavior named in the constitution? [Dependency, Contracts §Platform Ports]
- [ ] CHK048 Are test fixture requirements documented for every measurable success criterion? [Dependency, Quickstart §Validation Fixtures]
- [ ] CHK049 Are release validation scripts traceable from plan to tasks and contracts? [Traceability, Plan §Script Matrix by OS, Contracts §Build and Test Scripts, Tasks §T175-T184]

## Ambiguities & Conflicts

- [ ] CHK050 Is the term "where available" for browser directory loading bounded enough to avoid inconsistent browser requirements? [Ambiguity, Spec §FR-061]
- [ ] CHK051 Is the phrase "any number of timestamp formats" constrained enough for performance and configuration validation? [Ambiguity, Spec §FR-033]
- [ ] CHK052 Does the spec define whether manual encoding choice persists per file, per session, or only for the current open operation? [Gap, Spec §FR-053]
- [ ] CHK053 Is the relationship between file replacement and retained deleted-file content clear enough for expected behavior? [Ambiguity, Spec §FR-047-FR-048]
- [ ] CHK054 Are current and future session fields separated clearly enough to avoid implementing excluded filter/highlight features in MVP? [Conflict Risk, Spec §FR-050, Spec §FR-063-FR-064]

## Notes

- Focus areas: cross-platform requirements quality, read-only/security rules,
  session recovery, performance measurability, UI-test coverage, and MVP scope
  boundaries.
- Depth: Standard PR review gate.
- Actor/timing: Reviewer before implementation starts.

## Implementation Readiness Addendum

These items reflect the post-analysis updates to `spec.md`, `plan.md`, and
`tasks.md`. Use them as the final requirements-writing gate before starting
implementation.

Supersession note: CHK035 is superseded by CHK055/CHK068, CHK036 is superseded
by CHK058/CHK070, CHK040 is superseded by CHK065/CHK066, CHK043 is superseded
by CHK060/CHK075, and CHK052 remains a non-blocking clarification unless the
implementation intends to persist manual encoding choices beyond the current
open operation.

## Updated Requirement Completeness

- [ ] CHK055 Are empty-directory and subdirectory-only outcomes now specified as functional requirements rather than only as edge cases? [Completeness, Spec §FR-065, Spec §Edge Cases]
- [ ] CHK056 Are file opening requirements traceable from user scenarios through platform adapters, read-only commands, file policy, and UI/source loading tasks? [Traceability, Spec §FR-001-FR-007, Plan §Source Loading Adapters, Tasks §T057-T069]
- [ ] CHK057 Are manual encoding selection requirements represented in domain state, UI requirements, Web tests, and Desktop tests? [Completeness, Spec §FR-052-FR-053, Plan §Phase 3.2, Tasks §T063-T067]
- [ ] CHK058 Are timestamp configuration loading, validation, and invalid-config error requirements represented across spec, plan, and tasks? [Completeness, Spec §FR-031-FR-033, Plan §Phase 3.4, Tasks §T102-T106]
- [ ] CHK059 Are keyboard copy and context-menu copy requirements traceable to explicit UI model and UI test tasks? [Traceability, Spec §FR-049, Plan §Phase 3.3, Tasks §T079-T081/T091]

## Updated Requirement Consistency

- [ ] CHK060 Are macOS development-phase validation rules consistent with release readiness requirements for Windows and Linux scripts? [Consistency, Plan §Script Matrix by OS, Plan §Quality Gates, Tasks §Quality Gate Enforcement]
- [ ] CHK061 Are macOS XCTest/Accessibility requirements consistently reflected in selected stack, setup scope, scripts, and task coverage? [Consistency, Plan §Testing, Plan §Phase 3.1, Tasks §T017-T019/T023]
- [ ] CHK062 Are SourcePickerPort and DragDropSourcePort requirements consistent with the platform isolation principle and the Desktop source loading task coverage? [Consistency, Constitution §IV, Plan §Source Loading Adapters, Tasks §T044-T045/T068-T069]
- [ ] CHK063 Are browser file access tasks scoped as browser loading integration rather than duplicating shared FileAccessPort implementation responsibilities? [Consistency, Plan §Shared Codebase Strategy, Tasks §T060/T189]
- [ ] CHK064 Are task IDs and task counts consistent after the added readiness tasks and renumbering? [Traceability, Tasks §Format Validation]

## Updated Acceptance Criteria Quality

- [ ] CHK065 Is the fresh-start three-source workflow success criterion covered by a measurable benchmark requirement and task? [Measurability, Spec §SC-001, Plan §Phase 3.8, Tasks §T200]
- [ ] CHK066 Are file open, search, directory switch, and fresh-start performance requirements each tied to explicit benchmark tasks? [Measurability, Spec §SC-001-SC-004, Plan §Performance Goals, Tasks §T198-T200]
- [ ] CHK067 Are phase completion expectations clear enough to distinguish local macOS development validation from cross-OS release readiness validation? [Clarity, Plan §Quality Gates, Tasks §Quality Gate Enforcement]

## Updated Scenario and Edge Case Coverage

- [ ] CHK068 Are empty-directory requirements covered for both Web and Desktop UI requirement quality, not just core directory model behavior? [Coverage, Spec §FR-065, Tasks §T122-T124/T132]
- [ ] CHK069 Are manual encoding exception flows specified for failed automatic detection without weakening automatic encoding detection requirements? [Coverage, Spec §FR-052-FR-053, Tasks §T063-T067]
- [ ] CHK070 Are invalid timestamp configuration requirements specified without conflicting with line-level invalid timestamp candidate behavior? [Consistency, Spec §FR-031-FR-036, Tasks §T102-T106]
- [ ] CHK071 Are source loading requirements complete for primary open action, Desktop picker, Desktop drag/drop, and browser drag/drop capability boundaries? [Coverage, Spec §FR-008-FR-009/FR-061, Plan §Source Loading Adapters, Tasks §T044-T045/T068-T069/T186-T190]

## Updated Non-Functional Requirements

- [ ] CHK072 Are read-only safety requirements tied to concrete adapter boundaries and read-only command responsibilities before implementation begins? [Security, Spec §CR-001, Contracts §FileAccessPort, Tasks §T057-T062]
- [ ] CHK073 Are inert-content requirements still traceable after adding text selection and context-menu copy behavior? [Security, Spec §CR-002/FR-049, Tasks §T079-T081/T091/T196]
- [ ] CHK074 Are resource-protection requirements represented for pre-load size checks, memory policy, and performance benchmarks? [Performance, Spec §FR-054-FR-057/SC-001-SC-004, Tasks §T058-T059/T197-T200]
- [ ] CHK075 Are cross-platform UI automation requirements specific enough for the selected Desktop automation backends and browser UI tests? [Coverage, Spec §CR-006/SC-010, Plan §Testing, Tasks §T015-T019/T183-T187/T204-T213]
