import type { DirectoryFileEntry } from "@crosslog/core";

export interface DirectorySourceRef {
  readonly id: string;
  readonly name: string;
  readonly path?: string;
}

export interface DirectoryAccessPort {
  listTopLevelFiles(directoryRef: DirectorySourceRef): Promise<readonly DirectoryFileEntry[]>;
  refreshDirectory(directoryRef: DirectorySourceRef): Promise<readonly DirectoryFileEntry[]>;
}
