---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are mandatory. Every user story requires unit and UI coverage.
Add integration, contract, adapter, and performance tests wherever the plan or
requirements touch those concerns.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Shared Web/Desktop app**: `apps/web/`, `apps/desktop/`, `packages/core/`,
  `packages/ui/`, `packages/platform/`
- **Scripts**: `scripts/windows/`, `scripts/macos/`, `scripts/linux/`
- Paths shown below assume the shared Web/Desktop structure required by the
  constitution - adjust only when plan.md documents an approved exception

<!-- 
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.
  
  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/
  
  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment
  
  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize [language] project with approved [framework] dependencies
- [ ] T003 [P] Configure linting and formatting tools
- [ ] T004 [P] Add Windows build, automated test, and UI test scripts in scripts/windows/
- [ ] T005 [P] Add macOS build, automated test, and UI test scripts in scripts/macos/
- [ ] T006 [P] Add Linux build, automated test, and UI test scripts in scripts/linux/
- [ ] T007 [P] Configure benchmark/performance test tooling documented in plan.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T008 Define shared business interfaces in packages/core/
- [ ] T009 [P] Define platform adapter interfaces in packages/platform/
- [ ] T010 [P] Implement read-only log access safeguards
- [ ] T011 [P] Implement inert log-content rendering/processing safeguards
- [ ] T012 Configure crash-safe session persistence and recovery
- [ ] T013 Configure error handling and logging infrastructure
- [ ] T014 Add adapter contract tests for platform interfaces
- [ ] T015 Run documented automated test scripts for the current phase

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1 (MANDATORY)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T016 [P] [US1] Unit test for [business rule] in tests/unit/test_[name].[ext]
- [ ] T017 [P] [US1] Integration test for [user journey] in tests/integration/test_[name].[ext]
- [ ] T018 [P] [US1] UI test for [user scenario] in tests/ui/test_[name].[ext]
- [ ] T019 [P] [US1] Performance test or benchmark for [affected performance requirement] in tests/performance/test_[name].[ext]

### Implementation for User Story 1

- [ ] T020 [P] [US1] Create [Entity1] model in packages/core/[path]/[entity1].[ext]
- [ ] T021 [P] [US1] Create [Entity2] model in packages/core/[path]/[entity2].[ext]
- [ ] T022 [US1] Implement shared [Service] in packages/core/[path]/[service].[ext] (depends on T020, T021)
- [ ] T023 [US1] Implement UI flow in packages/ui/[path]/[component].[ext]
- [ ] T024 [US1] Wire Web shell integration in apps/web/[path]/[file].[ext]
- [ ] T025 [US1] Wire Desktop shell integration in apps/desktop/[path]/[file].[ext]
- [ ] T026 [US1] Add validation, error handling, and read-only safety checks
- [ ] T027 [US1] Run documented automated test scripts for the current phase

**Checkpoint**: At this point, User Story 1 MUST be fully functional and testable independently

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2 (MANDATORY)

- [ ] T028 [P] [US2] Unit test for [business rule] in tests/unit/test_[name].[ext]
- [ ] T029 [P] [US2] Integration test for [user journey] in tests/integration/test_[name].[ext]
- [ ] T030 [P] [US2] UI test for [user scenario] in tests/ui/test_[name].[ext]
- [ ] T031 [P] [US2] Performance test or benchmark for [affected performance requirement] in tests/performance/test_[name].[ext]

### Implementation for User Story 2

- [ ] T032 [P] [US2] Create [Entity] model in packages/core/[path]/[entity].[ext]
- [ ] T033 [US2] Implement shared [Service] in packages/core/[path]/[service].[ext]
- [ ] T034 [US2] Implement UI flow in packages/ui/[path]/[component].[ext]
- [ ] T035 [US2] Wire Web and Desktop shell integrations
- [ ] T036 [US2] Integrate with User Story 1 components (if needed)
- [ ] T037 [US2] Run documented automated test scripts for the current phase

**Checkpoint**: At this point, User Stories 1 AND 2 MUST both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3 (MANDATORY)

- [ ] T038 [P] [US3] Unit test for [business rule] in tests/unit/test_[name].[ext]
- [ ] T039 [P] [US3] Integration test for [user journey] in tests/integration/test_[name].[ext]
- [ ] T040 [P] [US3] UI test for [user scenario] in tests/ui/test_[name].[ext]
- [ ] T041 [P] [US3] Performance test or benchmark for [affected performance requirement] in tests/performance/test_[name].[ext]

### Implementation for User Story 3

- [ ] T042 [P] [US3] Create [Entity] model in packages/core/[path]/[entity].[ext]
- [ ] T043 [US3] Implement shared [Service] in packages/core/[path]/[service].[ext]
- [ ] T044 [US3] Implement UI flow in packages/ui/[path]/[component].[ext]
- [ ] T045 [US3] Wire Web and Desktop shell integrations
- [ ] T046 [US3] Run documented automated test scripts for the current phase

**Checkpoint**: All user stories MUST now be independently functional

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Documentation updates in docs/
- [ ] TXXX Code cleanup and refactoring
- [ ] TXXX Performance optimization across all stories
- [ ] TXXX [P] Additional unit, integration, UI, and performance tests in tests/
- [ ] TXXX Security hardening
- [ ] TXXX Verify opened logs remain read-only and log content remains inert
- [ ] TXXX Verify crash-safe session recovery
- [ ] TXXX Run Windows build, automated test, and UI test scripts
- [ ] TXXX Run macOS build, automated test, and UI test scripts
- [ ] TXXX Run Linux build, automated test, and UI test scripts
- [ ] TXXX Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but MUST remain independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but MUST remain independently testable

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Shared business logic before platform shell wiring
- Platform interface contract tests before adapter implementation
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for [business rule] in tests/unit/test_[name].[ext]"
Task: "Integration test for [user journey] in tests/integration/test_[name].[ext]"
Task: "UI test for [user scenario] in tests/ui/test_[name].[ext]"
Task: "Performance test for [affected performance requirement] in tests/performance/test_[name].[ext]"

# Launch all models for User Story 1 together:
Task: "Create [Entity1] model in packages/core/[path]/[entity1].[ext]"
Task: "Create [Entity2] model in packages/core/[path]/[entity2].[ext]"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story MUST be independently completable and testable
- Verify tests fail before implementing
- Never change expected test results to match actual implementation behavior
- Run required automated tests after each phase
- Run UI tests on the corresponding target OS for OS-specific behavior
- Keep opened logs read-only and log content inert
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
