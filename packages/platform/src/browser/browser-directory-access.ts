import {
  createDirectoryFileEntry,
  type DirectoryFileEntry,
  sortDirectoryFileEntries,
} from "@crosslog/core";
import type { DirectoryAccessPort, DirectorySourceRef } from "../ports/directory-access-port";

export type BrowserDirectoryEntryDescriptor =
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

export class BrowserDirectoryAccess implements DirectoryAccessPort {
  constructor(
    private readonly directories: ReadonlyMap<string, readonly BrowserDirectoryEntryDescriptor[]> = new Map(),
  ) {}

  async listTopLevelFiles(directoryRef: DirectorySourceRef): Promise<readonly DirectoryFileEntry[]> {
    return this.readDirectoryFiles(directoryRef);
  }

  async refreshDirectory(directoryRef: DirectorySourceRef): Promise<readonly DirectoryFileEntry[]> {
    return this.readDirectoryFiles(directoryRef);
  }

  private readDirectoryFiles(directoryRef: DirectorySourceRef): readonly DirectoryFileEntry[] {
    const descriptors = this.directories.get(directoryRef.id) ?? [];
    const files = descriptors.flatMap((descriptor) => {
      if (descriptor.kind !== "file") {
        return [];
      }

      return [
        createDirectoryFileEntry({
          identity: { value: descriptor.id, platform: "web" },
          name: descriptor.name,
          createdAt: descriptor.createdAt ?? null,
          fallbackOrderKey: descriptor.name,
          sizeBytes: descriptor.sizeBytes ?? 0,
        }),
      ];
    });

    return sortDirectoryFileEntries(files);
  }
}
