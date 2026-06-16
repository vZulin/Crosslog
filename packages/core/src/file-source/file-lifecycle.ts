import type { FileIdentity, FileSource } from "./file-source";
import { appendRawLinesToChunks } from "./line-chunk-store";

export type FileLifecycleEvent =
  | { readonly type: "append"; readonly lines: readonly string[] }
  | { readonly type: "delete" }
  | {
      readonly type: "replace";
      readonly identity: FileIdentity;
      readonly sizeBytes: number;
      readonly encoding: string;
      readonly lines: readonly string[];
    }
  | { readonly type: "watchUnsupported" }
  | { readonly type: "watchError"; readonly message: string };

export function applyFileLifecycleEvent(source: FileSource, event: FileLifecycleEvent): FileSource {
  switch (event.type) {
    case "append":
      if (source.deleted || source.replaced || event.lines.length === 0) {
        return source;
      }

      return {
        ...source,
        lineChunks: appendRawLinesToChunks(source.lineChunks, event.lines),
        sizeBytes: source.sizeBytes + byteLength(event.lines.join("\n")),
        readError: null,
      };

    case "delete":
      return {
        ...source,
        deleted: true,
        watchState: "stopped",
        readError: null,
      };

    case "replace":
      return {
        ...source,
        fileIdentity: event.identity,
        sizeBytes: event.sizeBytes,
        encoding: event.encoding,
        lineChunks: appendRawLinesToChunks([], event.lines),
        watchState: "watching",
        deleted: false,
        replaced: true,
        readError: null,
      };

    case "watchUnsupported":
      return {
        ...source,
        watchState: "unsupported",
      };

    case "watchError":
      return {
        ...source,
        watchState: "failed",
        readError: event.message,
      };
  }
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}
