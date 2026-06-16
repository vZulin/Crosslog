import React from "react";
import type { FileSource } from "@crosslog/core";
import { applyFileLifecycleEvent } from "@crosslog/core";
import type { FileWatcherEvent } from "@crosslog/platform";

export type FileSourceMap = Readonly<Record<string, FileSource>>;

export function useFileLifecycleEvents(
  setFileSources: React.Dispatch<React.SetStateAction<FileSourceMap>>,
) {
  return React.useCallback(
    (event: FileWatcherEvent) => {
      setFileSources((currentSources) => {
        const sourceId = "sourceId" in event ? event.sourceId : null;
        const source = sourceId ? currentSources[sourceId] : null;

        if (!sourceId || !source) {
          return currentSources;
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
