import { invoke } from "@tauri-apps/api/core";
import {
  assertValidSessionSnapshot,
  migrateSessionSnapshot,
  type Session,
} from "@crosslog/core";
import type { SessionStorePort } from "../ports/session-store-port";

export class TauriSessionStore implements SessionStorePort {
  async loadLastValidSession(): Promise<Session | null> {
    return parseSessionResult(await invoke<unknown | null>("load_last_valid_session"));
  }

  async writeSessionSnapshot(session: Session): Promise<void> {
    await invoke("write_session_snapshot", {
      session: assertValidSessionSnapshot(JSON.parse(JSON.stringify(session)) as unknown),
    });
  }

  async recoverSession(): Promise<Session | null> {
    return parseSessionResult(await invoke<unknown | null>("recover_session"));
  }
}

function parseSessionResult(input: unknown | null): Session | null {
  if (input === null) {
    return null;
  }

  const result = migrateSessionSnapshot(input);
  return result.ok ? result.session : null;
}
