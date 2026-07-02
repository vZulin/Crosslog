import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createVisibleLogLineWindow, VirtualLogViewport } from "../../src/log-pane/VirtualLogViewport";

describe("virtual log viewport", () => {
  it("centers a target line inside the visible window", () => {
    const lines = createNumberedLines(20);
    const visibleLines = createVisibleLogLineWindow(lines, 5, [], 10);

    expect(visibleLines.map((line) => line.lineNumber)).toEqual([8, 9, 10, 11, 12]);
  });

  it("sizes the line-number gutter from the total line-count digit count", () => {
    const { getByTestId } = render(
      <VirtualLogViewport title="app.log" lines={createNumberedLines(1_000)} maxVisibleLines={5} />,
    );
    const viewport = getByTestId("log-viewport");

    expect(viewport.getAttribute("data-line-count")).toBe("1000");
    expect(viewport.getAttribute("data-gutter-digits")).toBe("4");
    expect(viewport.style.getPropertyValue("--crosslog-line-number-digits")).toBe("4");
  });

  it("moves the selected line with vertical wheel navigation and emits a sync anchor", () => {
    const onTimeAnchorChange = vi.fn();
    const timestamps = createTimestamps(20);
    const { getByTestId } = render(
      <VirtualLogViewport
        title="app.log"
        lines={createNumberedLines(20)}
        timestamps={timestamps}
        maxVisibleLines={5}
        onTimeAnchorChange={onTimeAnchorChange}
      />,
    );
    const viewport = getByTestId("log-viewport");

    fireEvent.wheel(viewport, { deltaY: 240 });

    expect(viewport.getAttribute("data-selected-line-number")).toBe("7");
    expect(viewport.getAttribute("data-last-navigation")).toBe("wheel");
    expect(onTimeAnchorChange).toHaveBeenLastCalledWith(7, timestamps[6]);
  });

  it("advances the rendered text by scrolling the viewport as the wheel moves (bug 5)", () => {
    const { getByTestId } = render(
      <VirtualLogViewport
        title="app.log"
        lines={createNumberedLines(50)}
        timestamps={createTimestamps(50)}
        maxVisibleLines={50}
      />,
    );
    const viewport = getByTestId("log-viewport");
    mockScrollableViewport(viewport, { scrollHeight: 900, clientHeight: 180 });

    expect(viewport.scrollTop).toBe(0);

    fireEvent.wheel(viewport, { deltaY: 120 });

    // The selected line advances by three lines (120 / 40 px-per-line)…
    expect(viewport.getAttribute("data-selected-line-number")).toBe("4");
    // …and, crucially, the text itself moves: the container is scrolled instead of
    // leaving the rendered content frozen while only the indicator moves.
    expect(viewport.scrollTop).toBeGreaterThan(0);
  });

  it("reaches the first and last loaded lines by scrolling and returns to the top (bug 5)", () => {
    const { getByTestId } = render(
      <VirtualLogViewport
        title="app.log"
        lines={createNumberedLines(50)}
        timestamps={createTimestamps(50)}
        maxVisibleLines={20}
      />,
    );
    const viewport = getByTestId("log-viewport");
    mockScrollableViewport(viewport, { scrollHeight: 1000, clientHeight: 200 });
    const maxScrollTop = 1000 - 200;

    fireEvent.wheel(viewport, { deltaY: 40 * 200 });

    expect(viewport.getAttribute("data-selected-line-number")).toBe("50");
    expect(viewport.querySelector('[data-line-number="50"]')).not.toBeNull();
    expect(Math.round(viewport.scrollTop)).toBe(maxScrollTop);

    fireEvent.wheel(viewport, { deltaY: -40 * 200 });

    expect(viewport.getAttribute("data-selected-line-number")).toBe("1");
    expect(viewport.querySelector('[data-line-number="1"]')).not.toBeNull();
    expect(viewport.scrollTop).toBe(0);
  });

  it("keeps the selected line and sync anchor in step with scrollbar dragging (bug 5)", () => {
    const onTimeAnchorChange = vi.fn();
    const timestamps = createTimestamps(50);
    const { getByTestId } = render(
      <VirtualLogViewport
        title="app.log"
        lines={createNumberedLines(50)}
        timestamps={timestamps}
        maxVisibleLines={50}
        onTimeAnchorChange={onTimeAnchorChange}
      />,
    );
    const viewport = getByTestId("log-viewport");
    mockScrollableViewport(viewport, { scrollHeight: 1000, clientHeight: 200 });

    viewport.scrollTop = 800; // drag the scrollbar to the bottom
    fireEvent.scroll(viewport);

    expect(viewport.getAttribute("data-selected-line-number")).toBe("50");
    expect(onTimeAnchorChange).toHaveBeenLastCalledWith(50, timestamps[49]);
  });

  it("moves the selected line with arrow keys and keeps horizontal arrows wired to the scroller", () => {
    const onTimeAnchorChange = vi.fn();
    const timestamps = createTimestamps(5);
    const { getByTestId, getByLabelText } = render(
      <div
        aria-label="Horizontal log scroller for app.log"
        className="crosslog-log-scroller"
        role="region"
      >
        <VirtualLogViewport
          title="app.log"
          lines={createNumberedLines(5)}
          timestamps={timestamps}
          maxVisibleLines={5}
          onTimeAnchorChange={onTimeAnchorChange}
        />
      </div>,
    );
    const viewport = getByTestId("log-viewport");
    const scroller = getByLabelText("Horizontal log scroller for app.log");

    fireEvent.keyDown(viewport, { key: "ArrowDown" });
    fireEvent.keyDown(viewport, { key: "ArrowRight" });

    expect(viewport.getAttribute("data-selected-line-number")).toBe("2");
    expect(viewport.getAttribute("data-last-navigation")).toBe("keyboard");
    expect(viewport.querySelector('[data-line-number="2"]')?.getAttribute("data-selected-line")).toBe("true");
    expect(scroller.scrollLeft).toBe(40);
    expect(onTimeAnchorChange).toHaveBeenLastCalledWith(2, timestamps[1]);
  });

  it("renders search matches as inline text spans instead of row highlights", () => {
    const { container } = render(
      <VirtualLogViewport
        title="app.log"
        lines={["2026-06-16T09:00:00.000Z ERROR failed hard"]}
        maxVisibleLines={5}
        searchHighlightsVisible
        searchMatches={[{ lineNumber: 1, range: { start: 25, end: 30 } }]}
        activeSearchMatchLineNumber={1}
      />,
    );
    const row = container.querySelector('[data-line-number="1"]');
    const highlight = row?.querySelector('[data-search-highlight="true"]');

    expect(row?.hasAttribute("data-search-match")).toBe(false);
    expect(highlight?.textContent).toBe("ERROR");
    expect(highlight?.getAttribute("data-active-search-highlight")).toBe("true");
  });

  it("hides search highlight spans while keeping inert line text rendered", () => {
    const { container } = render(
      <VirtualLogViewport
        title="app.log"
        lines={["2026-06-16T09:00:00.000Z ERROR failed hard"]}
        maxVisibleLines={5}
        searchHighlightsVisible={false}
        searchMatches={[{ lineNumber: 1, range: { start: 25, end: 30 } }]}
        activeSearchMatchLineNumber={1}
      />,
    );
    const row = container.querySelector('[data-line-number="1"]');

    expect(row?.querySelector('[data-search-highlight="true"]')).toBeNull();
    expect(row?.textContent).toContain("ERROR failed hard");
  });
});

function createNumberedLines(count: number): readonly string[] {
  return Array.from({ length: count }, (_, index) => `2026-06-16T09:00:00.000Z line ${index + 1}`);
}

function createTimestamps(count: number): readonly Date[] {
  return Array.from({ length: count }, (_, index) => new Date(2026, 5, 16, 9, 0, index));
}

// jsdom does not lay out elements, so scrollHeight/clientHeight are always 0 and
// scrollTop cannot move. Emulate an overflowing viewport so the scroll-driven
// text movement can be observed in unit tests.
function mockScrollableViewport(
  element: HTMLElement,
  { scrollHeight, clientHeight }: { scrollHeight: number; clientHeight: number },
): void {
  Object.defineProperty(element, "scrollHeight", { configurable: true, value: scrollHeight });
  Object.defineProperty(element, "clientHeight", { configurable: true, value: clientHeight });
}
