import { invoke } from "@tauri-apps/api/core";
import {
  createDirectoryFileEntry,
  type DirectoryFileEntry,
  sortDirectoryFileEntries,
} from "@crosslog/core";
import type { DirectoryAccessPort, DirectorySourceRef } from "../ports/directory-access-port";

interface TauriDirectoryFilePayload {
  readonly identity: string;
  readonly name: string;
  readonly createdAtMs: number | null;
  readonly sizeBytes: number;
}

type DirectoryCommandInvoker = (
  command: "list_top_level_directory_files" | "refresh_directory_files",
  args: { readonly path: string },
) => Promise<readonly TauriDirectoryFilePayload[]>;

export class TauriDirectoryAccess implements DirectoryAccessPort {
  constructor(private readonly commandInvoker: DirectoryCommandInvoker = invokeDirectoryCommand) {}

  async listTopLevelFiles(directoryRef: DirectorySourceRef): Promise<readonly DirectoryFileEntry[]> {
    return this.readDirectory("list_top_level_directory_files", directoryRef);
  }

  async refreshDirectory(directoryRef: DirectorySourceRef): Promise<readonly DirectoryFileEntry[]> {
    return this.readDirectory("refresh_directory_files", directoryRef);
  }

  private async readDirectory(
    command: "list_top_level_directory_files" | "refresh_directory_files",
    directoryRef: DirectorySourceRef,
  ): Promise<readonly DirectoryFileEntry[]> {
    const path = directoryRef.path ?? directoryRef.id;
    const payload = await this.commandInvoker(command, { path });
    const files = payload.map((entry) =>
      createDirectoryFileEntry({
        identity: { value: entry.identity, platform: "desktop" },
        name: entry.name,
        createdAt: entry.createdAtMs === null ? null : new Date(entry.createdAtMs),
        fallbackOrderKey: entry.name,
        sizeBytes: entry.sizeBytes,
      }),
    );

    return sortDirectoryFileEntries(files);
  }
}

async function invokeDirectoryCommand(
  command: "list_top_level_directory_files" | "refresh_directory_files",
  args: { readonly path: string },
): Promise<readonly TauriDirectoryFilePayload[]> {
  return invoke<readonly TauriDirectoryFilePayload[]>(command, args);
}
