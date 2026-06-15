export type LineChunkId = string;

export interface SourceRange {
  readonly start: number;
  readonly end: number;
}

export interface LogLine {
  readonly lineNumber: number;
  readonly rawText: string;
  readonly timestamp: Date | null;
  readonly timestampSourceRange: SourceRange | null;
  readonly chunkId: LineChunkId;
}

export interface LineChunk {
  readonly id: LineChunkId;
  readonly startLineNumber: number;
  readonly lines: readonly LogLine[];
}

