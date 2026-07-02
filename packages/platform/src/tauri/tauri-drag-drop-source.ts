import type { DirectorySourceRef } from "../ports/directory-access-port";
import type { FileSourceRef } from "../ports/file-access-port";
import type {
  DragDropSource,
  DragDropSourcePort,
  NativeDropHandler,
} from "../ports/drag-drop-source-port";

/**
 * Shape of a native Tauri drag-drop event as delivered by
 * `getCurrentWebview().onDragDropEvent`. Only the `drop` phase carries the
 * dropped filesystem paths.
 */
export interface NativeDragDropPayload {
  readonly type: "enter" | "over" | "drop" | "leave";
  readonly paths?: readonly string[];
}

export type DroppedPathKind = "file" | "directory" | "missing";

export interface ClassifiedDroppedPath {
  readonly path: string;
  readonly kind: DroppedPathKind;
  readonly name: string;
}

export type DroppedPathClassifier = (
  paths: readonly string[],
) => Promise<readonly ClassifiedDroppedPath[]>;

export type NativeDropSubscriber = (
  handler: (payload: NativeDragDropPayload) => void,
) => Promise<() => void>;

/**
 * Desktop drag-and-drop adapter. Under Tauri, native OS file drops are
 * intercepted by the webview and never surface as DOM `DragEvent.dataTransfer`
 * files (and a DOM `File` carries no filesystem path), so drops are consumed
 * through the native `onDragDropEvent` path and classified via a Rust command.
 */
export class TauriDragDropSource implements DragDropSourcePort {
  constructor(
    private readonly classifyPaths: DroppedPathClassifier = classifyDroppedPathsViaCommand,
    private readonly subscribeNative: NativeDropSubscriber = subscribeViaWebview,
  ) {}

  /**
   * DOM drops do not carry native file paths under Tauri; native drops arrive
   * via {@link subscribeToNativeDrops}. Kept to satisfy the port contract.
   */
  async mapDroppedSources(): Promise<readonly DragDropSource[]> {
    return [];
  }

  async subscribeToNativeDrops(handler: NativeDropHandler): Promise<() => void> {
    return this.subscribeNative((payload) => {
      if (payload.type !== "drop") {
        return;
      }

      const paths = payload.paths ?? [];

      if (paths.length === 0) {
        return;
      }

      void this.mapNativePaths(paths).then((sources) => {
        if (sources.length > 0) {
          handler(sources);
        }
      });
    });
  }

  /** Classify native dropped paths and map them into source refs. */
  async mapNativePaths(paths: readonly string[]): Promise<readonly DragDropSource[]> {
    const classified = await this.classifyPaths(paths);
    const sources: DragDropSource[] = [];

    for (const entry of classified) {
      if (entry.kind === "file") {
        sources.push({ type: "file", source: createFileSourceRef(entry) });
      } else if (entry.kind === "directory") {
        sources.push({ type: "directory", source: createDirectorySourceRef(entry) });
      }
    }

    return sources;
  }
}

function createFileSourceRef(entry: ClassifiedDroppedPath): FileSourceRef {
  return {
    id: createDesktopSourceId("file", entry.path),
    name: resolveName(entry),
    path: entry.path,
  };
}

function createDirectorySourceRef(entry: ClassifiedDroppedPath): DirectorySourceRef {
  return {
    id: createDesktopSourceId("directory", entry.path),
    name: resolveName(entry),
    path: entry.path,
  };
}

function resolveName(entry: ClassifiedDroppedPath): string {
  return entry.name.length > 0 ? entry.name : getPathBasename(entry.path);
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

async function classifyDroppedPathsViaCommand(
  paths: readonly string[],
): Promise<readonly ClassifiedDroppedPath[]> {
  const { invoke } = await import("@tauri-apps/api/core");

  return invoke<readonly ClassifiedDroppedPath[]>("classify_dropped_paths", {
    paths: [...paths],
  });
}

async function subscribeViaWebview(
  handler: (payload: NativeDragDropPayload) => void,
): Promise<() => void> {
  const { getCurrentWebview } = await import("@tauri-apps/api/webview");
  const unlisten = await getCurrentWebview().onDragDropEvent((event) => {
    handler(event.payload as unknown as NativeDragDropPayload);
  });

  return unlisten;
}
