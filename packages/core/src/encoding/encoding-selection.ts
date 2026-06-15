export const supportedEncodings = [
  "utf-8",
  "utf-8-bom",
  "utf-16le",
  "utf-16be",
  "windows-1251",
  "windows-1252",
] as const;

export type SupportedEncoding = (typeof supportedEncodings)[number];

export interface EncodingSelection {
  readonly detectedEncoding: SupportedEncoding | null;
  readonly selectedEncoding: SupportedEncoding | null;
  readonly detectionFailed: boolean;
}

export function selectEncoding(
  detectedEncoding: SupportedEncoding | null,
  selectedEncoding: SupportedEncoding | null,
): EncodingSelection {
  return {
    detectedEncoding,
    selectedEncoding: selectedEncoding ?? detectedEncoding,
    detectionFailed: detectedEncoding === null,
  };
}

