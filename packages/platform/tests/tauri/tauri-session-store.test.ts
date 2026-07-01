import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@crosslog/core";
import { TauriSessionStore } from "../../src/tauri/tauri-session-store";

const invokeMock = vi.hoisted(() => vi.fn());
const uiTestSessionKey = "crosslog.ui-test.session.last-valid:test-run";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
}));

describe("TauriSessionStore", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    sessionStorage.clear();
    localStorage.clear();
  });

  it("uses sessionStorage for UI-test session recovery", async () => {
    mockUiTestMode();
    const store = new TauriSessionStore();

    await store.writeSessionSnapshot(createValidSession());

    await expect(store.recoverSession()).resolves.toMatchObject({
      panes: [{ id: "pane-app", sourceRef: "source-app" }],
    });
    expect(invokeMock).toHaveBeenCalledWith("is_ui_test_mode");
    expect(invokeMock).toHaveBeenCalledWith("ui_test_session_key");
    expect(invokeMock).toHaveBeenCalledWith("ui_test_persistent_session_enabled");
    expect(localStorage.getItem(uiTestSessionKey)).toBeNull();
  });

  it("ignores UI-test localStorage sessions", async () => {
    mockUiTestMode();
    localStorage.setItem(uiTestSessionKey, JSON.stringify(createValidSession()));

    await expect(new TauriSessionStore().recoverSession()).resolves.toBeNull();
  });

  it("delegates persistent UI-test recovery to isolated Tauri commands", async () => {
    mockUiTestMode({ persistentSessionEnabled: true });
    const store = new TauriSessionStore();

    await store.writeSessionSnapshot(createValidSession());

    await expect(store.recoverSession()).resolves.toMatchObject({
      synchronizationEnabled: true,
      panes: [{ id: "pane-app", sourceRef: "source-app" }],
    });
    expect(invokeMock).toHaveBeenCalledWith("ui_test_write_session_snapshot", expect.any(Object));
    expect(invokeMock).toHaveBeenCalledWith("ui_test_recover_session");
    expect(sessionStorage.getItem(uiTestSessionKey)).toBeNull();
    expect(localStorage.getItem(uiTestSessionKey)).toBeNull();
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

function mockUiTestMode(options: { readonly persistentSessionEnabled?: boolean } = {}) {
  invokeMock.mockImplementation((command: string) => {
    if (command === "is_ui_test_mode") {
      return Promise.resolve(true);
    }

    if (command === "ui_test_session_key") {
      return Promise.resolve(uiTestSessionKey);
    }

    if (command === "ui_test_persistent_session_enabled") {
      return Promise.resolve(options.persistentSessionEnabled ?? false);
    }

    if (command === "ui_test_recover_session" || command === "ui_test_load_last_valid_session") {
      return Promise.resolve(createValidSession());
    }

    return Promise.resolve(null);
  });
}

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
    synchronizationEnabled: true,
    futureExtensions: {},
  };
}
