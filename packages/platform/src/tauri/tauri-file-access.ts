import type { FileAccessPort, FileAccessResult, FileSourceRef } from "../ports/file-access-port";

export class TauriFileAccess implements FileAccessPort {
  async openFileReadOnly(sourceRef: FileSourceRef): Promise<FileAccessResult> {
    return {
      ok: true,
      source: {
        id: sourceRef.id,
        fileIdentity: { value: sourceRef.id, platform: "desktop" },
        displayName: sourceRef.name,
        pathLabel: sourceRef.name,
        sizeBytes: 0,
        encoding: "utf-8",
        lineChunks: [],
        watchState: "stopped",
        deleted: false,
        replaced: false,
        readError: null,
      },
    };
  }

  async decodeFile(): Promise<string> {
    return "";
  }

  async getFileIdentity(sourceRef: FileSourceRef): Promise<string> {
    return sourceRef.id;
  }
}

