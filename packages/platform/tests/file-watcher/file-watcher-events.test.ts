import { describe, expect, it } from "vitest";
import { BrowserFileWatcher } from "../../src/browser/browser-file-watcher";
import { mapTauriWatcherEvent } from "../../src/tauri/tauri-file-watcher";

describe("file watcher events", () => {
  it("maps append, delete, replace, unsupported, and error events from Tauri payloads", () => {
    expect(
      mapTauriWatcherEvent({
        kind: "appended",
        sourceId: "source-app",
        lines: ["new line"],
      }),
    ).toEqual({ type: "FileAppended", sourceId: "source-app", lines: ["new line"] });
    expect(mapTauriWatcherEvent({ kind: "deleted", sourceId: "source-app" })).toEqual({
      type: "FileDeleted",
      sourceId: "source-app",
    });
    expect(
      mapTauriWatcherEvent({
        kind: "replaced",
        sourceId: "source-app",
        identity: "replacement",
        sizeBytes: 128,
        lines: ["replacement line"],
      }),
    ).toEqual({
      type: "FileReplaced",
      sourceId: "source-app",
      identity: "replacement",
      sizeBytes: 128,
      lines: ["replacement line"],
    });
    expect(mapTauriWatcherEvent({ kind: "unsupported", sourceId: "source-app" })).toEqual({
      type: "WatcherUnsupported",
      sourceId: "source-app",
    });
    expect(mapTauriWatcherEvent({ kind: "error", sourceId: "source-app", message: "denied" })).toEqual({
      type: "WatcherError",
      sourceId: "source-app",
      message: "denied",
    });
  });

  it("reports unsupported monitoring from the browser adapter", () => {
    const events: unknown[] = [];
    const subscription = new BrowserFileWatcher().watchSource("source-web", (event) => events.push(event));

    subscription.unsubscribe();

    expect(events).toEqual([{ type: "WatcherUnsupported", sourceId: "source-web" }]);
  });
});
