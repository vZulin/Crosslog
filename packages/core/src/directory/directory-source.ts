import type { FileIdentity } from "../file-source/file-source";

export type DirectorySourceId = string;

export interface DirectoryIdentity {
  readonly value: string;
  readonly platform: "web" | "desktop";
}

export interface DirectoryFileEntry {
  readonly identity: FileIdentity;
  readonly name: string;
  readonly createdAt: Date | null;
  readonly fallbackOrderKey: string;
  readonly sizeBytes: number;
}

export interface NavigationIndex {
  readonly orderedFileIds: readonly string[];
  readonly currentFileId: string | null;
  readonly previousFileId: string | null;
  readonly nextFileId: string | null;
}

export interface DirectorySource {
  readonly id: DirectorySourceId;
  readonly directoryIdentity: DirectoryIdentity;
  readonly displayName: string;
  readonly files: readonly DirectoryFileEntry[];
  readonly currentFileId: string | null;
  readonly navigationIndex: NavigationIndex;
  readonly watchState: "unsupported" | "watching" | "stopped" | "failed";
}

