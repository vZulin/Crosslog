import { invoke } from "@tauri-apps/api/core";
import {
  assertValidSessionSnapshot,
  migrateSessionSnapshot,
  type Session,
} from "@crosslog/core";
import type { SessionStorePort } from "../ports/session-store-port";

const DEFAULT_UI_TEST_SESSION_STORAGE_KEY = "crosslog.ui-test.session.last-valid";

export class TauriSessionStore implements SessionStorePort {
  private uiTestMode: Promise<boolean> | null = null;
  private uiTestSessionStorageKey: Promise<string> | null = null;

  async loadLastValidSession(): Promise<Session | null> {
    if (await this.isUiTestMode()) {
      return readUiTestSessionSnapshot(await this.getUiTestSessionStorageKey());
    }

    return parseSessionResult(await invoke<unknown | null>("load_last_valid_session"));
  }

  async writeSessionSnapshot(session: Session): Promise<void> {
    const snapshot = assertValidSessionSnapshot(JSON.parse(JSON.stringify(session)) as unknown);

    if (await this.isUiTestMode()) {
      writeUiTestSessionSnapshot(await this.getUiTestSessionStorageKey(), snapshot);
      return;
    }

    await invoke("write_session_snapshot", {
      session: snapshot,
    });
  }

  async recoverSession(): Promise<Session | null> {
    if (await this.isUiTestMode()) {
      return readUiTestSessionSnapshot(await this.getUiTestSessionStorageKey());
    }

    return parseSessionResult(await invoke<unknown | null>("recover_session"));
  }

  private isUiTestMode(): Promise<boolean> {
    this.uiTestMode ??= invoke<boolean>("is_ui_test_mode").catch(() => false);
    return this.uiTestMode;
  }

  private getUiTestSessionStorageKey(): Promise<string> {
    this.uiTestSessionStorageKey ??= invoke<string>("ui_test_session_key").catch(
      () => DEFAULT_UI_TEST_SESSION_STORAGE_KEY,
    );

    return this.uiTestSessionStorageKey;
  }
}

function parseSessionResult(input: unknown | null): Session | null {
  if (input === null) {
    return null;
  }

  const result = migrateSessionSnapshot(input);
  return result.ok ? result.session : null;
}

function readUiTestSessionSnapshot(key: string): Session | null {
  const serialized =
    globalThis.sessionStorage?.getItem(key) ??
    globalThis.localStorage?.getItem(key);

  if (!serialized) {
    return null;
  }

  try {
    return parseSessionResult(JSON.parse(serialized) as unknown);
  } catch {
    return null;
  }
}

function writeUiTestSessionSnapshot(key: string, session: Session): void {
  const serialized = JSON.stringify(session);

  globalThis.sessionStorage?.setItem(key, serialized);
  globalThis.localStorage?.setItem(key, serialized);
}
