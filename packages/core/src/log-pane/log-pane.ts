import type { SearchState } from "../search/search-state";
import type { TimeOffset } from "../sync/time-offset";

export type LogPaneId = string;
export type SourceId = string;

export type LogPaneStatus =
  | "empty"
  | "loading"
  | "ready"
  | "deleted"
  | "error"
  | "unsupported"
  | "memory-limited";

export interface LogPane {
  readonly id: LogPaneId;
  readonly sourceRef: SourceId | null;
  readonly title: string;
  readonly active: boolean;
  readonly width: number;
  readonly horizontalScroll: number;
  readonly searchState: SearchState;
  readonly syncEnabled: boolean;
  readonly timeOffset: TimeOffset;
  readonly status: LogPaneStatus;
}

