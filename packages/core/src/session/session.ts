import type { DirectorySourceId } from "../directory/directory-source";
import type { FileSourceId } from "../file-source/file-source";
import type { LogPaneId, SourceId } from "../log-pane/log-pane";
import type { TimeOffset } from "../sync/time-offset";

export const CURRENT_SESSION_SCHEMA_VERSION = 1;

export interface SessionPane {
  readonly id: LogPaneId;
  readonly sourceRef: SourceId | null;
  readonly title: string;
  readonly active: boolean;
  readonly width: number;
  readonly timeOffset: TimeOffset;
}

export interface SessionIdentity {
  readonly value: string;
  readonly platform: "web" | "desktop";
}

export interface SessionFileSource {
  readonly kind: "file";
  readonly id: FileSourceId;
  readonly fileIdentity: SessionIdentity;
  readonly displayName: string;
  readonly pathLabel: string;
  readonly sizeBytes: number;
  readonly encoding: string;
}

export interface SessionDirectoryFileEntry {
  readonly identity: SessionIdentity;
  readonly name: string;
  readonly createdAt: string | null;
  readonly fallbackOrderKey: string;
  readonly sizeBytes: number;
}

export interface SessionDirectorySource {
  readonly kind: "directory";
  readonly id: DirectorySourceId;
  readonly directoryIdentity: SessionIdentity;
  readonly displayName: string;
  readonly files: readonly SessionDirectoryFileEntry[];
  readonly currentFileId: string | null;
}

export type SessionSource = SessionFileSource | SessionDirectorySource;

export interface Session {
  readonly schemaVersion: typeof CURRENT_SESSION_SCHEMA_VERSION;
  readonly panes: readonly SessionPane[];
  readonly paneSizes: Readonly<Record<LogPaneId, number>>;
  readonly sources: readonly SessionSource[];
  readonly directorySelections: Readonly<Record<DirectorySourceId, string>>;
  readonly futureExtensions: Readonly<Record<string, unknown>>;
}
