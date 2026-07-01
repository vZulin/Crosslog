# Usability Walkthrough: Activity Rail Release Readiness

## Purpose

Validate that a product user can identify the active pane, pane count,
synchronization state, and active source from the redesigned Crosslog shell
without relying on implementation details or developer tooling.

## Participant Profile

- Role: developer, support engineer, or QA engineer who regularly compares
  application logs.
- Prior Crosslog knowledge: not required.
- Accessibility baseline: participant may use keyboard navigation and system
  zoom, but no screen-reader-specific protocol is required for this walkthrough.

## Setup

1. Build and launch Crosslog from the current branch.
2. Open the deterministic sample workspace with three panes:
   `app.log`, `service.log`, and directory-backed `app-2026-06-16.log`.
3. Leave synchronization enabled.
4. Make `app-2026-06-16.log` the active pane.
5. Use both a desktop-width viewport and a narrow-width viewport where the pane
   workspace scrolls horizontally.

## Tasks

1. Identify the active pane.
2. State how many panes are open.
3. State whether synchronization is on or off.
4. Identify the active source name.
5. Toggle synchronization off and repeat tasks 2-4.
6. Open pane search from the active pane header, then close it.
7. Open the Time Offset popover from the active pane header, then close it.
8. Scroll the pane workspace horizontally and repeat tasks 1-4.

## Pass Criteria

- The participant identifies the active pane within 10 seconds.
- The participant identifies pane count, synchronization state, and active
  source within 10 seconds each.
- The participant does not confuse disabled future rail controls with available
  MVP actions.
- Topbar, activity rail, pane header controls, workspace, and status bar remain
  visible and non-overlapping at both viewport widths.
- Search and Time Offset popovers are reachable by keyboard and expose clear
  names for their inputs and action buttons.

## Failure Criteria

- The participant cannot identify the active pane or active source without
  external help.
- Pane count or synchronization state is hidden, truncated beyond recognition,
  or visually overlaps another primary control.
- Future controls appear actionable for filtering, highlighting, bookmarks,
  saved filters, recursive search, or remote sources.
- Search or Time Offset controls cannot be reached with keyboard navigation.

## Evidence To Record

- Branch and commit SHA.
- OS, display scaling, and viewport size.
- Commands used to build and launch the app.
- Participant role.
- Pass/fail result for each task.
- Notes for any confusion, overlap, truncation, or inaccessible control.
