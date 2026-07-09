import React from "react";
import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { appendRawLinesToChunks, type FileSource } from "@crosslog/core";
import {
  useFileLifecycleEvents,
  type FileLifecycleEventHandlers,
  type FileSourceMap,
} from "../../src/log-pane/useFileLifecycleEvents";

describe("useFileLifecycleEvents", () => {
  it("notifies diagnostics when a watcher error is received", async () => {
    const onWatcherError = vi.fn();
    const source = createFileSource("source-app", "/logs/app.log");

    render(<FileLifecycleProbe initialSources={{ [source.id]: source }} onWatcherError={onWatcherError} />);

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent("crosslog-test-file-event", {
          detail: {
            type: "WatcherError",
            sourceId: source.id,
            message: "watch failed",
          },
        }),
      );
    });

    expect(onWatcherError).toHaveBeenCalledWith(
      {
        type: "WatcherError",
        sourceId: source.id,
        message: "watch failed",
      },
      source,
    );
  });
});

function FileLifecycleProbe({
  initialSources,
  onWatcherError,
}: {
  readonly initialSources: FileSourceMap;
  readonly onWatcherError: FileLifecycleEventHandlers["onWatcherError"];
}) {
  const [sources, setSources] = React.useState<FileSourceMap>(initialSources);
  const publishEvent = useFileLifecycleEvents(setSources, { onWatcherError });

  React.useEffect(() => {
    const handleEvent = (event: Event) => {
      publishEvent((event as CustomEvent).detail);
    };

    window.addEventListener("crosslog-test-file-event", handleEvent);
    return () => window.removeEventListener("crosslog-test-file-event", handleEvent);
  }, [publishEvent]);

  return <output aria-label="source count">{Object.keys(sources).length}</output>;
}

function createFileSource(id: string, path: string): FileSource {
  return {
    id,
    fileIdentity: { value: path, platform: "desktop" },
    displayName: "app.log",
    pathLabel: path,
    sizeBytes: 10,
    encoding: "utf-8",
    lineChunks: appendRawLinesToChunks([], ["first line"]),
    watchState: "watching",
    deleted: false,
    replaced: false,
    readError: null,
  };
}
