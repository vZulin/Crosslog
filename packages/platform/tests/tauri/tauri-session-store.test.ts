import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@crosslog/core";
import { TauriSessionStore } from "../../src/tauri/tauri-session-store";

const invokeMock = vi.hoisted(() => vi.fn());

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
}));

describe("TauriSessionStore", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    sessionStorage.clear();
  });

  it("uses sessionStorage for UI-test session recovery", async () => {
    invokeMock.mockResolvedValue(true);
    const store = new TauriSessionStore();

    await store.writeSessionSnapshot(createValidSession());

    await expect(store.recoverSession()).resolves.toMatchObject({
      panes: [{ id: "pane-app", sourceRef: "source-app" }],
    });
    expect(invokeMock).toHaveBeenCalledTimes(1);
    expect(invokeMock).toHaveBeenCalledWith("is_ui_test_mode");
  });

  it("delegates to Tauri commands outside UI-test mode", async () => {
    invokeMock.mockImplementation((command: string) => {
      if (command === "is_ui_test_mode") {
        return Promise.resolve(false);
      }

      if (command === "recover_session") {
        return Promise.resolve(createValidSession());
      }

      return Promise.resolve(null);
    });
    const store = new TauriSessionStore();

    await store.writeSessionSnapshot(createValidSession());

    await expect(store.recoverSession()).resolves.toMatchObject({
      sources: [{ kind: "file", id: "source-app" }],
    });
    expect(invokeMock).toHaveBeenCalledWith("write_session_snapshot", expect.any(Object));
    expect(invokeMock).toHaveBeenCalledWith("recover_session");
  });
});

function createValidSession(): Session {
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
        fileIdentity: { value: "source-app", platform: "desktop" },
        displayName: "app.log",
        pathLabel: "app.log",
        sizeBytes: 120,
        encoding: "utf-8",
      },
    ],
    directorySelections: {},
    futureExtensions: {},
  };
}
