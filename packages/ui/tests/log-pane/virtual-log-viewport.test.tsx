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
});

function createNumberedLines(count: number): readonly string[] {
  return Array.from({ length: count }, (_, index) => `2026-06-16T09:00:00.000Z line ${index + 1}`);
}

function createTimestamps(count: number): readonly Date[] {
  return Array.from({ length: count }, (_, index) => new Date(2026, 5, 16, 9, 0, index));
}
