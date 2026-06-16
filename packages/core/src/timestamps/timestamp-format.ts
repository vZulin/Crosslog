import type { SourceRange } from "../log-line/log-line";

export interface TimestampFormatDefinition {
  readonly id: string;
  readonly pattern: string;
  readonly parser: string;
  readonly enabled?: boolean;
}

export interface TimestampMatch {
  readonly timestamp: Date;
  readonly sourceRange: SourceRange;
  readonly formatId: string;
}

export interface CompiledTimestampFormat extends TimestampFormatDefinition {
  readonly enabled: boolean;
  readonly matchLine: (line: string) => TimestampMatch | null;
}

interface ParserPart {
  readonly token: TimestampToken;
  readonly expression: string;
}

type TimestampToken = "YYYY" | "YY" | "MM" | "DD" | "HH" | "mm" | "ss" | "SSS";

const TOKEN_EXPRESSIONS: Record<TimestampToken, string> = {
  YYYY: "(\\d{4})",
  YY: "(\\d{2})",
  MM: "(\\d{2})",
  DD: "(\\d{2})",
  HH: "(\\d{2})",
  mm: "(\\d{2})",
  ss: "(\\d{2})",
  SSS: "(\\d{1,3})",
};

const TOKENS = Object.keys(TOKEN_EXPRESSIONS).sort((left, right) => right.length - left.length) as TimestampToken[];

export function compileTimestampFormat(definition: TimestampFormatDefinition): CompiledTimestampFormat {
  const pattern = compilePattern(definition);
  const parser = compileParser(definition.parser);
  const enabled = definition.enabled ?? true;

  return {
    ...definition,
    enabled,
    matchLine(line: string) {
      if (!enabled) {
        return null;
      }

      const candidateMatch = pattern.exec(line);
      pattern.lastIndex = 0;

      if (!candidateMatch?.[0]) {
        return null;
      }

      const timestamp = parseCandidate(candidateMatch[0], parser);

      if (!timestamp) {
        return null;
      }

      const start = candidateMatch.index;

      return {
        timestamp,
        sourceRange: { start, end: start + candidateMatch[0].length },
        formatId: definition.id,
      };
    },
  };
}

function compilePattern(definition: TimestampFormatDefinition): RegExp {
  try {
    return new RegExp(definition.pattern);
  } catch (error) {
    throw new Error(`Invalid timestamp pattern for ${definition.id}: ${formatError(error)}`);
  }
}

function compileParser(parser: string): readonly ParserPart[] {
  const parts: ParserPart[] = [];
  let index = 0;

  while (index < parser.length) {
    const token = TOKENS.find((candidate) => parser.startsWith(candidate, index));

    if (token) {
      parts.push({ token, expression: TOKEN_EXPRESSIONS[token] });
      index += token.length;
      continue;
    }

    const character = parser[index];

    if (/[A-Za-z]/.test(character) && character !== "T" && character !== "Z") {
      throw new Error(`Unsupported timestamp parser token near "${parser.slice(index)}".`);
    }

    parts.push({ token: "YYYY", expression: escapeRegExp(character) });
    index += 1;
  }

  return parts;
}

function parseCandidate(candidate: string, parts: readonly ParserPart[]): Date | null {
  const tokenParts = parts.filter((part) => TOKENS.includes(part.token) && part.expression === TOKEN_EXPRESSIONS[part.token]);
  const regex = new RegExp(`^${parts.map((part) => part.expression).join("")}$`);
  const match = regex.exec(candidate);

  if (!match) {
    return null;
  }

  const values = new Map<TimestampToken, number>();

  tokenParts.forEach((part, index) => {
    const value = Number.parseInt(match[index + 1] ?? "", 10);

    if (Number.isNaN(value)) {
      return;
    }

    values.set(part.token, part.token === "YY" ? 2000 + value : value);
  });

  const year = values.get("YYYY") ?? values.get("YY") ?? 1970;
  const month = values.get("MM") ?? 1;
  const day = values.get("DD") ?? 1;
  const hour = values.get("HH") ?? 0;
  const minute = values.get("mm") ?? 0;
  const second = values.get("ss") ?? 0;
  const millisecond = values.get("SSS") ?? 0;
  const timestamp = new Date(Date.UTC(year, month - 1, day, hour, minute, second, millisecond));

  if (
    timestamp.getUTCFullYear() !== year ||
    timestamp.getUTCMonth() !== month - 1 ||
    timestamp.getUTCDate() !== day ||
    timestamp.getUTCHours() !== hour ||
    timestamp.getUTCMinutes() !== minute ||
    timestamp.getUTCSeconds() !== second ||
    timestamp.getUTCMilliseconds() !== millisecond
  ) {
    return null;
  }

  return timestamp;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
