import { open } from "@tauri-apps/plugin-dialog";
import type { DirectorySourceRef } from "../ports/directory-access-port";
import type { FileSourceRef } from "../ports/file-access-port";
import type { SourcePickerPort } from "../ports/source-picker-port";

type DialogSelection = string | readonly string[] | null;
type DialogOpenOptions = {
  readonly directory: boolean;
  readonly multiple: boolean;
};
type DialogOpen = (options: DialogOpenOptions) => Promise<DialogSelection>;

export class TauriSourcePicker implements SourcePickerPort {
  constructor(private readonly openDialog: DialogOpen = open) {}

  async pickFiles(): Promise<readonly FileSourceRef[]> {
    const selection = await this.openDialog({ directory: false, multiple: true });

    return normalizeSelectedPaths(selection).map((path) => ({
      id: createDesktopSourceId("file", path),
      name: getPathBasename(path),
      path,
    }));
  }

  async pickDirectory(): Promise<DirectorySourceRef | null> {
    const selection = await this.openDialog({ directory: true, multiple: false });
    const path = normalizeSelectedPaths(selection)[0];

    if (!path) {
      return null;
    }

    return {
      id: createDesktopSourceId("directory", path),
      name: getPathBasename(path),
      path,
    };
  }
}

function normalizeSelectedPaths(selection: DialogSelection): readonly string[] {
  if (selection === null) {
    return [];
  }

  return (Array.isArray(selection) ? selection : [selection]).filter((path) => path.length > 0);
}

function createDesktopSourceId(kind: "directory" | "file", path: string): string {
  return `desktop-${kind}-${sanitizePathForId(path)}`;
}

function getPathBasename(path: string): string {
  const normalized = path.replace(/[\\/]+$/g, "");
  const segments = normalized.split(/[\\/]+/);

  return segments.at(-1) ?? normalized;
}

function sanitizePathForId(path: string): string {
  const sanitized = path
    .toLowerCase()
    .replace(/^[a-z]:/u, (drive) => drive.slice(0, 1))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return sanitized.length > 0 ? sanitized : "source";
}
