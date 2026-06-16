import type { LineChunk, LogLine } from "../log-line/log-line";
import { compileTimestampFormat, type TimestampFormatDefinition, type TimestampMatch } from "./timestamp-format";

export interface TimestampRecognitionService {
  readonly recognizeTimestampInLine: (line: string) => TimestampMatch | null;
  readonly recognizeLine: (lineNumber: number, rawText: string, chunkId?: string) => LogLine;
  readonly recognizeChunks: (chunks: readonly LineChunk[]) => readonly LineChunk[];
}

export function createTimestampRecognitionService(
  formats: readonly TimestampFormatDefinition[],
): TimestampRecognitionService {
  const compiledFormats = formats.map(compileTimestampFormat).filter((format) => format.enabled);

  function recognizeTimestampInLine(line: string): TimestampMatch | null {
    for (const format of compiledFormats) {
      const match = format.matchLine(line);

      if (match) {
        return match;
      }
    }

    return null;
  }

  function recognizeLine(lineNumber: number, rawText: string, chunkId = "timestamp-recognition"): LogLine {
    const match = recognizeTimestampInLine(rawText);

    return {
      lineNumber,
      rawText,
      timestamp: match?.timestamp ?? null,
      timestampSourceRange: match?.sourceRange ?? null,
      chunkId,
    };
  }

  function recognizeChunks(chunks: readonly LineChunk[]): readonly LineChunk[] {
    return chunks.map((chunk) => ({
      ...chunk,
      lines: chunk.lines.map((line) => ({
        ...line,
        ...recognizeLine(line.lineNumber, line.rawText, chunk.id),
      })),
    }));
  }

  return {
    recognizeTimestampInLine,
    recognizeLine,
    recognizeChunks,
  };
}

export const defaultTimestampFormats: readonly TimestampFormatDefinition[] = [
  {
    id: "iso-utc",
    pattern: "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z",
    parser: "YYYY-MM-DDTHH:mm:ss.SSSZ",
    enabled: true,
  },
  {
    id: "space-comma",
    pattern: "\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2},\\d{3}",
    parser: "YYYY-MM-DD HH:mm:ss,SSS",
    enabled: true,
  },
];
