import { compileTimestampFormat, type CompiledTimestampFormat, type TimestampFormatDefinition } from "./timestamp-format";

export interface TimestampConfig {
  readonly formats: readonly TimestampFormatDefinition[];
}

export interface ValidatedTimestampConfig {
  readonly formats: readonly TimestampFormatDefinition[];
  readonly enabledFormats: readonly CompiledTimestampFormat[];
}

export function loadTimestampConfigFromJson(content: string): TimestampConfig {
  const parsed = parseJsonObject(content);
  const formats = parsed.formats;

  if (!Array.isArray(formats)) {
    throw new Error("Timestamp config must contain a formats array.");
  }

  return {
    formats: formats.map(readTimestampFormat),
  };
}

export function validateTimestampConfig(config: TimestampConfig): ValidatedTimestampConfig {
  const ids = new Set<string>();
  const enabledFormats: CompiledTimestampFormat[] = [];

  for (const format of config.formats) {
    if (ids.has(format.id)) {
      throw new Error(`Duplicate timestamp format id: ${format.id}.`);
    }

    ids.add(format.id);

    if (format.enabled ?? true) {
      enabledFormats.push(compileTimestampFormat(format));
    }
  }

  return {
    formats: config.formats,
    enabledFormats,
  };
}

function parseJsonObject(content: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(content);

  if (!isRecord(parsed)) {
    throw new Error("Timestamp config must be a JSON object.");
  }

  return parsed;
}

function readTimestampFormat(value: unknown): TimestampFormatDefinition {
  if (!isRecord(value)) {
    throw new Error("Timestamp format entries must be objects.");
  }

  const id = readString(value.id, "id");
  const pattern = readString(value.pattern, "pattern");
  const parser = readString(value.parser, "parser");
  const enabled = value.enabled === undefined ? true : readBoolean(value.enabled, "enabled");

  return {
    id,
    pattern,
    parser,
    enabled,
  };
}

function readString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Timestamp format ${fieldName} must be a non-empty string.`);
  }

  return value;
}

function readBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`Timestamp format ${fieldName} must be a boolean.`);
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
