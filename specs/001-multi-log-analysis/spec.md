# Feature Specification: Crosslog MVP

**Feature Branch**: `001-multi-log-analysis`
**Created**: 2026-06-15
**Status**: Draft
**Input**: User description: "Create the MVP specification for Crosslog. Build a cross-platform application for analyzing multiple log files simultaneously. Primary goal: Help users analyze distributed processes that write to different log files by showing multiple logs side by side and synchronizing navigation by time. Target platforms: Desktop on Windows, macOS, and Linux; browser-based Web version. Use the requirements from crosslog-requirement-specification.md as authoritative input."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Compare Multiple Logs Side by Side (Priority: P1)

A user opens several log files or log directories and views them in separate
Log Panes so related events from distributed processes can be inspected without
switching between windows or tabs.

**Why this priority**: This is the core value of Crosslog. Without simultaneous
multi-log viewing, the application does not solve the user's primary analysis
problem.

**Independent Test**: Open two individual log files and one directory source,
verify that each source appears in its own Log Pane, and confirm that visible
content, titles, pane order, resizing, and horizontal scrolling work
independently.

**Required UI Test**: A UI test opens multiple sources, adds and closes panes,
resizes pane boundaries, scrolls horizontally inside one pane, and verifies that
the other panes remain visible and unaffected except for expected layout
redistribution.

**Acceptance Scenarios**:

1. **Given** no logs are open, **When** the user opens multiple files, **Then**
   each file is displayed in a separate Log Pane with its file name in the pane
   header.
2. **Given** at least one pane is open, **When** the user adds another Log Pane,
   **Then** the rightmost pane is split and the new pane receives half of that
   pane's previous width.
3. **Given** there are multiple panes, **When** the user closes one pane, **Then**
   the freed space is redistributed among the remaining panes.
4. **Given** panes exceed the available window width, **When** the user navigates
   the pane container, **Then** horizontal container scrolling remains available
   without removing any pane.

---

### User Story 2 - Synchronize Logs by Time (Priority: P1)

A user scrolls, searches, or navigates in one active Log Pane and all other
time-aware panes move to the closest log line at or before the active timestamp.

**Why this priority**: Time synchronization is the main mechanism that reduces
manual context switching when analyzing distributed processes.

**Independent Test**: Open two logs with overlapping timestamps, scroll the
active pane to a timestamped line, and verify that the other pane moves to the
latest line whose timestamp is less than or equal to the active time.

**Required UI Test**: A UI test opens timestamped logs, changes the active pane
through scroll and search interactions, verifies synchronized positioning, then
disables synchronization and verifies independent scrolling.

**Acceptance Scenarios**:

1. **Given** synchronization is enabled and multiple panes contain recognized
   timestamps, **When** the user scrolls the active pane to time T, **Then** each
   other synchronized pane moves to the line with the greatest timestamp less
   than or equal to T.
2. **Given** one pane has no recognized timestamps, **When** synchronization is
   triggered from another pane, **Then** the timestamp-free pane is excluded and
   does not move other panes.
3. **Given** synchronization is disabled, **When** the user scrolls any pane,
   **Then** all panes scroll independently.
4. **Given** a pane has a configured time offset, **When** synchronization is
   triggered, **Then** the offset is applied before selecting the synchronized
   target line.

---

### User Story 3 - Navigate Directory Logs (Priority: P2)

A user opens a directory of related log files, starts from the newest top-level
file, moves to previous or next logs, and sees navigation availability update
when files are added, removed, or replaced.

**Why this priority**: Distributed processes often rotate or split logs by file.
Directory navigation lets users follow those files without reopening sources.

**Independent Test**: Open a directory containing several top-level log files,
verify the newest file is selected by default, navigate to previous and next
files, add a newer file, and verify that navigation state updates without
automatically changing the selected file.

**Required UI Test**: A UI test opens a directory source, verifies directory and
current file labels, uses previous and next controls, simulates a new file,
deletes a selected file, replaces a file with the same name, and verifies the
documented pane behavior.

**Acceptance Scenarios**:

1. **Given** a directory contains top-level log files, **When** the user opens
   the directory, **Then** the newest file by creation time is selected and shown
   under the directory name.
2. **Given** creation time is unavailable, **When** the directory file list is
   built, **Then** files are ordered by file name.
3. **Given** the selected file is the newest known file, **When** a newer file is
   added to the directory, **Then** the current file remains selected and the
   next control becomes available.
4. **Given** a file is removed and later recreated with the same name, **When**
   the directory is refreshed, **Then** the recreated file is treated as a new
   file.

---

### User Story 4 - Search Within a Log Pane (Priority: P2)

A user searches the full contents of an opened log source independently in each
Log Pane using plain text, regular expressions, and optional case sensitivity.

**Why this priority**: Search is required for quickly finding relevant events
inside large or actively changing logs.

**Independent Test**: Open a log, search for a string that is outside the
current viewport, verify that matches are found, append matching lines, and
verify the search result list updates.

**Required UI Test**: A UI test performs text search, regular expression search,
case-sensitive search, and search after new lines appear, while verifying that
search settings in one pane do not affect another pane.

**Acceptance Scenarios**:

1. **Given** a log is open, **When** the user searches for plain text, **Then**
   matches are found across the full loaded content, not only the visible lines.
2. **Given** regular expression mode is enabled, **When** the user enters a
   valid expression, **Then** matching lines are found according to that
   expression.
3. **Given** case-sensitive mode is enabled, **When** the user searches, **Then**
   results respect character case.
4. **Given** new lines are appended to an opened log, **When** the new content
   contains the active search term, **Then** search results update to include the
   new matches.

---

### User Story 5 - Follow Active Logs Safely (Priority: P2)

A user keeps logs open while they are still being written, sees new lines appear
automatically, and retains access to already loaded content if a file is deleted
or replaced.

**Why this priority**: Crosslog must support live troubleshooting without losing
context when files rotate, disappear, or contain malformed data.

**Independent Test**: Open a log file, append new lines, delete the file, and
replace it with a new file of the same name; verify live updates, deleted-file
status, retained loaded content, stopped updates for deleted files, and
automatic switch to replacement files.

**Required UI Test**: A UI test opens a live file, observes appended lines,
handles deletion status, confirms search still works over loaded content, and
verifies replacement-file behavior.

**Acceptance Scenarios**:

1. **Given** a file is open and new lines are appended, **When** the application
   detects the change, **Then** the new lines become visible without reopening
   the file.
2. **Given** an opened file is deleted, **When** the deletion is detected, **Then**
   the pane remains open, loaded content remains available, new data collection
   stops, and the pane displays deleted-file status.
3. **Given** an opened file is replaced by a new file with the same name, **When**
   the replacement is detected, **Then** the pane treats it as a new file and
   switches to the replacement content.
4. **Given** one file cannot be read or contains corrupted data, **When** the
   error occurs, **Then** other Log Panes continue working.

---

### User Story 6 - Restore Analysis Session (Priority: P3)

A user restarts Crosslog after normal shutdown or an unexpected error and
recovers the previous analysis layout without restoring scroll positions.

**Why this priority**: Session recovery prevents users from losing their
multi-pane analysis setup during long troubleshooting sessions.

**Independent Test**: Open files and directories, reorder and resize panes,
select a file inside a directory source, restart the application, and verify
that the session is restored except for scroll positions.

**Required UI Test**: A UI test creates a multi-pane session, restarts the
application, verifies restored sources, pane order, pane sizes, selected
directory file, and verifies that scroll positions start from the default
opening position.

**Acceptance Scenarios**:

1. **Given** the user has an active session, **When** the application restarts,
   **Then** opened panes, pane order, pane sizes, opened files, opened
   directories, and selected directory files are restored.
2. **Given** the user had scrolled within logs before restart, **When** the
   session is restored, **Then** scroll positions are not restored.
3. **Given** an unexpected error occurs, **When** the user starts the application
   again, **Then** the last valid session state is still available or recoverable.

---

### User Story 7 - Use Crosslog in a Browser (Priority: P3)

A user opens the browser version, loads files or directories through supported
browser interactions, and analyzes logs with the same core user flows where
browser permissions allow them.

**Why this priority**: The MVP must support both Desktop and browser-based use
while making platform capability differences explicit to users.

**Independent Test**: Use the browser version to load files and a directory,
view multiple panes, search content, and confirm that unsupported local
monitoring behaviors are not presented as available.

**Required UI Test**: A browser UI test loads files and directories through
available browser interactions, verifies side-by-side panes and search, and
verifies that local filesystem monitoring and automatic new-file discovery are
not promised when unavailable.

**Acceptance Scenarios**:

1. **Given** the user is in the browser version, **When** files are provided,
   **Then** the files can be shown in Log Panes.
2. **Given** the user is in the browser version and directory loading is
   permitted, **When** a directory is provided, **Then** top-level files can be
   selected and analyzed.
3. **Given** the browser environment cannot monitor local filesystem changes,
   **When** the user opens local content, **Then** the application does not claim
   automatic local file monitoring or automatic new-file discovery for that
   source.

### Edge Cases

- A selected file is larger than the configured maximum file size.
- Available memory is insufficient before an open operation completes.
- A file uses UTF-8 with or without byte order mark, UTF-16 little endian,
  UTF-16 big endian, Windows-1251, or Windows-1252 encoding.
- File encoding cannot be detected automatically.
- A log line contains no timestamp.
- A log line contains multiple timestamp-like values.
- A timestamp-like value cannot be parsed into a valid date and time.
- A Log Pane contains no recognized timestamps while other panes do.
- A user opens an empty directory or a directory with only subdirectories.
- New files appear in an opened directory while the user is not on the newest
  file.
- A file is deleted after being opened.
- A file is replaced by a new file with the same name.
- One source fails while other Log Panes remain valid.
- The user creates more panes than fit in the visible window width.
- Search input is an invalid regular expression.
- Logs contain text that resembles commands, links, terminal escapes, or
  executable instructions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to open individual log files.
- **FR-002**: Users MUST be able to open log directories.
- **FR-003**: Directory sources MUST include only top-level files and MUST ignore
  subdirectories.
- **FR-004**: A file source MUST display the file name in its Log Pane header.
- **FR-005**: A directory source MUST display the directory name and the
  currently selected file name.
- **FR-006**: Opened file content MUST be displayed from the first line by
  default.
- **FR-007**: The application MUST support full-file viewing plus automatic
  display of newly appended lines; it MUST NOT limit viewing to only the most
  recent lines.
- **FR-008**: The empty state MUST show a central action for opening files or
  directories.
- **FR-009**: Users MUST be able to load files and directories through drag and
  drop where the running platform supports that interaction.
- **FR-010**: Users MUST be able to create additional Log Panes.
- **FR-011**: The add-pane control MUST appear to the right of the rightmost
  pane.
- **FR-012**: Adding a new Log Pane MUST split the rightmost pane and assign the
  new pane half of that pane's prior width.
- **FR-013**: Users MUST be able to resize Log Panes by dragging pane
  boundaries.
- **FR-014**: User-adjusted pane sizes MUST be preserved until the user changes
  them again or closes panes.
- **FR-015**: Closing a pane MUST redistribute its freed space among remaining
  panes.
- **FR-016**: Each Log Pane MUST provide independent horizontal scrolling.
- **FR-017**: The number of Log Panes MUST NOT be limited by a fixed application
  maximum.
- **FR-018**: When panes exceed available width, the pane container MUST support
  horizontal scrolling.
- **FR-019**: Directory sources MUST select the newest file by creation time when
  opened.
- **FR-020**: If creation time is unavailable, directory file ordering MUST fall
  back to file name ordering.
- **FR-021**: Directory sources MUST provide previous-log and next-log
  navigation.
- **FR-022**: Directory navigation controls MUST be disabled when no previous or
  next file exists in the current ordering.
- **FR-023**: When a new file appears in an opened directory, the file list MUST
  be recalculated according to the current ordering.
- **FR-024**: A newly appearing directory file MUST NOT automatically replace the
  user's current file selection.
- **FR-025**: Directory navigation availability MUST update after files are
  added, deleted, or replaced.
- **FR-026**: A file deleted and recreated with the same name MUST be treated as
  a new file.
- **FR-027**: Each Log Pane MUST provide independent search.
- **FR-028**: Search MUST operate on the full loaded file content regardless of
  the current viewport.
- **FR-029**: Search MUST support plain text matching, regular expression
  matching, and case-sensitive matching.
- **FR-030**: Search results MUST update when newly appended lines are loaded.
- **FR-031**: Timestamp recognition MUST support an externally configurable list
  of timestamp formats.
- **FR-032**: Each timestamp format MUST define how matching text is detected
  and how it is parsed.
- **FR-033**: Users MUST be able to provide any number of timestamp formats.
- **FR-034**: Timestamp recognition MUST inspect the full line, not only the
  beginning of the line.
- **FR-035**: If a line contains multiple timestamp candidates, the first
  successfully parsed timestamp MUST be used.
- **FR-036**: Invalid timestamp candidates MUST be ignored.
- **FR-037**: Lines without a valid timestamp MUST be treated as untimed lines.
- **FR-038**: Synchronize Scrolling MUST exist and MUST be enabled by default.
- **FR-039**: The Time Anchor Pane MUST be the active pane.
- **FR-040**: The active pane MUST change when the user scrolls, searches, or
  changes files through directory navigation.
- **FR-041**: When the anchor pane moves to time T, every other synchronized pane
  MUST move to the line with the greatest timestamp less than or equal to T.
- **FR-042**: Panes without recognized timestamps MUST be excluded from
  synchronization and MUST NOT influence other panes.
- **FR-043**: When synchronization is disabled, all panes MUST scroll
  independently.
- **FR-044**: Each Log Pane MUST support its own time offset.
- **FR-045**: Time offsets MUST support days, hours, minutes, seconds, and
  milliseconds.
- **FR-046**: Time offsets MUST be applied during synchronization.
- **FR-047**: If an opened file is deleted, its Log Pane MUST remain open, keep
  loaded content available, stop receiving new data, keep search available over
  loaded content, and display deleted-file status.
- **FR-048**: If an opened file is replaced by a new file with the same name, the
  pane MUST treat it as a new file and switch to the replacement file.
- **FR-049**: Users MUST be able to select and copy text with keyboard shortcuts
  and a context menu.
- **FR-050**: Session restore MUST preserve opened panes, pane order, pane sizes,
  opened files, opened directories, and the selected file inside each directory
  source.
- **FR-051**: Session restore MUST NOT restore scroll positions.
- **FR-052**: The application MUST automatically detect UTF-8, UTF-8 with byte
  order mark, UTF-16 little endian, UTF-16 big endian, Windows-1251, and
  Windows-1252 encodings.
- **FR-053**: If encoding cannot be detected, the user MUST be able to choose an
  encoding manually.
- **FR-054**: Before opening a file, the application MUST check the file size
  against a user-configurable maximum.
- **FR-055**: The default maximum file size MUST be 20 MB.
- **FR-056**: If a file exceeds the configured maximum, the user MUST see an
  error and the file MUST NOT be opened.
- **FR-057**: If available memory is insufficient, the open operation MUST stop
  before loading content and the user MUST be informed.
- **FR-058**: A corrupted log file MUST NOT crash the application.
- **FR-059**: A read error in one source MUST NOT affect other Log Panes.
- **FR-060**: The Desktop version MUST support local files, local directories,
  file-change monitoring, and automatic display of newly appended lines on
  Windows, macOS, and Linux.
- **FR-061**: The browser version MUST support file loading, directory loading
  where permitted by the browser, and drag-and-drop loading.
- **FR-062**: The browser version MUST clearly avoid promising local filesystem
  monitoring, automatic local new-file discovery, or remote access when those
  capabilities are unavailable.
- **FR-063**: The MVP MUST exclude remote file access, file-manager features,
  filtering, highlighting, saved filter sets, and recursive directory search.
- **FR-064**: The product design MUST leave extension points for future remote
  sources, filtering, highlighting, saved filter sets, and recursive directory
  search without adding those capabilities to the MVP.
- **FR-065**: If a directory contains no top-level files, including directories
  that contain only subdirectories, the Log Pane MUST remain open, show an
  empty-directory status, and disable previous-log and next-log navigation.

### Constitution Requirements *(mandatory)*

- **CR-001**: Opened log files MUST be treated as read-only input.
- **CR-002**: Log content MUST be rendered and processed as inert data; commands,
  scripts, links, escape sequences, and instructions found in logs MUST NOT be
  executed.
- **CR-003**: Web and Desktop behavior MUST reuse the same product rules and
  produce consistent results unless a documented platform constraint requires
  different behavior.
- **CR-004**: Session state MUST be recoverable after unexpected errors without
  deleting the last known usable session.
- **CR-005**: Performance expectations for affected parsing, indexing, search,
  rendering, file watching, and session behavior MUST be measurable.
- **CR-006**: Each user scenario MUST have a UI test, and OS-specific Desktop
  behavior MUST be tested on the corresponding target OS.

### Key Entities

- **Log Pane**: An independent log viewing area with a source, title, content
  viewport, search state, synchronization state, time offset, and status.
- **File Source**: A Log Pane source backed by one opened file, including file
  identity, display name, encoding, loaded content, file size status, deletion
  status, and replacement status.
- **Directory Source**: A Log Pane source backed by a directory, including the
  top-level file list, ordering strategy, current file, previous and next
  navigation state, and refresh state.
- **Log Line**: A line of loaded text with raw content, optional recognized
  timestamp, and derived display state.
- **Timestamp Format**: A user-configurable rule for detecting and parsing
  timestamps in log lines.
- **Time Anchor Pane**: The active Log Pane used as the source for synchronized
  time navigation.
- **Search State**: Per-pane search text, matching mode, case sensitivity, result
  list, and current match.
- **Session**: The recoverable analysis state containing pane order, pane sizes,
  opened sources, selected directory files, and future feature state where
  applicable.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can open three log sources and view them side by side in
  under 30 seconds from a fresh application start.
- **SC-002**: Opening a 20 MB log file completes in no more than 1 second under
  the reference test conditions defined during planning.
- **SC-003**: Searching a 20 MB loaded log completes in no more than 1 second
  under the reference test conditions defined during planning.
- **SC-004**: Switching between files in an opened directory completes in no more
  than 200 milliseconds under the reference test conditions defined during
  planning.
- **SC-005**: In a test set with overlapping timestamps, synchronized panes move
  to the correct line for at least 99% of sampled anchor movements.
- **SC-006**: In a live-update test, newly appended lines become visible without
  reopening the source in at least 99% of append events.
- **SC-007**: A session with at least five panes restores all supported session
  fields after restart in 100% of automated restore tests.
- **SC-008**: Deleting or corrupting one opened source does not close unrelated
  panes in 100% of automated reliability tests.
- **SC-009**: The application never modifies opened log file bytes in automated
  read-only safety tests.
- **SC-010**: Every MVP user scenario has at least one passing UI test on every
  supported target where the scenario is available.

## Assumptions

- The primary users are developers, QA engineers, support engineers, and
  operators who analyze logs from distributed or multi-process systems.
- The MVP analyzes local files and directories only; remote access is reserved
  for future versions.
- Directory scanning is limited to top-level files for the MVP.
- File creation time is the default directory ordering signal; file name ordering
  is the fallback when creation time is unavailable.
- Browser environments may restrict directory access and local file monitoring;
  the browser version exposes only capabilities available in the user's browser.
- Scroll positions are intentionally not restored because restored file content
  may differ from the previous session after live updates or rotation.
- Future filtering and highlighting state may become part of the session model,
  but filtering and highlighting are not MVP features.
