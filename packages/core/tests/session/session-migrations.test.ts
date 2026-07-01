import { describe, expect, it } from "vitest";
import { migrateSessionSnapshot } from "../../src/session/session-migrations";

describe("session migrations", () => {
  it("migrates legacy source id snapshots to descriptor-based schema", () => {
    const result = migrateSessionSnapshot({
      schemaVersion: 0,
      panes: [
        {
          id: "pane-legacy",
          sourceRef: "legacy.log",
          title: "legacy.log",
          active: true,
          width: 480,
          horizontalScroll: 600,
        },
      ],
      sources: ["legacy.log"],
      futureExtensions: { carried: true },
    });

    expect(result.ok).toBe(true);
    expect(result.ok ? result.migratedFromVersion : null).toBe(0);
    expect(result.ok ? result.session.sources[0] : null).toMatchObject({
      kind: "file",
      id: "legacy.log",
      displayName: "legacy.log",
    });
    expect(result.ok ? result.session.synchronizationEnabled : null).toBe(true);
    expect(result.ok ? Object.keys(result.session.panes[0]) : []).not.toContain("horizontalScroll");
  });

  it("rejects snapshots from newer unsupported schema versions", () => {
    const result = migrateSessionSnapshot({
      schemaVersion: 99,
      panes: [],
      paneSizes: {},
      sources: [],
      directorySelections: {},
      futureExtensions: {},
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? "" : result.error).toContain("newer than supported");
  });
});
