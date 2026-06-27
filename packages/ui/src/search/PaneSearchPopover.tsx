import React from "react";
import type { SearchState } from "@crosslog/core";
import { IconButton } from "../app-shell/IconButton";
import { Popover } from "../app-shell/Popover";
import { redesignedShellTestIds } from "../app-shell/testIds";

export interface PaneSearchPopoverProps {
  readonly title: string;
  readonly searchState: SearchState;
  readonly focusRequestSequence?: number;
  readonly onQueryChange: (query: string) => void;
  readonly onRegexModeChange: (enabled: boolean) => void;
  readonly onCaseSensitiveChange: (enabled: boolean) => void;
  readonly onPreviousMatch: () => void;
  readonly onNextMatch: () => void;
  readonly onClose: () => void;
}

export function PaneSearchPopover({
  focusRequestSequence = 0,
  title,
  searchState,
  onQueryChange,
  onRegexModeChange,
  onCaseSensitiveChange,
  onPreviousMatch,
  onNextMatch,
  onClose,
}: PaneSearchPopoverProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const currentMatchNumber =
    searchState.currentMatchIndex === null ? 0 : searchState.currentMatchIndex + 1;
  const hasMatches = searchState.matches.length > 0;

  React.useEffect(() => {
    inputRef.current?.focus();
  }, [focusRequestSequence]);

  return (
    <Popover
      className="crosslog-pane-search-popover"
      label="Pane search"
      ownerLabel={title}
      onEscapeKeyDown={onClose}
      testId={redesignedShellTestIds.paneSearchPopover}
    >
      <div className="crosslog-pane-search-popover__content">
        <label className="crosslog-pane-search-popover__field">
          <span>Search</span>
          <input
            aria-label={`Search ${title}`}
            data-testid={redesignedShellTestIds.paneSearchField}
            onChange={(event) => onQueryChange(event.currentTarget.value)}
            ref={inputRef}
            type="search"
            value={searchState.query}
          />
        </label>
        <span
          aria-label={`Search match count for ${title}`}
          className="crosslog-pane-search-popover__match-count"
          data-testid={redesignedShellTestIds.paneSearchMatchCount}
        >
          {currentMatchNumber} of {searchState.matches.length}
        </span>
        <div
          aria-label={`Search actions for ${title}`}
          className="crosslog-pane-search-popover__actions"
          role="toolbar"
        >
          <IconButton
            disabled={!hasMatches}
            icon="previous"
            label={`Previous search match in ${title}`}
            onClick={onPreviousMatch}
            testId={redesignedShellTestIds.paneSearchPrevious}
          />
          <IconButton
            disabled={!hasMatches}
            icon="next"
            label={`Next search match in ${title}`}
            onClick={onNextMatch}
            testId={redesignedShellTestIds.paneSearchNext}
          />
          <label className="crosslog-pane-search-popover__toggle">
            <input
              aria-label={`Case-sensitive search for ${title}`}
              checked={searchState.caseSensitive}
              data-testid={redesignedShellTestIds.paneSearchCaseSensitive}
              onChange={(event) => onCaseSensitiveChange(event.currentTarget.checked)}
              type="checkbox"
            />
            <span>Aa</span>
          </label>
          <label className="crosslog-pane-search-popover__toggle">
            <input
              aria-label={`Regular expression search for ${title}`}
              checked={searchState.mode === "regex"}
              data-testid={redesignedShellTestIds.paneSearchRegex}
              onChange={(event) => onRegexModeChange(event.currentTarget.checked)}
              type="checkbox"
            />
            <span>.*</span>
          </label>
        </div>
        {searchState.error ? (
          <span className="crosslog-pane-search-popover__error" role="alert">
            {searchState.error}
          </span>
        ) : null}
      </div>
    </Popover>
  );
}
