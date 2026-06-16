import { zeroTimeOffset, type TimeOffset } from "../sync/time-offset";
import {
  CURRENT_SESSION_SCHEMA_VERSION,
  type Session,
  type SessionDirectoryFileEntry,
  type SessionDirectorySource,
  type SessionFileSource,
  type SessionIdentity,
  type SessionPane,
  type SessionSource,
} from "./session";

export interface SessionValidationSuccess {
  readonly ok: true;
  readonly session: Session;
}

export interface SessionValidationFailure {
  readonly ok: false;
  readonly error: string;
}

export type SessionValidationResult = SessionValidationSuccess | SessionValidationFailure;

const FORBIDDEN_SCROLL_FIELDS = new Set(["horizontalScroll", "verticalScroll", "scrollTop", "scrollLine"]);

export function validateSessionSnapshot(input: unknown): SessionValidationResult {
  if (!isRecord(input)) {
    return invalid("Session snapshot must be an object.");
  }

  if (input.schemaVersion !== CURRENT_SESSION_SCHEMA_VERSION) {
    return invalid(`Unsupported session schema version: ${String(input.schemaVersion)}.`);
  }

  const sources = parseSources(input.sources);

  if (!sources.ok) {
    return sources;
  }

  const sourceIds = new Set(sources.sources.map((source) => source.id));
  const panes = parsePanes(input.panes, sourceIds);

  if (!panes.ok) {
    return panes;
  }

  const paneSizes = parsePaneSizes(input.paneSizes, panes.panes);

  if (!paneSizes.ok) {
    return paneSizes;
  }

  const directorySelections = parseDirectorySelections(input.directorySelections, sources.sources);

  if (!directorySelections.ok) {
    return directorySelections;
  }

  if (!isRecord(input.futureExtensions)) {
    return invalid("Session futureExtensions must be an object.");
  }

  return {
    ok: true,
    session: {
      schemaVersion: CURRENT_SESSION_SCHEMA_VERSION,
      panes: panes.panes,
      paneSizes: paneSizes.paneSizes,
      sources: sources.sources,
      directorySelections: directorySelections.directorySelections,
      futureExtensions: { ...input.futureExtensions },
    },
  };
}

export function assertValidSessionSnapshot(input: unknown): Session {
  const result = validateSessionSnapshot(input);

  if (!result.ok) {
    throw new Error(result.error);
  }

  return result.session;
}

function parsePanes(input: unknown, sourceIds: ReadonlySet<string>) {
  if (!Array.isArray(input)) {
    return invalid("Session panes must be an array.");
  }

  const panes: SessionPane[] = [];
  const paneIds = new Set<string>();
  let activePaneCount = 0;

  for (const pane of input) {
    if (!isRecord(pane)) {
      return invalid("Session pane must be an object.");
    }

    for (const field of FORBIDDEN_SCROLL_FIELDS) {
      if (field in pane) {
        return invalid(`Session pane must not persist ${field}.`);
      }
    }

    if (!isNonEmptyString(pane.id)) {
      return invalid("Session pane id must be a non-empty string.");
    }

    if (paneIds.has(pane.id)) {
      return invalid(`Duplicate session pane id: ${pane.id}.`);
    }

    if (pane.sourceRef !== null && (!isNonEmptyString(pane.sourceRef) || !sourceIds.has(pane.sourceRef))) {
      return invalid(`Session pane ${pane.id} references an unknown source.`);
    }

    if (!isNonEmptyString(pane.title)) {
      return invalid(`Session pane ${pane.id} title must be a non-empty string.`);
    }

    if (typeof pane.active !== "boolean") {
      return invalid(`Session pane ${pane.id} active flag must be boolean.`);
    }

    if (!isPositiveFiniteNumber(pane.width)) {
      return invalid(`Session pane ${pane.id} width must be a positive number.`);
    }

    const timeOffset = parseTimeOffset(pane.timeOffset);

    if (!timeOffset.ok) {
      return invalid(`Session pane ${pane.id} has an invalid time offset.`);
    }

    if (pane.active) {
      activePaneCount += 1;
    }

    panes.push({
      id: pane.id,
      sourceRef: pane.sourceRef,
      title: pane.title,
      active: pane.active,
      width: pane.width,
      timeOffset: timeOffset.timeOffset,
    });
  }

  if (activePaneCount > 1) {
    return invalid("Session can restore at most one active pane.");
  }

  return { ok: true as const, panes };
}

function parsePaneSizes(input: unknown, panes: readonly SessionPane[]) {
  if (!isRecord(input)) {
    return invalid("Session paneSizes must be an object.");
  }

  const paneIds = new Set(panes.map((pane) => pane.id));
  const paneSizes: Record<string, number> = {};

  for (const [paneId, width] of Object.entries(input)) {
    if (!paneIds.has(paneId)) {
      return invalid(`Session paneSizes references unknown pane: ${paneId}.`);
    }

    if (!isPositiveFiniteNumber(width)) {
      return invalid(`Session paneSizes value for ${paneId} must be a positive number.`);
    }

    paneSizes[paneId] = width;
  }

  return { ok: true as const, paneSizes };
}

function parseSources(input: unknown) {
  if (!Array.isArray(input)) {
    return invalid("Session sources must be an array.");
  }

  const sources: SessionSource[] = [];
  const sourceIds = new Set<string>();

  for (const source of input) {
    if (!isRecord(source) || (source.kind !== "file" && source.kind !== "directory")) {
      return invalid("Session source must be a file or directory descriptor.");
    }

    if (!isNonEmptyString(source.id)) {
      return invalid("Session source id must be a non-empty string.");
    }

    if (sourceIds.has(source.id)) {
      return invalid(`Duplicate session source id: ${source.id}.`);
    }

    sourceIds.add(source.id);

    if (source.kind === "file") {
      const fileSource = parseFileSource(source);

      if (!fileSource.ok) {
        return fileSource;
      }

      sources.push(fileSource.source);
      continue;
    }

    const directorySource = parseDirectorySource(source);

    if (!directorySource.ok) {
      return directorySource;
    }

    sources.push(directorySource.source);
  }

  return { ok: true as const, sources };
}

function parseFileSource(source: Record<string, unknown>) {
  const identity = parseIdentity(source.fileIdentity);

  if (!identity.ok) {
    return invalid(`Session file source ${String(source.id)} has an invalid identity.`);
  }

  if (!isNonEmptyString(source.displayName) || !isNonEmptyString(source.pathLabel)) {
    return invalid(`Session file source ${String(source.id)} has invalid labels.`);
  }

  if (!isNonNegativeFiniteNumber(source.sizeBytes)) {
    return invalid(`Session file source ${String(source.id)} sizeBytes must be non-negative.`);
  }

  if (!isNonEmptyString(source.encoding)) {
    return invalid(`Session file source ${String(source.id)} encoding must be a non-empty string.`);
  }

  return {
    ok: true as const,
    source: {
      kind: "file",
      id: source.id as string,
      fileIdentity: identity.identity,
      displayName: source.displayName,
      pathLabel: source.pathLabel,
      sizeBytes: source.sizeBytes,
      encoding: source.encoding,
    } satisfies SessionFileSource,
  };
}

function parseDirectorySource(source: Record<string, unknown>) {
  const identity = parseIdentity(source.directoryIdentity);

  if (!identity.ok) {
    return invalid(`Session directory source ${String(source.id)} has an invalid identity.`);
  }

  if (!isNonEmptyString(source.displayName)) {
    return invalid(`Session directory source ${String(source.id)} displayName must be a non-empty string.`);
  }

  if (source.currentFileId !== null && !isNonEmptyString(source.currentFileId)) {
    return invalid(`Session directory source ${String(source.id)} currentFileId must be a string or null.`);
  }

  if (!Array.isArray(source.files)) {
    return invalid(`Session directory source ${String(source.id)} files must be an array.`);
  }

  const files: SessionDirectoryFileEntry[] = [];
  const fileIds = new Set<string>();

  for (const file of source.files) {
    const entry = parseDirectoryFileEntry(file);

    if (!entry.ok) {
      return entry;
    }

    if (fileIds.has(entry.entry.identity.value)) {
      return invalid(`Duplicate directory file identity: ${entry.entry.identity.value}.`);
    }

    fileIds.add(entry.entry.identity.value);
    files.push(entry.entry);
  }

  if (source.currentFileId !== null && !fileIds.has(source.currentFileId)) {
    return invalid(`Session directory source ${String(source.id)} currentFileId is not in files.`);
  }

  return {
    ok: true as const,
    source: {
      kind: "directory",
      id: source.id as string,
      directoryIdentity: identity.identity,
      displayName: source.displayName,
      files,
      currentFileId: source.currentFileId,
    } satisfies SessionDirectorySource,
  };
}

function parseDirectoryFileEntry(input: unknown) {
  if (!isRecord(input)) {
    return invalid("Session directory file entry must be an object.");
  }

  const identity = parseIdentity(input.identity);

  if (!identity.ok) {
    return invalid("Session directory file entry has an invalid identity.");
  }

  if (!isNonEmptyString(input.name) || !isNonEmptyString(input.fallbackOrderKey)) {
    return invalid("Session directory file entry has invalid labels.");
  }

  if (input.createdAt !== null && !isIsoDateString(input.createdAt)) {
    return invalid("Session directory file entry createdAt must be ISO string or null.");
  }

  if (!isNonNegativeFiniteNumber(input.sizeBytes)) {
    return invalid("Session directory file entry sizeBytes must be non-negative.");
  }

  return {
    ok: true as const,
    entry: {
      identity: identity.identity,
      name: input.name,
      createdAt: input.createdAt,
      fallbackOrderKey: input.fallbackOrderKey,
      sizeBytes: input.sizeBytes,
    } satisfies SessionDirectoryFileEntry,
  };
}

function parseDirectorySelections(input: unknown, sources: readonly SessionSource[]) {
  if (!isRecord(input)) {
    return invalid("Session directorySelections must be an object.");
  }

  const directorySources = new Map(
    sources
      .filter((source): source is SessionDirectorySource => source.kind === "directory")
      .map((source) => [source.id, source]),
  );
  const directorySelections: Record<string, string> = {};

  for (const [directoryId, fileId] of Object.entries(input)) {
    const directorySource = directorySources.get(directoryId);

    if (!directorySource) {
      return invalid(`Session directorySelections references unknown directory: ${directoryId}.`);
    }

    if (!isNonEmptyString(fileId)) {
      return invalid(`Session directorySelections value for ${directoryId} must be a non-empty string.`);
    }

    if (!directorySource.files.some((file) => file.identity.value === fileId)) {
      return invalid(`Session directorySelections value for ${directoryId} is not in directory files.`);
    }

    directorySelections[directoryId] = fileId;
  }

  return { ok: true as const, directorySelections };
}

function parseIdentity(input: unknown) {
  if (!isRecord(input)) {
    return invalid("Session identity must be an object.");
  }

  if (!isNonEmptyString(input.value) || (input.platform !== "web" && input.platform !== "desktop")) {
    return invalid("Session identity must include value and platform.");
  }

  return {
    ok: true as const,
    identity: {
      value: input.value,
      platform: input.platform,
    } satisfies SessionIdentity,
  };
}

function parseTimeOffset(input: unknown) {
  if (!isRecord(input)) {
    return { ok: true as const, timeOffset: zeroTimeOffset };
  }

  const values = {
    days: input.days,
    hours: input.hours,
    minutes: input.minutes,
    seconds: input.seconds,
    milliseconds: input.milliseconds,
  };

  if (!Object.values(values).every((value) => typeof value === "number" && Number.isFinite(value))) {
    return invalid("Session time offset must contain finite numeric fields.");
  }

  return { ok: true as const, timeOffset: values as TimeOffset };
}

function invalid(error: string): SessionValidationFailure {
  return { ok: false, error };
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function isNonEmptyString(input: unknown): input is string {
  return typeof input === "string" && input.trim().length > 0;
}

function isPositiveFiniteNumber(input: unknown): input is number {
  return typeof input === "number" && Number.isFinite(input) && input > 0;
}

function isNonNegativeFiniteNumber(input: unknown): input is number {
  return typeof input === "number" && Number.isFinite(input) && input >= 0;
}

function isIsoDateString(input: unknown): input is string {
  return typeof input === "string" && !Number.isNaN(Date.parse(input));
}
