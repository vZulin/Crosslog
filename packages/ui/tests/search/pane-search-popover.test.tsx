import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SearchState } from "@crosslog/core";
import { PaneSearchPopover } from "../../src/search/PaneSearchPopover";
import { redesignedShellTestIds } from "../../src/app-shell/testIds";

describe("redesigned pane search popover", () => {
  it("publishes stable controls and routes search edits", () => {
    const onQueryChange = vi.fn();
    const onRegexModeChange = vi.fn();
    const onCaseSensitiveChange = vi.fn();
    const onPreviousMatch = vi.fn();
    const onNextMatch = vi.fn();

    const { getByRole, getByTestId } = render(
      <PaneSearchPopover
        title="app.log"
        searchState={searchStateWithMatches}
        onQueryChange={onQueryChange}
        onRegexModeChange={onRegexModeChange}
        onCaseSensitiveChange={onCaseSensitiveChange}
        onPreviousMatch={onPreviousMatch}
        onNextMatch={onNextMatch}
        onClose={vi.fn()}
      />,
    );

    expect(getByRole("dialog", { name: "Pane search for app.log" })).toBeTruthy();
    expect(getByTestId(redesignedShellTestIds.paneSearchMatchCount).textContent).toBe("1 of 2");

    fireEvent.change(getByTestId(redesignedShellTestIds.paneSearchField), {
      target: { value: "warning" },
    });
    fireEvent.click(getByTestId(redesignedShellTestIds.paneSearchRegex));
    fireEvent.click(getByTestId(redesignedShellTestIds.paneSearchCaseSensitive));
    fireEvent.click(getByTestId(redesignedShellTestIds.paneSearchNext));
    fireEvent.click(getByTestId(redesignedShellTestIds.paneSearchPrevious));

    expect(onQueryChange).toHaveBeenCalledWith("warning");
    expect(onRegexModeChange).toHaveBeenCalledWith(true);
    expect(onCaseSensitiveChange).toHaveBeenCalledWith(true);
    expect(onNextMatch).toHaveBeenCalledTimes(1);
    expect(onPreviousMatch).toHaveBeenCalledTimes(1);
  });

  it("shows invalid regex errors without enabling match navigation", () => {
    const { getByRole, getByTestId } = render(
      <PaneSearchPopover
        title="app.log"
        searchState={invalidRegexSearchState}
        onQueryChange={vi.fn()}
        onRegexModeChange={vi.fn()}
        onCaseSensitiveChange={vi.fn()}
        onPreviousMatch={vi.fn()}
        onNextMatch={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(getByRole("alert").textContent).toContain("Invalid regular expression");
    expect(getByTestId(redesignedShellTestIds.paneSearchMatchCount).textContent).toBe("0 of 0");
    expect(getByTestId(redesignedShellTestIds.paneSearchPrevious).hasAttribute("disabled")).toBe(true);
    expect(getByTestId(redesignedShellTestIds.paneSearchNext).hasAttribute("disabled")).toBe(true);
  });
});

const searchStateWithMatches: SearchState = {
  query: "error",
  mode: "text",
  caseSensitive: false,
  matches: [
    { lineNumber: 3, range: { start: 24, end: 29 } },
    { lineNumber: 7, range: { start: 12, end: 17 } },
  ],
  currentMatchIndex: 0,
  error: null,
};

const invalidRegexSearchState: SearchState = {
  query: "[broken",
  mode: "regex",
  caseSensitive: false,
  matches: [],
  currentMatchIndex: null,
  error: "Invalid regular expression",
};
