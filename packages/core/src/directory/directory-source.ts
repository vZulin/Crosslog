import type { DirectoryFileEntry } from "./directory-file-entry";
import type { NavigationIndex } from "./navigation-index";

export type DirectorySourceId = string;

export interface DirectoryIdentity {
  readonly value: string;
  readonly platform: "web" | "desktop";
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
