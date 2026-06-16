import React from "react";
import type { SearchState } from "@crosslog/core";

export interface SearchResultNavigatorProps {
  readonly title: string;
  readonly searchState: SearchState;
  readonly onPreviousMatch: () => void;
  readonly onNextMatch: () => void;
}

export function SearchResultNavigator({
  title,
  searchState,
  onPreviousMatch,
  onNextMatch,
}: SearchResultNavigatorProps) {
  const currentMatchNumber =
    searchState.currentMatchIndex === null ? 0 : searchState.currentMatchIndex + 1;
  const hasMatches = searchState.matches.length > 0;

  return (
    <span role="group" aria-label={`Search result navigation for ${title}`}>
      <span aria-label={`Search match count for ${title}`}>
        {currentMatchNumber} of {searchState.matches.length}
      </span>
      <button
        type="button"
        aria-label={`Previous search match in ${title}`}
        disabled={!hasMatches}
        onClick={onPreviousMatch}
      >
        Prev
      </button>
      <button
        type="button"
        aria-label={`Next search match in ${title}`}
        disabled={!hasMatches}
        onClick={onNextMatch}
      >
        Next
      </button>
    </span>
  );
}
