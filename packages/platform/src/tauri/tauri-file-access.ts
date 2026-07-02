import { appendRawLinesToChunks, evaluateFileOpenPolicy, type FileSource } from "@crosslog/core";
import type { FileAccessPort, FileAccessResult, FileSourceRef } from "../ports/file-access-port";

interface TauriFileContent {
  readonly displayName: string;
  readonly sizeBytes: number;
  readonly lines: readonly string[];
}

type LogFileReader = (path: string) => Promise<TauriFileContent>;

export class TauriFileAccess implements FileAccessPort {
  constructor(private readonly readLogFile: LogFileReader = readLogFileViaCommand) {}

  async openFileReadOnly(
    sourceRef: FileSourceRef,
    options: Parameters<FileAccessPort["openFileReadOnly"]>[1],
  ): Promise<FileAccessResult> {
    const path = sourceRef.path;

    if (!path) {
      // No filesystem path is available (e.g. a restored source ref); there is
      // nothing to read from disk, so return an empty read-only source.
      return { ok: true, source: createDesktopFileSource(sourceRef, sourceRef.name, 0, []) };
    }

    let content: TauriFileContent;

    try {
      content = await this.readLogFile(path);
    } catch (error) {
      return {
        ok: true,
        source: {
          ...createDesktopFileSource(sourceRef, sourceRef.name, 0, []),
          pathLabel: path,
          watchState: "failed",
          readError: error instanceof Error ? error.message : String(error),
        },
      };
    }

    const policyResult = evaluateFileOpenPolicy(content.sizeBytes, options);

    if (!policyResult.accepted) {
      return { ok: false, error: policyResult.error };
    }

    return {
      ok: true,
      source: {
        ...createDesktopFileSource(
          sourceRef,
          content.displayName.length > 0 ? content.displayName : sourceRef.name,
          content.sizeBytes,
          content.lines,
        ),
        pathLabel: path,
      },
    };
  }

  async decodeFile(sourceRef: FileSourceRef): Promise<string> {
    if (!sourceRef.path) {
      return "";
    }

    const content = await this.readLogFile(sourceRef.path);

    return content.lines.join("\n");
  }

  async getFileIdentity(sourceRef: FileSourceRef): Promise<string> {
    return sourceRef.path ?? sourceRef.id;
  }
}

function createDesktopFileSource(
  sourceRef: FileSourceRef,
  displayName: string,
  sizeBytes: number,
  lines: readonly string[],
): FileSource {
  return {
    id: sourceRef.id,
    fileIdentity: { value: sourceRef.path ?? sourceRef.id, platform: "desktop" },
    displayName,
    pathLabel: sourceRef.name,
    sizeBytes,
    encoding: "utf-8",
    lineChunks: appendRawLinesToChunks([], lines),
    watchState: "watching",
    deleted: false,
    replaced: false,
    readError: null,
  };
}

async function readLogFileViaCommand(path: string): Promise<TauriFileContent> {
  const { invoke } = await import("@tauri-apps/api/core");

  return invoke<TauriFileContent>("read_log_file", { path });
}
