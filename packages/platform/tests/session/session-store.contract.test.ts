import { describe, expect, it } from "vitest";
import { BrowserSessionStore } from "../../src/browser/browser-session-store";

describe("SessionStorePort contract", () => {
  it("writes, loads, and recovers the last valid session snapshot", async () => {
    const store = new BrowserSessionStore(undefined);
    const session = createValidSession();

    await store.writeSessionSnapshot(session);

    await expect(store.loadLastValidSession()).resolves.toMatchObject({
      panes: [{ id: "pane-app", sourceRef: "source-app" }],
    });
    await expect(store.recoverSession()).resolves.toMatchObject({
      sources: [{ kind: "file", id: "source-app" }],
    });
  });

  it("rejects invalid snapshots before committing them", async () => {
    const store = new BrowserSessionStore(undefined);
    const invalidSession = {
      ...createValidSession(),
      panes: [{ ...createValidSession().panes[0], horizontalScroll: 12 }],
    };

    await expect(store.writeSessionSnapshot(invalidSession as never)).rejects.toThrow("horizontalScroll");
    await expect(store.loadLastValidSession()).resolves.toBeNull();
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
    synchronizationEnabled: true,
    futureExtensions: {},
  };
}
