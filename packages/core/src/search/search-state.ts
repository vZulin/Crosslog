import type { SourceRange } from "../log-line/log-line";

export type SearchMode = "text" | "regex";

export interface SearchMatch {
  readonly lineNumber: number;
  readonly range: SourceRange;
}

export interface SearchState {
  readonly query: string;
  readonly mode: SearchMode;
  readonly caseSensitive: boolean;
  readonly matches: readonly SearchMatch[];
  readonly currentMatchIndex: number | null;
  readonly error: string | null;
}

export const emptySearchState: SearchState = {
  query: "",
  mode: "text",
  caseSensitive: false,
  matches: [],
  currentMatchIndex: null,
  error: null,
};

