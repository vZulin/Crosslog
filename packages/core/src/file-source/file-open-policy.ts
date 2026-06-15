import { createCrosslogError, type CrosslogError } from "../errors/crosslog-error";

export interface FileOpenPolicy {
  readonly maxFileSizeBytes: number;
  readonly availableMemoryBytes: number | null;
}

export type FileOpenPolicyResult =
  | { readonly accepted: true }
  | { readonly accepted: false; readonly error: CrosslogError };

export const defaultFileOpenPolicy: FileOpenPolicy = {
  maxFileSizeBytes: 20 * 1024 * 1024,
  availableMemoryBytes: null,
};

export function evaluateFileOpenPolicy(
  sizeBytes: number,
  policy: FileOpenPolicy = defaultFileOpenPolicy,
): FileOpenPolicyResult {
  if (sizeBytes > policy.maxFileSizeBytes) {
    return {
      accepted: false,
      error: createCrosslogError(
        "FileTooLarge",
        `File size ${sizeBytes} exceeds configured maximum ${policy.maxFileSizeBytes}.`,
      ),
    };
  }

  if (policy.availableMemoryBytes !== null && sizeBytes > policy.availableMemoryBytes) {
    return {
      accepted: false,
      error: createCrosslogError(
        "InsufficientMemory",
        "Available memory is insufficient to open this file safely.",
      ),
    };
  }

  return { accepted: true };
}

