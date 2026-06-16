import type { DirectoryFileEntry } from "@crosslog/core";

export type DirectoryEntryDescriptor =
  | {
      readonly kind: "file";
      readonly id: string;
      readonly name: string;
      readonly createdAt?: Date | null;
      readonly sizeBytes?: number;
    }
  | {
      readonly kind: "directory";
      readonly id: string;
      readonly name: string;
    };

export interface DirectorySourceRef {
  readonly id: string;
  readonly name: string;
  readonly path?: string;
  readonly entries?: readonly DirectoryEntryDescriptor[];
}

export interface DirectoryAccessPort {
  listTopLevelFiles(directoryRef: DirectorySourceRef): Promise<readonly DirectoryFileEntry[]>;
  refreshDirectory(directoryRef: DirectorySourceRef): Promise<readonly DirectoryFileEntry[]>;
}
