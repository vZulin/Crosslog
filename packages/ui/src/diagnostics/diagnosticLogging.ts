import type {
  DiagnosticLogFieldValue,
  DiagnosticLogFields,
  DiagnosticLogLevel,
  DiagnosticLogPort,
} from "@crosslog/platform";

export function logDiagnosticEvent(
  logger: DiagnosticLogPort | undefined,
  level: DiagnosticLogLevel,
  name: string,
  fields?: DiagnosticLogFields,
): void {
  if (!logger) {
    return;
  }

  void logger
    .write({
      timestamp: new Date().toISOString(),
      level,
      name,
      fields,
    })
    .catch(() => undefined);
}

export function serializeErrorForDiagnosticLog(error: unknown): DiagnosticLogFields {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      message: error.message,
      stack: error.stack ?? null,
    };
  }

  return {
    errorName: null,
    message: stringifyDiagnosticValue(error),
    stack: null,
  };
}

export function stringifyDiagnosticValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "undefined";
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function countSourceLines(source: { readonly lineChunks: readonly { readonly lines: readonly unknown[] }[] }): number {
  return source.lineChunks.reduce((lineCount, chunk) => lineCount + chunk.lines.length, 0);
}

export function compactDiagnosticFields(fields: Record<string, DiagnosticLogFieldValue | undefined>): DiagnosticLogFields {
  return Object.fromEntries(
    Object.entries(fields).filter((entry): entry is [string, DiagnosticLogFieldValue] => entry[1] !== undefined),
  );
}
