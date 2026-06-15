# Contract: Platform Ports

These contracts define the boundary between shared Crosslog business logic and
platform-specific Web/Desktop behavior.

## FileAccessPort

Responsibilities:

- Open files in read-only mode.
- Return file identity, display name, size, encoding information, and decoded
  line chunks.
- Reject files above the configured size limit before content loading.
- Stop before loading when memory policy rejects the operation.
- Never write to opened log files.

Required behaviors:

- `openFileReadOnly(sourceRef, options)` returns loaded content or a typed
  failure.
- `decodeFile(sourceRef, encodingChoice)` returns decoded text chunks or a typed
  decode failure.
- `getFileIdentity(sourceRef)` returns an opaque identity stable enough for
  delete/recreate detection on the current platform.

Typed failures:

- `FileTooLarge`
- `InsufficientMemory`
- `FileNotFound`
- `PermissionDenied`
- `DecodeFailed`
- `UnsupportedCapability`
- `UnknownReadError`

## DirectoryAccessPort

Responsibilities:

- Open a directory source.
- List only top-level files.
- Ignore subdirectories.
- Provide creation time when available.
- Provide file-name fallback ordering data.

Required behaviors:

- `listTopLevelFiles(directoryRef)` returns file entries only.
- `refreshDirectory(directoryRef)` returns a refreshed file list with identities.
- Recreated same-name files must receive a different identity when the platform
  can distinguish them.

## FileWatcherPort

Responsibilities:

- Report file append, delete, replace, and watch failure events.
- Report directory file additions, removals, and replacement events.
- Report unsupported watch capability in browser environments where applicable.

Required event types:

- `FileAppended`
- `FileDeleted`
- `FileReplaced`
- `DirectoryEntryAdded`
- `DirectoryEntryRemoved`
- `DirectoryEntryReplaced`
- `WatcherUnsupported`
- `WatcherError`

## SessionStorePort

Responsibilities:

- Persist validated session snapshots outside opened log paths.
- Recover the last valid session after unexpected errors.
- Reject invalid or future-incompatible sessions safely.

Required behaviors:

- `loadLastValidSession()` returns a valid session or no session.
- `writeSessionSnapshot(session)` writes with validate-then-commit semantics.
- `recoverSession()` prefers the last valid snapshot over corrupt pending data.

## CapabilityPort

Responsibilities:

- Tell UI which source, watch, directory, and persistence features are available.
- Prevent UI from promising unavailable behavior.

Required behaviors:

- `getCapabilities()` returns the current platform capability report.
- Unsupported capabilities must include user-visible limitation text.
