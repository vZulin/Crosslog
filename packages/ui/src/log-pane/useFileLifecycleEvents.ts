import React from "react";
import type { FileSource } from "@crosslog/core";
import { applyFileLifecycleEvent } from "@crosslog/core";
import type { FileWatcherEvent } from "@crosslog/platform";

export type FileSourceMap = Readonly<Record<string, FileSource>>;

export interface PaneHeaderLifecycleState {
  readonly live: boolean;
  readonly deleted: boolean;
  readonly replaced: boolean;
  readonly monitoringUnsupported: boolean;
  readonly errorMessage: string | null;
}

export interface FileLifecycleEventHandlers {
  readonly onWatcherError?: (
    event: Extract<FileWatcherEvent, { readonly type: "WatcherError" }>,
    source: FileSource,
  ) => void;
}

export function getPaneHeaderLifecycleState(
  source: FileSource | null | undefined,
): PaneHeaderLifecycleState | undefined {
  if (!source) {
    return undefined;
  }

  return {
    live: source.watchState === "watching" && !source.deleted,
    deleted: source.deleted,
    replaced: source.replaced,
    monitoringUnsupported: source.watchState === "unsupported",
    errorMessage: source.readError ?? (source.watchState === "failed" ? "File monitoring failed." : null),
  };
}

export function useFileLifecycleEvents(
  setFileSources: React.Dispatch<React.SetStateAction<FileSourceMap>>,
  handlers: FileLifecycleEventHandlers = {},
) {
  const handlersRef = React.useRef(handlers);

  React.useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  return React.useCallback(
    (event: FileWatcherEvent) => {
      setFileSources((currentSources) => {
        const sourceId = "sourceId" in event ? event.sourceId : null;
        const source = sourceId ? currentSources[sourceId] : null;

        if (!sourceId || !source) {
          return currentSources;
        }

        if (event.type === "WatcherError") {
          handlersRef.current.onWatcherError?.(event, source);
        }

        const nextSource = applyWatcherEvent(source, event);

        return nextSource === source ? currentSources : { ...currentSources, [sourceId]: nextSource };
      });
    },
    [setFileSources],
  );
}

function applyWatcherEvent(source: FileSource, event: FileWatcherEvent): FileSource {
  switch (event.type) {
    case "FileAppended":
      return applyFileLifecycleEvent(source, { type: "append", lines: event.lines ?? [] });
    case "FileDeleted":
      return applyFileLifecycleEvent(source, { type: "delete" });
    case "FileReplaced":
      return applyFileLifecycleEvent(source, {
        type: "replace",
        identity: {
          value: event.identity ?? `${source.fileIdentity.value}:replacement`,
          platform: source.fileIdentity.platform,
        },
        sizeBytes: event.sizeBytes ?? source.sizeBytes,
        encoding: source.encoding,
        lines: event.lines ?? [],
      });
    case "WatcherUnsupported":
      return applyFileLifecycleEvent(source, { type: "watchUnsupported" });
    case "WatcherError":
      return applyFileLifecycleEvent(source, { type: "watchError", message: event.message });
    case "DirectoryEntryAdded":
    case "DirectoryEntryRemoved":
    case "DirectoryEntryReplaced":
      return source;
  }
}
