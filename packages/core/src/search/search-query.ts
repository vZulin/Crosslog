import type { SearchMode } from "./search-state";

export interface SearchQuery {
  readonly text: string;
  readonly mode: SearchMode;
  readonly caseSensitive: boolean;
}

export function createSearchQuery(
  text: string,
  mode: SearchMode = "text",
  caseSensitive = false,
): SearchQuery {
  return {
    text,
    mode,
    caseSensitive,
  };
}
