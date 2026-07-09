export type DiagnosticLogLevel = "debug" | "info" | "warn" | "error";

export type DiagnosticLogFieldValue =
  | string
  | number
  | boolean
  | null
  | readonly DiagnosticLogFieldValue[]
  | { readonly [key: string]: DiagnosticLogFieldValue };

export type DiagnosticLogFields = Readonly<Record<string, DiagnosticLogFieldValue>>;

export interface DiagnosticLogEvent {
  readonly timestamp: string;
  readonly level: DiagnosticLogLevel;
  readonly name: string;
  readonly fields?: DiagnosticLogFields;
}

export interface DiagnosticLogPort {
  write(event: DiagnosticLogEvent): Promise<void>;
}
