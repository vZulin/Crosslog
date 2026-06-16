import {
  assertValidSessionSnapshot,
  migrateSessionSnapshot,
  type Session,
} from "@crosslog/core";
import type { SessionStorePort } from "../ports/session-store-port";

export const BROWSER_SESSION_DATABASE = "crosslog-session";
export const BROWSER_SESSION_STORE = "snapshots";
export const BROWSER_SESSION_LAST_VALID_KEY = "last-valid";
export const BROWSER_SESSION_PENDING_KEY = "pending";

export class BrowserSessionStore implements SessionStorePort {
  private readonly memoryStore = new Map<string, unknown>();

  constructor(private readonly indexedDb: IDBFactory | undefined = globalThis.indexedDB) {}

  async loadLastValidSession(): Promise<Session | null> {
    const rawSnapshot = await this.readSnapshot(BROWSER_SESSION_LAST_VALID_KEY);

    if (rawSnapshot === null) {
      return null;
    }

    const result = migrateSessionSnapshot(rawSnapshot);
    return result.ok ? result.session : null;
  }

  async writeSessionSnapshot(session: Session): Promise<void> {
    const snapshot = assertValidSessionSnapshot(toJsonValue(session));

    await this.writeSnapshot(BROWSER_SESSION_PENDING_KEY, snapshot);

    const pendingSnapshot = await this.readSnapshot(BROWSER_SESSION_PENDING_KEY);
    assertValidSessionSnapshot(pendingSnapshot);

    await this.writeSnapshot(BROWSER_SESSION_LAST_VALID_KEY, snapshot);
    await this.deleteSnapshot(BROWSER_SESSION_PENDING_KEY);
  }

  async recoverSession(): Promise<Session | null> {
    return this.loadLastValidSession();
  }

  private async readSnapshot(key: string): Promise<unknown | null> {
    if (!this.indexedDb) {
      return this.memoryStore.has(key) ? this.memoryStore.get(key) ?? null : null;
    }

    const database = await openSessionDatabase(this.indexedDb);

    return requestToPromise(
      database.transaction(BROWSER_SESSION_STORE, "readonly").objectStore(BROWSER_SESSION_STORE).get(key),
    );
  }

  private async writeSnapshot(key: string, snapshot: unknown): Promise<void> {
    if (!this.indexedDb) {
      this.memoryStore.set(key, snapshot);
      return;
    }

    const database = await openSessionDatabase(this.indexedDb);
    await requestToPromise(
      database.transaction(BROWSER_SESSION_STORE, "readwrite").objectStore(BROWSER_SESSION_STORE).put(snapshot, key),
    );
  }

  private async deleteSnapshot(key: string): Promise<void> {
    if (!this.indexedDb) {
      this.memoryStore.delete(key);
      return;
    }

    const database = await openSessionDatabase(this.indexedDb);
    await requestToPromise(
      database.transaction(BROWSER_SESSION_STORE, "readwrite").objectStore(BROWSER_SESSION_STORE).delete(key),
    );
  }
}

function openSessionDatabase(indexedDb: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDb.open(BROWSER_SESSION_DATABASE, 1);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(BROWSER_SESSION_STORE)) {
        database.createObjectStore(BROWSER_SESSION_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open browser session database."));
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Browser session store request failed."));
  });
}

function toJsonValue(input: Session): unknown {
  return JSON.parse(JSON.stringify(input)) as unknown;
}
