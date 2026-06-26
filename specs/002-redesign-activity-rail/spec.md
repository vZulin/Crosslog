# Feature Specification: Crosslog Activity Rail Redesign

**Feature Branch**: `002-redesign-activity-rail`  
**Created**: 2026-06-27  
**Status**: Draft  
**Input**: User description: "Redesign the Crosslog application UI using the prepared Figma frame `Screen / Draft Layout - Activity Rail` as the visual reference. Use `specs/001-multi-log-analysis` as the functional baseline because MVP functional requirements have not changed."

**Design Reference**: `Crosslog Window`, node `11:3`, from the Crosslog Log Viewer UI Design file. The reference frame is authoritative for the MVP workspace composition, control placement, visible states, and interaction affordances unless this specification explicitly limits scope.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Work in the Redesigned Multi-Log Workspace (Priority: P1)

A user opens multiple log sources and analyzes them in a single workspace with a top command area, an activity rail, side-by-side Log Panes, workspace-level horizontal scrolling, and a status bar that summarizes the current analysis state.

**Why this priority**: The redesign exists to make the core multi-log analysis workflow usable. If the new shell does not present multiple logs clearly, the application still fails its primary purpose.

**Independent Test**: Open one file source and two directory sources, verify that all sources appear as separate Log Panes in the redesigned workspace, and confirm that the topbar, activity rail, pane workspace, horizontal workspace scrollbar, and status bar are visible and consistent with the reference design.

**Required UI Test**: A UI test opens multiple sources, verifies the redesigned layout regions, adds and closes panes from the topbar and pane headers, resizes pane boundaries, scrolls the workspace horizontally, and confirms that visible panes preserve their headers, viewport content, and independent horizontal scrolling.

**Acceptance Scenarios**:

1. **Given** no logs are open, **When** the user opens multiple files or directories, **Then** each source is displayed in its own Log Pane within the redesigned Pane Workspace.
2. **Given** at least one pane is open, **When** the user activates the add-pane control in the topbar, **Then** the rightmost pane is split and the new pane receives half of that pane's previous width.
3. **Given** there are multiple panes, **When** the user closes one pane from its pane header, **Then** the freed space is redistributed among the remaining panes and the status bar updates.
4. **Given** panes exceed the available window width, **When** the user scrolls the workspace horizontally, **Then** all panes remain available without collapsing pane content or removing pane controls.

---

### User Story 2 - Synchronize Logs by Time in the New Shell (Priority: P1)

A user keeps Synchronize Scrolling enabled from the topbar, moves within an active Log Pane, and sees other time-aware panes align to the closest line at or before the active timestamp while the status bar identifies the active source.

**Why this priority**: Time synchronization is Crosslog's main productivity gain for distributed-process troubleshooting and must remain obvious in the redesigned UI.

**Independent Test**: Open two timestamped logs, confirm sync is enabled by default, move the active pane to a timestamped line, and verify that other panes synchronize to the correct target line while the active pane and sync state are visible.

**Required UI Test**: A UI test toggles synchronization from the topbar, scrolls and searches within the active pane, verifies synchronized positioning in other panes, then disables synchronization and verifies independent scrolling.

**Acceptance Scenarios**:

1. **Given** synchronization is enabled and multiple panes contain recognized timestamps, **When** the active pane moves to time T, **Then** every other synchronized pane moves to the line with the greatest timestamp less than or equal to T.
2. **Given** one pane has no recognized timestamps, **When** synchronization is triggered from another pane, **Then** the timestamp-free pane is excluded and does not move other panes.
3. **Given** synchronization is disabled from the topbar, **When** the user scrolls any pane, **Then** all panes scroll independently and the status bar reflects the disabled sync state.
4. **Given** a pane has a configured time offset, **When** synchronization is triggered, **Then** the offset is applied before selecting the synchronized target line.

---

### User Story 3 - Search Within a Pane from the Activity Rail or Pane Header (Priority: P2)

A user opens pane search from the activity rail or from a pane header, searches full loaded content in the selected pane, moves through matches, toggles case-sensitive and regular expression matching, and sees the current match count.

**Why this priority**: Search is required for quickly finding relevant events in large or actively changing logs, and the redesigned UI must make search discoverable without turning it into a different feature.

**Independent Test**: Open a log, activate pane search, search for a term outside the current viewport, verify match navigation and result count, then toggle regular expression and case-sensitive modes independently for that pane.

**Required UI Test**: A UI test opens the search popover, performs text search, regular expression search, case-sensitive search, previous and next match navigation, and verifies that search state in one pane does not affect another pane.

**Acceptance Scenarios**:

1. **Given** a log is open, **When** the user searches for plain text from the pane search popover, **Then** matches are found across the full loaded content, not only visible lines.
2. **Given** regular expression mode is enabled, **When** the user enters a valid expression, **Then** matching lines are found according to that expression.
3. **Given** case-sensitive mode is enabled, **When** the user searches, **Then** results respect character case.
4. **Given** new lines are appended to an opened log, **When** the new content contains the active search term, **Then** search results update to include the new matches.

---

### User Story 4 - Navigate Directory Sources from Pane Headers (Priority: P2)

A user opens a directory source, sees the directory title and selected file in the pane header, navigates to previous or next files with header controls, and sees navigation availability update when directory contents change.

**Why this priority**: Distributed systems often rotate logs across files. Directory navigation must remain visible and efficient in the redesigned pane header.

**Independent Test**: Open a directory containing several top-level log files, verify the newest file is selected by default, navigate to previous and next files from the pane header, add a newer file, and verify that the current file remains selected while navigation availability updates.

**Required UI Test**: A UI test opens a directory source, verifies directory and selected-file labels, uses previous and next controls, simulates a new file, deletes the selected file, replaces a file with the same name, and verifies pane behavior and status updates.

**Acceptance Scenarios**:

1. **Given** a directory contains top-level log files, **When** the user opens the directory, **Then** the newest file by creation time is selected and shown under the directory name.
2. **Given** creation time is unavailable, **When** the directory file list is built, **Then** files are ordered by file name.
3. **Given** the selected file is the newest known file, **When** a newer file is added to the directory, **Then** the current file remains selected and the next control becomes available.
4. **Given** a file is removed and later recreated with the same name, **When** the directory is refreshed, **Then** the recreated file is treated as a new file.

---

### User Story 5 - Configure Per-Pane Time Offset (Priority: P2)

A user opens the Time Offset popover from a pane header, adjusts days, hours, minutes, seconds, and milliseconds for that pane, applies the change, and sees the pane's offset tag update without changing other panes.

**Why this priority**: Time offsets are required to compare logs from systems with clock drift or different timestamp baselines.

**Independent Test**: Open two timestamped logs, set a non-zero offset for one pane, verify the offset tag updates, trigger synchronization, and confirm the offset affects only that pane's synchronized target selection.

**Required UI Test**: A UI test opens the offset popover, edits each supported time unit, applies a valid offset, rejects invalid input, closes the popover without unintended changes, and verifies synchronization behavior with the applied offset.

**Acceptance Scenarios**:

1. **Given** a pane is open, **When** the user activates the pane's offset tag, **Then** a Time Offset popover opens for that source.
2. **Given** the Time Offset popover is open, **When** the user enters valid values and applies them, **Then** the pane's offset tag reflects the new offset.
3. **Given** the user enters invalid offset values, **When** the user attempts to apply them, **Then** the previous valid offset remains active and the user is informed.
4. **Given** one pane has an offset, **When** another pane is active, **Then** the first pane's offset does not affect the active pane's timestamp.

---

### User Story 6 - Follow Active Logs and Preserve Context (Priority: P2)

A user keeps logs open while they are still being written, sees live state in pane headers, sees new lines appear automatically, and retains already loaded content if a file is deleted, replaced, unreadable, or corrupted.

**Why this priority**: Live troubleshooting depends on seeing fresh data without losing the analysis context when files rotate or fail.

**Independent Test**: Open a live file, append lines, delete the file, replace it with a new file of the same name, and verify live indicators, loaded content retention, stopped updates for deleted files, replacement handling, and unaffected unrelated panes.

**Required UI Test**: A UI test opens a live file, observes appended lines and live state, handles deletion status, confirms search still works over loaded content, and verifies replacement-file behavior.

**Acceptance Scenarios**:

1. **Given** a file is open and new lines are appended, **When** the application detects the change, **Then** the new lines become visible without reopening the file.
2. **Given** an opened file is deleted, **When** the deletion is detected, **Then** the pane remains open, loaded content remains available, new data collection stops, and the pane displays deleted-file status.
3. **Given** an opened file is replaced by a new file with the same name, **When** the replacement is detected, **Then** the pane treats it as a new file and switches to the replacement content.
4. **Given** one file cannot be read or contains corrupted data, **When** the error occurs, **Then** other Log Panes continue working.

---

### User Story 7 - Restore and Use the Redesigned Experience Across Supported Platforms (Priority: P3)

A user restarts Crosslog after normal shutdown or an unexpected error and recovers the previous redesigned workspace layout on Desktop or the supported browser experience, with platform-specific limitations communicated clearly.

**Why this priority**: Session recovery prevents users from losing long-running analysis setups, and the redesign must not regress platform parity.

**Independent Test**: Open files and directories, reorder and resize panes, select a file inside a directory source, restart the application, and verify that the redesigned layout and supported session fields restore except for scroll positions.

**Required UI Test**: A UI test creates a multi-pane session, restarts the application, verifies restored sources, pane order, pane sizes, selected directory files, shell layout, status bar summary, and verifies that scroll positions start from the default opening position.

**Acceptance Scenarios**:

1. **Given** the user has an active session, **When** the application restarts, **Then** opened panes, pane order, pane sizes, opened files, opened directories, and selected directory files are restored in the redesigned workspace.
2. **Given** the user had scrolled within logs before restart, **When** the session is restored, **Then** scroll positions are not restored.
3. **Given** the user uses the browser version, **When** local filesystem monitoring or automatic new-file discovery is unavailable, **Then** the redesigned UI does not present those unavailable capabilities as active.

### Edge Cases

- A selected file is larger than the configured maximum file size.
- Available memory is insufficient before an open operation completes.
- A file uses UTF-8 with or without byte order mark, UTF-16 little endian, UTF-16 big endian, Windows-1251, or Windows-1252 encoding.
- File encoding cannot be detected automatically.
- A log line contains no timestamp.
- A log line contains multiple timestamp-like values.
- A timestamp-like value cannot be parsed into a valid date and time.
- A Log Pane contains no recognized timestamps while other panes do.
- A user opens an empty directory or a directory with only subdirectories.
- New files appear in an opened directory while the user is not on the newest file.
- A file is deleted after being opened.
- A file is replaced by a new file with the same name.
- One source fails while other Log Panes remain valid.
- The user creates more panes than fit in the visible workspace width.
- A pane title, file name, offset tag, status message, or command label is longer than the available UI space.
- The activity rail contains controls for future features that are not part of the MVP.
- The user activates a command that is unavailable on the current platform.
- The user enters an invalid regular expression.
- The user enters an invalid, incomplete, or out-of-range time offset value.
- Logs contain text that resembles commands, links, terminal escapes, or executable instructions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to open individual log files.
- **FR-002**: Users MUST be able to open log directories.
- **FR-003**: Directory sources MUST include only top-level files and MUST ignore subdirectories.
- **FR-004**: A file source MUST display the file name in its Log Pane header.
- **FR-005**: A directory source MUST display the directory name and the currently selected file name in its Log Pane header.
- **FR-006**: Opened file content MUST be displayed from the first line by default.
- **FR-007**: The application MUST support full-file viewing plus automatic display of newly appended lines; it MUST NOT limit viewing to only the most recent lines.
- **FR-008**: The empty state MUST show a central action for opening files or directories.
- **FR-009**: Users MUST be able to load files and directories through drag and drop where the running platform supports that interaction.
- **FR-010**: The primary MVP workspace MUST follow the referenced Activity Rail layout with a topbar, activity rail, pane workspace, and status bar.
- **FR-011**: The topbar MUST provide a command entry point, a synchronization control, and an add-pane control.
- **FR-012**: The command entry point MUST provide keyboard-accessible access to available MVP actions, including opening sources, focusing pane search, toggling synchronization, adding panes, and opening settings.
- **FR-013**: The command entry point MUST NOT expose or imply non-MVP capabilities such as remote file access, filtering, highlighting, saved filter sets, recursive directory search, or file-manager operations.
- **FR-014**: The activity rail MUST provide access to MVP workspace search, source/file actions, and settings.
- **FR-015**: Activity rail controls for non-MVP future capabilities MUST be disabled, hidden, or clearly marked as unavailable; activating them MUST NOT perform filtering, highlighting, bookmark, saved-filter, or recursive-directory behavior.
- **FR-016**: The status bar MUST summarize pane count, synchronization state, and active source.
- **FR-017**: Users MUST be able to create additional Log Panes.
- **FR-018**: The add-pane control MUST be available from the redesigned topbar.
- **FR-019**: Adding a new Log Pane MUST split the rightmost pane and assign the new pane half of that pane's prior width.
- **FR-020**: Users MUST be able to resize Log Panes by dragging pane boundaries.
- **FR-021**: User-adjusted pane sizes MUST be preserved until the user changes them again or closes panes.
- **FR-022**: Closing a pane MUST redistribute its freed space among remaining panes.
- **FR-023**: Each Log Pane MUST provide independent horizontal scrolling.
- **FR-024**: The number of Log Panes MUST NOT be limited by a fixed application maximum.
- **FR-025**: When panes exceed available width, the pane workspace MUST support horizontal scrolling.
- **FR-026**: Each Log Pane header MUST show the source identity, close action, search action, current time offset, and active/live/status indicators when those states apply.
- **FR-027**: The active Log Pane MUST be visually distinguishable from inactive panes.
- **FR-028**: Log Pane headers MUST keep essential controls usable when source names are long by truncating or otherwise preserving control access without overlapping text.
- **FR-029**: Directory sources MUST select the newest file by creation time when opened.
- **FR-030**: If creation time is unavailable, directory file ordering MUST fall back to file name ordering.
- **FR-031**: Directory sources MUST provide previous-log and next-log navigation from the pane header.
- **FR-032**: Directory navigation controls MUST be disabled when no previous or next file exists in the current ordering.
- **FR-033**: When a new file appears in an opened directory, the file list MUST be recalculated according to the current ordering.
- **FR-034**: A newly appearing directory file MUST NOT automatically replace the user's current file selection.
- **FR-035**: Directory navigation availability MUST update after files are added, deleted, or replaced.
- **FR-036**: A file deleted and recreated with the same name MUST be treated as a new file.
- **FR-037**: Each Log Pane MUST provide independent search.
- **FR-038**: Search MUST operate on the full loaded file content regardless of the current viewport.
- **FR-039**: Search MUST support plain text matching, regular expression matching, and case-sensitive matching.
- **FR-040**: The pane search UI MUST provide a search field, previous-match control, next-match control, regular expression mode, case-sensitive mode, and current/total match count.
- **FR-041**: Search results MUST update when newly appended lines are loaded.
- **FR-042**: Invalid regular expressions MUST be rejected without changing the last valid search results.
- **FR-043**: Timestamp recognition MUST support an externally configurable list of timestamp formats.
- **FR-044**: Each timestamp format MUST define how matching text is detected and how it is parsed.
- **FR-045**: Users MUST be able to provide any number of timestamp formats.
- **FR-046**: Timestamp recognition MUST inspect the full line, not only the beginning of the line.
- **FR-047**: If a line contains multiple timestamp candidates, the first successfully parsed timestamp MUST be used.
- **FR-048**: Invalid timestamp candidates MUST be ignored.
- **FR-049**: Lines without a valid timestamp MUST be treated as untimed lines.
- **FR-050**: Synchronize Scrolling MUST exist in the topbar and MUST be enabled by default.
- **FR-051**: The Time Anchor Pane MUST be the active pane.
- **FR-052**: The active pane MUST change when the user scrolls, searches, or changes files through directory navigation.
- **FR-053**: When the anchor pane moves to time T, every other synchronized pane MUST move to the line with the greatest timestamp less than or equal to T.
- **FR-054**: Panes without recognized timestamps MUST be excluded from synchronization and MUST NOT influence other panes.
- **FR-055**: When synchronization is disabled, all panes MUST scroll independently.
- **FR-056**: Each Log Pane MUST support its own time offset.
- **FR-057**: Time offsets MUST support days, hours, minutes, seconds, and milliseconds.
- **FR-058**: Time offsets MUST be displayed in each pane header.
- **FR-059**: Activating a pane's time offset display MUST open a Time Offset editor for that pane.
- **FR-060**: Applying a valid time offset MUST update only the selected pane.
- **FR-061**: Invalid time offset input MUST be rejected without replacing the previous valid offset.
- **FR-062**: Time offsets MUST be applied during synchronization.
- **FR-063**: If an opened file is deleted, its Log Pane MUST remain open, keep loaded content available, stop receiving new data, keep search available over loaded content, and display deleted-file status.
- **FR-064**: If an opened file is replaced by a new file with the same name, the pane MUST treat it as a new file and switch to the replacement file.
- **FR-065**: Live file status MUST be visible in the pane header when a source is actively receiving appended content.
- **FR-066**: Log content MUST be presented with stable line numbers, recognized timestamp text, recognized severity text when available, and raw message text.
- **FR-067**: Static visual emphasis for recognized severity values MUST NOT modify raw log content and MUST NOT introduce user-configurable highlighting in the MVP.
- **FR-068**: Users MUST be able to select and copy text with keyboard shortcuts and a context menu.
- **FR-069**: Session restore MUST preserve opened panes, pane order, pane sizes, opened files, opened directories, selected file inside each directory source, synchronization state, and per-pane time offsets.
- **FR-070**: Session restore MUST restore the redesigned shell layout around the restored panes.
- **FR-071**: Session restore MUST NOT restore scroll positions.
- **FR-072**: The application MUST automatically detect UTF-8, UTF-8 with byte order mark, UTF-16 little endian, UTF-16 big endian, Windows-1251, and Windows-1252 encodings.
- **FR-073**: If encoding cannot be detected, the user MUST be able to choose an encoding manually.
- **FR-074**: Before opening a file, the application MUST check the file size against a user-configurable maximum.
- **FR-075**: The default maximum file size MUST be 20 MB.
- **FR-076**: If a file exceeds the configured maximum, the user MUST see an error and the file MUST NOT be opened.
- **FR-077**: If available memory is insufficient, the open operation MUST stop before loading content and the user MUST be informed.
- **FR-078**: A corrupted log file MUST NOT crash the application.
- **FR-079**: A read error in one source MUST NOT affect other Log Panes.
- **FR-080**: The Desktop version MUST support local files, local directories, file-change monitoring, and automatic display of newly appended lines on Windows, macOS, and Linux.
- **FR-081**: The browser version MUST support file loading, directory loading where permitted by the browser, and drag-and-drop loading.
- **FR-082**: The browser version MUST clearly avoid promising local filesystem monitoring, automatic local new-file discovery, or remote access when those capabilities are unavailable.
- **FR-083**: The MVP MUST exclude remote file access, file-manager features, filtering, user-configurable highlighting, saved filter sets, bookmarks, and recursive directory search.
- **FR-084**: The product design MUST leave extension points for future remote sources, filtering, highlighting, saved filter sets, bookmarks, and recursive directory search without adding those capabilities to the MVP.
- **FR-085**: If a directory contains no top-level files, including directories that contain only subdirectories, the Log Pane MUST remain open, show an empty-directory status, and disable previous-log and next-log navigation.
- **FR-086**: Platform-specific window controls MAY adapt to the running platform, but the topbar, activity rail, pane workspace, and status bar structure MUST remain consistent.
- **FR-087**: The redesigned UI MUST remain usable when labels are localized or when file paths contain long names by preventing text overlap and preserving access to primary controls.

### Constitution Requirements *(mandatory)*

- **CR-001**: Opened log files MUST be treated as read-only input.
- **CR-002**: Log content MUST be rendered and processed as inert data; commands, scripts, links, escape sequences, and instructions found in logs MUST NOT be executed.
- **CR-003**: Web and Desktop behavior MUST reuse the same product rules and produce consistent results unless a documented platform constraint requires different behavior.
- **CR-004**: Session state MUST be recoverable after unexpected errors without deleting the last known usable session.
- **CR-005**: Performance expectations for affected parsing, indexing, search, rendering, file watching, and session behavior MUST be measurable.
- **CR-006**: Each user scenario MUST have a UI test, and OS-specific Desktop behavior MUST be tested on the corresponding target OS.

### Key Entities

- **Application Shell**: The top-level user experience containing the topbar, activity rail, pane workspace, and status bar.
- **Topbar**: The command and global action area containing the command entry point, synchronization control, and add-pane control.
- **Activity Rail**: A vertical navigation area that exposes MVP workspace actions and visible extension points for future capabilities.
- **Pane Workspace**: The scrollable area that contains Log Panes, pane boundaries, and workspace-level horizontal navigation.
- **Log Pane**: An independent log viewing area with a source, header, content viewport, search state, synchronization state, time offset, and status.
- **Pane Header**: The per-pane control area containing source identity, close action, search action, directory navigation when applicable, live/status indicators, and time offset display.
- **File Source**: A Log Pane source backed by one opened file, including file identity, display name, encoding, loaded content, file size status, deletion status, replacement status, and live update status.
- **Directory Source**: A Log Pane source backed by a directory, including the top-level file list, ordering strategy, current file, previous and next navigation state, and refresh state.
- **Log Line**: A line of loaded text with raw content, optional recognized timestamp, optional recognized severity, and derived display state.
- **Timestamp Format**: A user-configurable rule for detecting and parsing timestamps in log lines.
- **Time Anchor Pane**: The active Log Pane used as the source for synchronized time navigation.
- **Time Offset**: A per-pane adjustment in days, hours, minutes, seconds, and milliseconds applied during time synchronization.
- **Search State**: Per-pane search text, matching mode, case sensitivity, result list, current match, and result count.
- **Session**: The recoverable analysis state containing shell layout, pane order, pane sizes, opened sources, selected directory files, synchronization state, per-pane time offsets, and future feature state where applicable.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can open three log sources and view them side by side in the redesigned workspace in under 30 seconds from a fresh application start.
- **SC-002**: In usability walkthroughs, at least 90% of participants can identify the active pane, pane count, synchronization state, and active source from the redesigned UI within 10 seconds.
- **SC-003**: Users can open pane search, run a query, move to the next result, and identify the current/total result count in no more than 4 user actions after selecting a pane.
- **SC-004**: Users can open the Time Offset editor for a pane, apply a valid offset, and verify the updated pane offset in no more than 6 user actions.
- **SC-005**: Opening a 20 MB log file completes in no more than 1 second under the reference test conditions defined during planning.
- **SC-006**: Searching a 20 MB loaded log completes in no more than 1 second under the reference test conditions defined during planning.
- **SC-007**: Switching between files in an opened directory completes in no more than 200 milliseconds under the reference test conditions defined during planning.
- **SC-008**: In a test set with overlapping timestamps, synchronized panes move to the correct line for at least 99% of sampled anchor movements.
- **SC-009**: In a live-update test, newly appended lines become visible without reopening the source in at least 99% of append events.
- **SC-010**: A session with at least five panes restores all supported session fields and the redesigned shell layout after restart in 100% of automated restore tests.
- **SC-011**: Deleting or corrupting one opened source does not close unrelated panes in 100% of automated reliability tests.
- **SC-012**: The application never modifies opened log file bytes in automated read-only safety tests.
- **SC-013**: Every MVP user scenario has at least one passing UI test on every supported target where the scenario is available.
- **SC-014**: Automated UI checks across supported desktop and browser view sizes show no overlapping primary controls, unreadable pane headers, or inaccessible pane actions.

## Assumptions

- The referenced Activity Rail frame is authoritative for MVP workspace composition and interaction affordances, while `specs/001-multi-log-analysis` remains authoritative for product functionality.
- The primary users remain developers, QA engineers, support engineers, and operators who analyze logs from distributed or multi-process systems.
- The MVP analyzes local files and directories only; remote access is reserved for future versions.
- Directory scanning is limited to top-level files for the MVP.
- File creation time is the default directory ordering signal; file name ordering is the fallback when creation time is unavailable.
- Browser environments may restrict directory access and local file monitoring; the browser version exposes only capabilities available in the user's browser.
- Scroll positions are intentionally not restored because restored file content may differ from the previous session after live updates or rotation.
- Future filtering, highlighting, saved filter sets, bookmarks, recursive directory search, and remote source state may become part of the session model, but those capabilities are not MVP features.
- Platform-specific window controls may differ from the reference frame where the operating system requires different conventions.
