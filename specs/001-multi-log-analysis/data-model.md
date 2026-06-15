# Data Model: Crosslog MVP

## Entity: LogPane

Fields:

- `id`: stable pane identifier.
- `sourceRef`: reference to `FileSource` or `DirectorySource`.
- `title`: displayed file or directory label.
- `active`: whether this pane is the active pane.
- `width`: user-adjusted pane width.
- `horizontalScroll`: horizontal text scroll state.
- `searchState`: current per-pane search state.
- `syncState`: participation in synchronization.
- `timeOffset`: per-pane offset in days, hours, minutes, seconds, and
  milliseconds.
- `status`: ready, loading, deleted, error, unsupported, or memory-limited.

Relationships:

- Owns one source reference.
- Owns one search state.
- May be the current `TimeAnchorPane`.

Validation rules:

- Width must remain within minimum readable pane size and available layout
  constraints.
- Status changes must not close the pane automatically.
- Time offset values must be normalized before synchronization.

State transitions:

- `empty -> loading -> ready`
- `ready -> deleted`
- `ready -> error`
- `deleted -> ready` when replacement file is accepted

## Entity: FileSource

Fields:

- `id`: stable source identifier.
- `fileIdentity`: platform-specific file identity, opaque to core logic.
- `displayName`: file name shown to users.
- `pathLabel`: user-visible path or browser-provided name.
- `sizeBytes`: known file size.
- `encoding`: detected or user-selected encoding.
- `lineChunks`: loaded line chunks.
- `watchState`: unsupported, watching, stopped, or failed.
- `deleted`: whether the original file was deleted.
- `replaced`: whether same-name replacement was detected.
- `readError`: latest read/decode error if any.

Relationships:

- Can be selected directly by a `LogPane`.
- Can be the current file inside a `DirectorySource`.

Validation rules:

- Source must pass configured size limit before loading.
- Source must be opened read-only.
- Source content must never be written back.
- Decode failures must be pane-local.

State transitions:

- `candidate -> rejectedBySize`
- `candidate -> rejectedByMemory`
- `candidate -> loading -> loaded`
- `loaded -> deleted`
- `loaded -> replaced -> loading -> loaded`

## Entity: DirectorySource

Fields:

- `id`: stable directory source identifier.
- `directoryIdentity`: platform-specific directory identity.
- `displayName`: directory name.
- `files`: top-level `DirectoryFileEntry` list.
- `ordering`: creation-time-first with file-name fallback.
- `currentFileId`: selected file identity.
- `navigationIndex`: current navigation index.
- `watchState`: unsupported, watching, stopped, or failed.

Relationships:

- Owns many `DirectoryFileEntry` records.
- References the currently selected file as a `FileSource`.

Validation rules:

- Subdirectories must be ignored.
- Current file must not auto-switch when a newer file appears.
- Recreated same-name files must receive a new identity.

State transitions:

- `empty -> indexed`
- `indexed -> refreshed`
- `indexed -> currentDeleted`
- `indexed -> currentReplaced`

## Entity: DirectoryFileEntry

Fields:

- `identity`: opaque platform file identity.
- `name`: file name.
- `createdAt`: creation time when available.
- `fallbackOrderKey`: file name ordering key.
- `sizeBytes`: known size.

Validation rules:

- Entries must represent files only, never subdirectories.
- Ordering must use creation time when available and file name otherwise.

## Entity: NavigationIndex

Fields:

- `orderedFileIds`: ordered file identities.
- `currentFileId`: selected file identity.
- `previousFileId`: optional previous file identity.
- `nextFileId`: optional next file identity.

Validation rules:

- Previous and next must be derived from the same ordered list as current.
- Empty directories must produce no previous or next target.

## Entity: LogLine

Fields:

- `lineNumber`: one-based line number within the loaded source.
- `rawText`: original decoded line text.
- `timestamp`: optional recognized timestamp.
- `timestampSourceRange`: optional source range of matched timestamp text.
- `chunkId`: parent line chunk identifier.

Validation rules:

- Raw text must be treated as inert text.
- Invalid timestamp candidates produce no timestamp.

## Entity: TimestampFormat

Fields:

- `id`: stable format identifier.
- `pattern`: detection pattern.
- `parser`: parser token expression.
- `enabled`: whether this format participates in recognition.

Validation rules:

- Pattern must compile before use.
- Parser must compile before use.
- The first successfully parsed timestamp candidate on a line wins.

## Entity: SearchState

Fields:

- `query`: user-entered query.
- `mode`: text or regex.
- `caseSensitive`: boolean.
- `matches`: match references by line and character range.
- `currentMatchIndex`: active match.
- `error`: invalid regex or search error.

Validation rules:

- Search state is per-pane.
- Invalid regex must not crash the pane or app.
- New loaded lines must update matches for active search.

## Entity: TimeAnchorPane

Fields:

- `paneId`: active pane identifier.
- `anchorTimestamp`: current anchor timestamp when available.
- `source`: scroll, search, or directory navigation.

Validation rules:

- The anchor pane must be the active pane.
- Untimed panes cannot drive synchronization.

## Entity: Session

Fields:

- `schemaVersion`: session schema version.
- `panes`: ordered pane descriptors.
- `paneSizes`: persisted pane sizes.
- `sources`: opened file and directory descriptors.
- `directorySelections`: selected file per directory source.
- `futureExtensions`: reserved versioned extension area.

Validation rules:

- Scroll positions must not be restored.
- Session paths or handles must not be stored beside opened logs.
- Invalid session data must fall back to the last valid snapshot.

State transitions:

- `valid -> writingNextSnapshot -> valid`
- `valid -> corruptNextSnapshot -> recoveredFromLastValid`

## Entity: CapabilityReport

Fields:

- `canOpenFiles`: boolean.
- `canOpenDirectories`: boolean.
- `canWatchFiles`: boolean.
- `canDiscoverNewDirectoryFiles`: boolean.
- `canPersistSession`: boolean.
- `limitations`: user-visible capability limitations.

Validation rules:

- Browser adapters must report unsupported local monitoring capabilities where
  unavailable.
- UI must not present unsupported behavior as available.
