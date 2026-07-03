import { readFileSync } from "node:fs";
import React from "react";
import { fireEvent, render, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SearchState } from "@crosslog/core";
import { PaneSearchPopover } from "../../src/search/PaneSearchPopover";
import { PaneHeader } from "../../src/log-pane/PaneHeader";
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
    const popover = getByTestId(redesignedShellTestIds.paneSearchPopover);
    const matchCount = getByTestId(redesignedShellTestIds.paneSearchMatchCount);

    expect(popover.classList.contains("crosslog-pane-search-popover")).toBe(true);
    expect(matchCount.textContent).toBe("1 of 2");
    expect(matchCount.getAttribute("aria-live")).toBe("polite");

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

  it("closes on Escape and returns focus to the invoking pane find button", () => {
    const onClose = vi.fn();
    const { getByRole, getByTestId } = render(<PaneSearchFocusHarness onClose={onClose} />);
    const trigger = getByRole("button", { name: "Search trigger" });
    const field = getByTestId(redesignedShellTestIds.paneSearchField);

    expect(document.activeElement).toBe(field);

    fireEvent.keyDown(field, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(trigger);
  });

  it("renders compact mode controls as pane-local tags", () => {
    const { getByTestId } = render(
      <PaneSearchPopover
        title="app.log"
        searchState={{ ...searchStateWithMatches, caseSensitive: true, mode: "regex" }}
        onQueryChange={vi.fn()}
        onRegexModeChange={vi.fn()}
        onCaseSensitiveChange={vi.fn()}
        onPreviousMatch={vi.fn()}
        onNextMatch={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const popover = getByTestId(redesignedShellTestIds.paneSearchPopover);
    const caseSensitive = getByTestId(redesignedShellTestIds.paneSearchCaseSensitive);
    const regex = getByTestId(redesignedShellTestIds.paneSearchRegex);

    expect(within(popover).getByRole("toolbar", { name: "Search actions for app.log" })).toBeTruthy();
    expect(caseSensitive).toHaveProperty("checked", true);
    expect(regex).toHaveProperty("checked", true);
    expect(caseSensitive.nextElementSibling?.getAttribute("data-active")).toBe("true");
    expect(regex.nextElementSibling?.getAttribute("data-active")).toBe("true");
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

  it("keeps the pane search icon hit target aligned with the compact header control", () => {
    const { getByTestId } = render(
      <PaneHeader
        paneId="pane-app"
        title="app.log"
        active
        searchOpen
        timeOffset={{ days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }}
        onClose={vi.fn()}
        onOpenSearch={vi.fn()}
      />,
    );
    const searchButton = getByTestId(redesignedShellTestIds.paneHeaderSearch);

    expect(searchButton.classList.contains("crosslog-pane-header__find-button")).toBe(true);
    expect(searchButton.getAttribute("aria-expanded")).toBe("true");
    expect(searchButton.getAttribute("aria-haspopup")).toBe("dialog");
    expect(searchButton.textContent?.trim()).toBe("");
  });

  it("centers previous and next arrows within their hover zones", () => {
    const themeCss = readFileSync("packages/ui/src/app-shell/activity-rail-theme.css", "utf8");

    expect(themeCss).toMatch(
      /\.crosslog-pane-search-popover__actions \.crosslog-icon-button\s*\{[^}]*inline-size:\s*25px;[^}]*block-size:\s*25px;[^}]*box-sizing:\s*border-box;[^}]*padding:\s*0;/s,
    );
  });
});

function PaneSearchFocusHarness({ onClose }: { readonly onClose: () => void }) {
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  return (
    <>
      <button ref={triggerRef} type="button">
        Search trigger
      </button>
      <PaneSearchPopover
        title="app.log"
        searchState={searchStateWithMatches}
        returnFocusRef={triggerRef}
        onQueryChange={vi.fn()}
        onRegexModeChange={vi.fn()}
        onCaseSensitiveChange={vi.fn()}
        onPreviousMatch={vi.fn()}
        onNextMatch={vi.fn()}
        onClose={onClose}
      />
    </>
  );
}

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
