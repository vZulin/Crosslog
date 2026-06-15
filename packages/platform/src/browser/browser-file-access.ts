import { evaluateFileOpenPolicy, type FileSource } from "@crosslog/core";
import type { FileAccessPort, FileAccessResult, FileSourceRef } from "../ports/file-access-port";

export class BrowserFileAccess implements FileAccessPort {
  async openFileReadOnly(sourceRef: FileSourceRef, options: Parameters<FileAccessPort["openFileReadOnly"]>[1]): Promise<FileAccessResult> {
    const sizeBytes = 0;
    const policyResult = evaluateFileOpenPolicy(sizeBytes, options);

    if (!policyResult.accepted) {
      return { ok: false, error: policyResult.error };
    }

    const source: FileSource = {
      id: sourceRef.id,
      fileIdentity: { value: sourceRef.id, platform: "web" },
      displayName: sourceRef.name,
      pathLabel: sourceRef.name,
      sizeBytes,
      encoding: "utf-8",
      lineChunks: [],
      watchState: "unsupported",
      deleted: false,
      replaced: false,
      readError: null,
    };

    return { ok: true, source };
  }

  async decodeFile(): Promise<string> {
    return "";
  }

  async getFileIdentity(sourceRef: FileSourceRef): Promise<string> {
    return sourceRef.id;
  }
}

