import { act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePaneSearchStore } from "../../src/search/usePaneSearchStore";

describe("pane search state", () => {
  it("keeps search state isolated per pane", () => {
    act(() => {
      usePaneSearchStore.getState().reset();
      usePaneSearchStore.getState().setPaneLines("pane-a", ["alpha", "beta"]);
      usePaneSearchStore.getState().setPaneLines("pane-b", ["alpha", "gamma"]);
      usePaneSearchStore.getState().setQuery("pane-a", "beta");
    });

    expect(usePaneSearchStore.getState().getPaneSearchState("pane-a").matches).toHaveLength(1);
    expect(usePaneSearchStore.getState().getPaneSearchState("pane-b").matches).toHaveLength(0);
  });

  it("stores invalid regex errors only on the edited pane", () => {
    act(() => {
      usePaneSearchStore.getState().reset();
      usePaneSearchStore.getState().setPaneLines("pane-a", ["alpha"]);
      usePaneSearchStore.getState().setPaneLines("pane-b", ["alpha"]);
      usePaneSearchStore.getState().setMode("pane-a", "regex");
      usePaneSearchStore.getState().setQuery("pane-a", "[alpha");
    });

    expect(usePaneSearchStore.getState().getPaneSearchState("pane-a").error).toContain("Invalid regular expression");
    expect(usePaneSearchStore.getState().getPaneSearchState("pane-b").error).toBeNull();
  });

  it("navigates search matches cyclically within one pane", () => {
    act(() => {
      usePaneSearchStore.getState().reset();
      usePaneSearchStore.getState().setPaneLines("pane-a", ["error", "ok", "error"]);
      usePaneSearchStore.getState().setQuery("pane-a", "error");
      usePaneSearchStore.getState().selectNextMatch("pane-a");
      usePaneSearchStore.getState().selectNextMatch("pane-a");
    });

    expect(usePaneSearchStore.getState().getPaneSearchState("pane-a").currentMatchIndex).toBe(0);
  });

  it("tracks visible highlights separately from the current navigated match", () => {
    act(() => {
      usePaneSearchStore.getState().reset();
      usePaneSearchStore.getState().setPaneLines("pane-a", ["error", "ok", "error"]);
      usePaneSearchStore.getState().setQuery("pane-a", "error");
      usePaneSearchStore.getState().selectNextMatch("pane-a");
      usePaneSearchStore.getState().hideHighlights("pane-a");
    });

    expect(usePaneSearchStore.getState().getPaneSearchHighlightsVisible("pane-a")).toBe(false);
    expect(usePaneSearchStore.getState().getPaneSearchState("pane-a").currentMatchIndex).toBe(1);

    act(() => {
      usePaneSearchStore.getState().selectPreviousMatch("pane-a");
    });

    expect(usePaneSearchStore.getState().getPaneSearchHighlightsVisible("pane-a")).toBe(true);
    expect(usePaneSearchStore.getState().getPaneSearchState("pane-a").currentMatchIndex).toBe(0);
  });
});
