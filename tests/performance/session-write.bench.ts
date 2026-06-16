import { bench, describe } from "vitest";
import { BrowserSessionStore } from "../../packages/platform/src/browser/browser-session-store";

describe("session write", () => {
  bench("validates and writes a multi-pane session snapshot", async () => {
    const store = new BrowserSessionStore(undefined);

    await store.writeSessionSnapshot({
      schemaVersion: 1,
      panes: Array.from({ length: 8 }, (_, index) => ({
        id: `pane-${index + 1}`,
        sourceRef: `source-${index + 1}`,
        title: `source-${index + 1}.log`,
        active: index === 0,
        width: 520,
        timeOffset: {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        },
      })),
      paneSizes: Object.fromEntries(Array.from({ length: 8 }, (_, index) => [`pane-${index + 1}`, 520])),
      sources: Array.from({ length: 8 }, (_, index) => ({
        kind: "file",
        id: `source-${index + 1}`,
        fileIdentity: { value: `source-${index + 1}`, platform: "web" },
        displayName: `source-${index + 1}.log`,
        pathLabel: `source-${index + 1}.log`,
        sizeBytes: 20_000_000,
        encoding: "utf-8",
      })),
      directorySelections: {},
      futureExtensions: {},
    });
  });
});
