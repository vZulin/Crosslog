import { CURRENT_SESSION_SCHEMA_VERSION, type Session } from "./session";
import { validateSessionSnapshot, type SessionValidationResult } from "./session-schema";

export interface SessionMigration {
  readonly fromVersion: number;
  readonly toVersion: number;
  migrate(input: Record<string, unknown>): Record<string, unknown>;
}

export interface SessionMigrationSuccess {
  readonly ok: true;
  readonly session: Session;
  readonly migratedFromVersion: number | null;
}

export interface SessionMigrationFailure {
  readonly ok: false;
  readonly error: string;
}

export type SessionMigrationResult = SessionMigrationSuccess | SessionMigrationFailure;

export const sessionMigrations: readonly SessionMigration[] = [
  {
    fromVersion: 0,
    toVersion: 1,
    migrate(input) {
      const legacySources = Array.isArray(input.sources) ? input.sources : [];
      const sources = legacySources
        .filter((source): source is string => typeof source === "string" && source.trim().length > 0)
        .map((source) => ({
          kind: "file" as const,
          id: source,
          fileIdentity: { value: source, platform: "web" as const },
          displayName: source,
          pathLabel: source,
          sizeBytes: 0,
          encoding: "utf-8",
        }));

      const sourceIds = new Set(sources.map((source) => source.id));
      const panes = Array.isArray(input.panes)
        ? input.panes
            .filter((pane): pane is Record<string, unknown> => isRecord(pane))
            .map((pane) => ({
              id: typeof pane.id === "string" ? pane.id : "pane-restored",
              sourceRef: typeof pane.sourceRef === "string" && sourceIds.has(pane.sourceRef) ? pane.sourceRef : null,
              title: typeof pane.title === "string" && pane.title.length > 0 ? pane.title : "Restored log",
              active: pane.active === true,
              width: typeof pane.width === "number" && Number.isFinite(pane.width) && pane.width > 0
                ? pane.width
                : 520,
              timeOffset: {
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
                milliseconds: 0,
              },
            }))
        : [];

      return {
        schemaVersion: 1,
        panes,
        paneSizes: Object.fromEntries(panes.map((pane) => [pane.id, pane.width])),
        sources,
        directorySelections: {},
        synchronizationEnabled: typeof input.synchronizationEnabled === "boolean"
          ? input.synchronizationEnabled
          : true,
        futureExtensions: isRecord(input.futureExtensions) ? input.futureExtensions : {},
      };
    },
  },
];

export function migrateSessionSnapshot(input: unknown): SessionMigrationResult {
  if (!isRecord(input)) {
    return { ok: false, error: "Session snapshot must be an object." };
  }

  if (typeof input.schemaVersion !== "number" || !Number.isInteger(input.schemaVersion)) {
    return { ok: false, error: "Session schemaVersion must be an integer." };
  }

  if (input.schemaVersion > CURRENT_SESSION_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Session schema version ${input.schemaVersion} is newer than supported version ${CURRENT_SESSION_SCHEMA_VERSION}.`,
    };
  }

  const originalVersion = input.schemaVersion;
  let snapshot = input;
  let currentVersion = input.schemaVersion;

  while (currentVersion < CURRENT_SESSION_SCHEMA_VERSION) {
    const migration = sessionMigrations.find((candidate) => candidate.fromVersion === currentVersion);

    if (!migration) {
      return { ok: false, error: `No session migration registered from version ${currentVersion}.` };
    }

    snapshot = migration.migrate(snapshot);
    currentVersion = migration.toVersion;
  }

  const validation: SessionValidationResult = validateSessionSnapshot(snapshot);

  if (!validation.ok) {
    return validation;
  }

  return {
    ok: true,
    session: validation.session,
    migratedFromVersion: originalVersion === CURRENT_SESSION_SCHEMA_VERSION ? null : originalVersion,
  };
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}
