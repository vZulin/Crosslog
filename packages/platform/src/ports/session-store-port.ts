import type { Session } from "@crosslog/core";

export interface SessionStorePort {
  loadLastValidSession(): Promise<Session | null>;
  writeSessionSnapshot(session: Session): Promise<void>;
  recoverSession(): Promise<Session | null>;
}

