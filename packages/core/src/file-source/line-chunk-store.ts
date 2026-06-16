import type { LineChunk, LogLine } from "../log-line/log-line";

const DEFAULT_APPEND_CHUNK_SIZE = 1_000;

export function appendRawLinesToChunks(
  chunks: readonly LineChunk[],
  rawLines: readonly string[],
  chunkSize = DEFAULT_APPEND_CHUNK_SIZE,
): readonly LineChunk[] {
  if (rawLines.length === 0) {
    return chunks;
  }

  const nextStartLineNumber = getNextLineNumber(chunks);
  const appendedChunks: LineChunk[] = [];

  for (let offset = 0; offset < rawLines.length; offset += chunkSize) {
    const slice = rawLines.slice(offset, offset + chunkSize);
    const startLineNumber = nextStartLineNumber + offset;

    appendedChunks.push({
      id: `chunk-${startLineNumber}`,
      startLineNumber,
      lines: slice.map((rawText, index): LogLine => {
        const lineNumber = startLineNumber + index;

        return {
          lineNumber,
          rawText,
          timestamp: null,
          timestampSourceRange: null,
          chunkId: `chunk-${startLineNumber}`,
        };
      }),
    });
  }

  return [...chunks, ...appendedChunks];
}

export function flattenLineChunkText(chunks: readonly LineChunk[]): readonly string[] {
  return chunks.flatMap((chunk) => chunk.lines.map((line) => line.rawText));
}

function getNextLineNumber(chunks: readonly LineChunk[]): number {
  const lastChunk = chunks.at(-1);
  const lastLine = lastChunk?.lines.at(-1);

  return (lastLine?.lineNumber ?? 0) + 1;
}
