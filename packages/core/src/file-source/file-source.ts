import type { LineChunk } from "../log-line/log-line";

export type FileSourceId = string;

export type FileWatchState = "unsupported" | "watching" | "stopped" | "failed";

export interface FileIdentity {
  readonly value: string;
  readonly platform: "web" | "desktop";
}

export interface FileSource {
  readonly id: FileSourceId;
  readonly fileIdentity: FileIdentity;
  readonly displayName: string;
  readonly pathLabel: string;
  readonly sizeBytes: number;
  readonly encoding: string;
  readonly lineChunks: readonly LineChunk[];
  readonly watchState: FileWatchState;
  readonly deleted: boolean;
  readonly replaced: boolean;
  readonly readError: string | null;
}

