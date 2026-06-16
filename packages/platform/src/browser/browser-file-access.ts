import { appendRawLinesToChunks, evaluateFileOpenPolicy, type FileSource } from "@crosslog/core";
import type { FileAccessPort, FileAccessResult, FileSourceRef } from "../ports/file-access-port";

export class BrowserFileAccess implements FileAccessPort {
  async openFileReadOnly(sourceRef: FileSourceRef, options: Parameters<FileAccessPort["openFileReadOnly"]>[1]): Promise<FileAccessResult> {
    const sizeBytes = sourceRef.file?.size ?? 0;
    const policyResult = evaluateFileOpenPolicy(sizeBytes, options);

    if (!policyResult.accepted) {
      return { ok: false, error: policyResult.error };
    }

    const decodedText = sourceRef.file ? await readBrowserFileText(sourceRef.file) : "";
    const rawLines = decodedText.length === 0 ? [] : decodedText.split(/\r\n|\n|\r/);
    const source: FileSource = {
      id: sourceRef.id,
      fileIdentity: { value: sourceRef.id, platform: "web" },
      displayName: sourceRef.name,
      pathLabel: sourceRef.name,
      sizeBytes,
      encoding: "utf-8",
      lineChunks: appendRawLinesToChunks([], rawLines),
      watchState: "unsupported",
      deleted: false,
      replaced: false,
      readError: null,
    };

    return { ok: true, source };
  }

  async decodeFile(sourceRef: FileSourceRef): Promise<string> {
    return sourceRef.file ? readBrowserFileText(sourceRef.file) : "";
  }

  async getFileIdentity(sourceRef: FileSourceRef): Promise<string> {
    return sourceRef.id;
  }
}

function readBrowserFileText(file: File): Promise<string> {
  if (typeof file.text === "function") {
    return file.text();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read browser file."));
    reader.readAsText(file);
  });
}
