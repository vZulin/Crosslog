import type { DirectorySourceId } from "../directory/directory-source";
import type { FileSourceId } from "../file-source/file-source";
import type { LogPaneId, SourceId } from "../log-pane/log-pane";

export interface SessionPane {
  readonly id: LogPaneId;
  readonly sourceRef: SourceId | null;
  readonly width: number;
}

export interface Session {
  readonly schemaVersion: 1;
  readonly panes: readonly SessionPane[];
  readonly paneSizes: Readonly<Record<LogPaneId, number>>;
  readonly sources: readonly (FileSourceId | DirectorySourceId)[];
  readonly directorySelections: Readonly<Record<DirectorySourceId, FileSourceId>>;
  readonly futureExtensions: Readonly<Record<string, unknown>>;
}

