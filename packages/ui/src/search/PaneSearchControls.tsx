import React from "react";
import type { SearchState } from "@crosslog/core";
import { SearchResultNavigator } from "./SearchResultNavigator";

export interface PaneSearchControlsProps {
  readonly title: string;
  readonly searchState: SearchState;
  readonly onQueryChange: (query: string) => void;
  readonly onRegexModeChange: (enabled: boolean) => void;
  readonly onCaseSensitiveChange: (enabled: boolean) => void;
  readonly onPreviousMatch: () => void;
  readonly onNextMatch: () => void;
}

export function PaneSearchControls({
  title,
  searchState,
  onQueryChange,
  onRegexModeChange,
  onCaseSensitiveChange,
  onPreviousMatch,
  onNextMatch,
}: PaneSearchControlsProps) {
  return (
    <div role="search" aria-label={`Search tools for ${title}`}>
      <input
        type="search"
        aria-label={`Search ${title}`}
        value={searchState.query}
        onChange={(event) => onQueryChange(event.currentTarget.value)}
      />
      <label>
        <input
          type="checkbox"
          aria-label={`Regular expression search for ${title}`}
          checked={searchState.mode === "regex"}
          onChange={(event) => onRegexModeChange(event.currentTarget.checked)}
        />
        Regex
      </label>
      <label>
        <input
          type="checkbox"
          aria-label={`Case-sensitive search for ${title}`}
          checked={searchState.caseSensitive}
          onChange={(event) => onCaseSensitiveChange(event.currentTarget.checked)}
        />
        Case
      </label>
      <SearchResultNavigator
        title={title}
        searchState={searchState}
        onPreviousMatch={onPreviousMatch}
        onNextMatch={onNextMatch}
      />
      {searchState.error ? <span role="alert">{searchState.error}</span> : null}
    </div>
  );
}
