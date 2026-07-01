import { describe, expect, it } from "vitest";
import { validateSessionSnapshot } from "../../src/session/session-schema";

describe("session schema validation", () => {
  it("accepts a current session snapshot with source descriptors and pane sizes", () => {
    const result = validateSessionSnapshot(createValidSession());

    expect(result.ok).toBe(true);
    expect(result.ok ? result.session.panes[0].sourceRef : null).toBe("source-app");
    expect(result.ok ? result.session.synchronizationEnabled : null).toBe(false);
  });

  it("defaults legacy session snapshots to enabled synchronization", () => {
    const snapshot = { ...createValidSession() } as Record<string, unknown>;
    delete snapshot.synchronizationEnabled;

    const result = validateSessionSnapshot(snapshot);

    expect(result.ok).toBe(true);
    expect(result.ok ? result.session.synchronizationEnabled : null).toBe(true);
  });

  it("rejects snapshots that persist scroll positions", () => {
    const snapshot = createValidSession();

    const result = validateSessionSnapshot({
      ...snapshot,
      panes: [{ ...snapshot.panes[0], horizontalScroll: 400 }],
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? "" : result.error).toContain("horizontalScroll");
  });

  it("rejects pane references to missing sources", () => {
    const snapshot = createValidSession();

    const result = validateSessionSnapshot({
      ...snapshot,
      panes: [{ ...snapshot.panes[0], sourceRef: "source-missing" }],
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? "" : result.error).toContain("unknown source");
  });
});

function createValidSession() {
  return {
    schemaVersion: 1,
    panes: [
      {
        id: "pane-app",
        sourceRef: "source-app",
        title: "app.log",
        active: true,
        width: 520,
        timeOffset: {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        },
      },
    ],
    paneSizes: { "pane-app": 520 },
    sources: [
      {
        kind: "file",
        id: "source-app",
        fileIdentity: { value: "source-app", platform: "web" },
        displayName: "app.log",
        pathLabel: "app.log",
        sizeBytes: 120,
        encoding: "utf-8",
      },
    ],
    directorySelections: {},
    synchronizationEnabled: false,
    futureExtensions: {},
  };
}
