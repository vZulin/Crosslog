import type { DirectorySource } from "../directory/directory-source";
import type { FileSource } from "../file-source/file-source";
import type { LogPane } from "../log-pane/log-pane";
import { createLogPane, createLogPaneState, type LogPaneState } from "../log-pane/log-pane-reducer";
import { CURRENT_SESSION_SCHEMA_VERSION, type Session, type SessionDirectorySource } from "./session";
import { assertValidSessionSnapshot } from "./session-schema";

export interface SessionSnapshotInput {
  readonly panes: readonly LogPane[];
  readonly fileSources: readonly FileSource[];
  readonly directorySources: readonly DirectorySource[];
  readonly synchronizationEnabled: boolean;
}

export function createSessionSnapshot(input: SessionSnapshotInput): Session {
  const sources = [
    ...input.fileSources.map((source) => ({
      kind: "file" as const,
      id: source.id,
      fileIdentity: source.fileIdentity,
      displayName: source.displayName,
      pathLabel: source.pathLabel,
      sizeBytes: source.sizeBytes,
      encoding: source.encoding,
    })),
    ...input.directorySources.map(serializeDirectorySource),
  ];

  const panes = input.panes.map((pane) => ({
    id: pane.id,
    sourceRef: pane.sourceRef,
    title: pane.title,
    active: pane.active,
    width: pane.width,
    timeOffset: pane.timeOffset,
  }));
  const snapshot = {
    schemaVersion: CURRENT_SESSION_SCHEMA_VERSION,
    panes,
    paneSizes: Object.fromEntries(panes.map((pane) => [pane.id, pane.width])),
    sources,
    directorySelections: Object.fromEntries(
      input.directorySources
        .filter((source) => source.currentFileId !== null)
        .map((source) => [source.id, source.currentFileId as string]),
    ),
    synchronizationEnabled: input.synchronizationEnabled,
    futureExtensions: {},
  };

  return assertValidSessionSnapshot(snapshot);
}

export function restoreLogPaneStateFromSession(session: Session): LogPaneState {
  return createLogPaneState(
    session.panes.map((pane) =>
      createLogPane({
        id: pane.id,
        sourceRef: pane.sourceRef,
        title: pane.title,
        active: pane.active,
        width: session.paneSizes[pane.id] ?? pane.width,
        timeOffset: pane.timeOffset,
        horizontalScroll: 0,
        status: pane.sourceRef ? "ready" : "empty",
      }),
    ),
  );
}

function serializeDirectorySource(source: DirectorySource): SessionDirectorySource {
  return {
    kind: "directory",
    id: source.id,
    directoryIdentity: source.directoryIdentity,
    displayName: source.displayName,
    files: source.files.map((entry) => ({
      identity: entry.identity,
      name: entry.name,
      createdAt: entry.createdAt?.toISOString() ?? null,
      fallbackOrderKey: entry.fallbackOrderKey,
      sizeBytes: entry.sizeBytes,
    })),
    currentFileId: source.currentFileId,
  };
}
