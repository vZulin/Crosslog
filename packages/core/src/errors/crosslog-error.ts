export type CrosslogErrorCode =
  | "FileTooLarge"
  | "InsufficientMemory"
  | "FileNotFound"
  | "PermissionDenied"
  | "DecodeFailed"
  | "UnsupportedCapability"
  | "UnknownReadError"
  | "InvalidTimestampConfiguration";

export interface CrosslogError {
  readonly code: CrosslogErrorCode;
  readonly message: string;
  readonly cause?: unknown;
}

export function createCrosslogError(
  code: CrosslogErrorCode,
  message: string,
  cause?: unknown,
): CrosslogError {
  return { code, message, cause };
}

