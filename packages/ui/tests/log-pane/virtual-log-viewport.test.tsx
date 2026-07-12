import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
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

  it("renders only supplied log lines without title-based placeholder content", () => {
    const { container } = render(
      <VirtualLogViewport
        title="idea.2.log"
        lines={["2026-04-17 13:31:44,051 REAL restored file content"]}
        maxVisibleLines={5}
      />,
    );

    expect(container.textContent).toContain("REAL restored file content");
    expect(container.textContent).not.toContain("2026-06-16T09:00:09.000Z idea.2.log line 10");
  });

  it("applies horizontal scrolling to rows while keeping the viewport fixed", () => {
    const { container, getByTestId } = render(
      <VirtualLogViewport
        title="wide.log"
        lines={["2026-06-16T09:00:00.000Z wide content"]}
        horizontalScrollLeft={96}
        horizontalContentWidth={1_200}
        maxVisibleLines={5}
      />,
    );
    const viewport = getByTestId("log-viewport");
    const row = container.querySelector<HTMLElement>('[data-line-number="1"]');

    expect(viewport.classList.contains("crosslog-log-viewport")).toBe(true);
    expect(row?.style.transform).toBe("translateX(-96px)");
    expect(row?.style.inlineSize).toBe("1176px");
  });

  it("moves the selected line with native vertical scrolling and emits a sync anchor", () => {
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

    scrollViewportToLine(viewport, 7);

    expect(viewport.getAttribute("data-selected-line-number")).toBe("7");
    expect(viewport.getAttribute("data-last-navigation")).toBe("wheel");
    expect(onTimeAnchorChange).toHaveBeenLastCalledWith(7, timestamps[6], 0, "wheel");
  });

  it("keeps an explicitly selected line anchored while native scrolling moves its visual position", () => {
    const onTimeAnchorChange = vi.fn();
    const timestamps = createTimestamps(40);
    const { getByTestId } = render(
      <VirtualLogViewport
        title="app.log"
        lines={createNumberedLines(40)}
        timestamps={timestamps}
        maxVisibleLines={40}
        onTimeAnchorChange={onTimeAnchorChange}
      />,
    );
    const viewport = getByTestId("log-viewport");
    mockScrollableViewport(viewport, { scrollHeight: 736, clientHeight: 200 });

    fireEvent.click(viewport.querySelector('[data-line-number="10"]')!);
    viewport.scrollTop = 4 * 18;
    fireEvent.scroll(viewport);

    expect(viewport.getAttribute("data-selected-line-number")).toBe("10");
    expect(viewport.querySelector('[data-line-number="10"]')?.getAttribute("data-selected-line")).toBe(
      "true",
    );
    expect(onTimeAnchorChange).toHaveBeenLastCalledWith(10, timestamps[9], 5, "wheel");
  });

  it("places a synchronized target at the requested visual row", async () => {
    const { getByTestId, rerender } = render(
      <VirtualLogViewport
        title="service.log"
        lines={createNumberedLines(50)}
        timestamps={createTimestamps(50)}
        maxVisibleLines={20}
      />,
    );
    const viewport = getByTestId("log-viewport");
    mockScrollableViewport(viewport, { scrollHeight: 916, clientHeight: 200 });

    rerender(
      <VirtualLogViewport
        title="service.log"
        lines={createNumberedLines(50)}
        timestamps={createTimestamps(50)}
        maxVisibleLines={20}
        synchronizationTargetLineNumber={20}
        synchronizationTargetVisualLineOffset={8}
      />,
    );

    await waitFor(() => expect(viewport.scrollTop).toBe(198));
    expect(viewport.querySelector('[data-line-number="20"]')?.getAttribute("data-sync-target")).toBe(
      "true",
    );
  });

  it("advances the rendered text by following native vertical scroll (bug 5)", () => {
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

    scrollViewportToLine(viewport, 4);

    expect(viewport.getAttribute("data-selected-line-number")).toBe("4");
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
    const maxScrollTop = getExpectedVirtualMaxScrollTop(50, 200);

    scrollViewportToBottom(viewport);

    expect(viewport.getAttribute("data-selected-line-number")).toBe("50");
    expect(viewport.querySelector('[data-line-number="50"]')).not.toBeNull();
    expect(Math.round(viewport.scrollTop)).toBe(maxScrollTop);

    scrollViewportToTop(viewport);

    expect(viewport.getAttribute("data-selected-line-number")).toBe("1");
    expect(viewport.querySelector('[data-line-number="1"]')).not.toBeNull();
    expect(viewport.scrollTop).toBe(0);
  });

  it("keeps a large log populated while scrolling beyond the rendered window", () => {
    const lineCount = 10_000;
    const { getByTestId } = render(
      <VirtualLogViewport
        title="large.log"
        lines={createNumberedLines(lineCount)}
        timestamps={createTimestamps(lineCount)}
        maxVisibleLines={400}
      />,
    );
    const viewport = getByTestId("log-viewport");
    mockScrollableViewport(viewport, { scrollHeight: 7_216, clientHeight: 200 });

    scrollViewportToLine(viewport, 5_001);

    const renderedRows = viewport.querySelectorAll(".crosslog-log-viewport__row");
    const firstRenderedLineNumber = Number(renderedRows[0]?.getAttribute("data-line-number"));
    const lastRenderedLineNumber = Number(renderedRows[renderedRows.length - 1]?.getAttribute("data-line-number"));

    expect(viewport.getAttribute("data-selected-line-number")).toBe("5001");
    expect(renderedRows.length).toBe(400);
    expect(firstRenderedLineNumber).toBeLessThanOrEqual(5001);
    expect(lastRenderedLineNumber).toBeGreaterThanOrEqual(5001);
    expect(viewport.scrollTop).toBeGreaterThan(0);
    expect(viewport.scrollTop).toBeLessThan(getExpectedVirtualMaxScrollTop(lineCount, 200));
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
    expect(onTimeAnchorChange).toHaveBeenLastCalledWith(50, timestamps[49], 5, "wheel");
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
    expect(onTimeAnchorChange).toHaveBeenLastCalledWith(2, timestamps[1], 0, "keyboard");
  });

  it("renders search matches as inline text spans instead of row highlights", () => {
    const { container } = render(
      <VirtualLogViewport
        title="app.log"
        lines={["2026-06-16T09:00:00.000Z ERROR failed hard"]}
        maxVisibleLines={5}
        searchHighlightsVisible
        searchMatches={[{ lineNumber: 1, range: { start: 25, end: 30 } }]}
        activeSearchMatch={{ lineNumber: 1, range: { start: 25, end: 30 } }}
      />,
    );
    const row = container.querySelector('[data-line-number="1"]');
    const highlight = row?.querySelector('[data-search-highlight="true"]');

    expect(row?.hasAttribute("data-search-match")).toBe(false);
    expect(highlight?.textContent).toBe("ERROR");
    expect(highlight?.getAttribute("data-active-search-highlight")).toBe("true");
  });

  it("renders syntax tokens inline without coloring the entire row", () => {
    const { container } = render(
      <VirtualLogViewport
        title="app.log"
        lines={[
          '2026-06-16T09:00:00.000Z WARN #c.i.p.i.b.AppStarter worker=release pid=93762 path=/var/log/app.log message="slow request"',
        ]}
        maxVisibleLines={5}
      />,
    );
    const row = container.querySelector('[data-line-number="1"]');

    expect(row?.hasAttribute("data-severity")).toBe(false);
    expect(row?.querySelector('[data-log-token-kind="timestamp"]')?.textContent).toBe("2026-06-16T09:00:00.000Z");
    expect(row?.querySelector('[data-log-token-kind="severity"]')?.textContent).toBe("WARN");
    expect(row?.querySelector('[data-log-token-kind="qualified"]')?.textContent).toBe("#c.i.p.i.b.AppStarter");
    expect(row?.querySelector('[data-log-token-kind="property"]')?.textContent).toBe("worker");
    expect(row?.querySelector('[data-log-token-kind="number"]')?.textContent).toBe("93762");
    expect(row?.querySelector('[data-log-token-kind="path"]')?.textContent).toBe("/var/log/app.log");
    expect(row?.querySelector('[data-log-token-kind="string"]')?.textContent).toBe('"slow request"');
  });

  it("renders jetbrains stacktrace rows as a dedicated inline token", () => {
    const line = "\tat com.intellij.ide.ReopenProjectAction.<init>(ReopenProjectAction.kt:64)";
    const { container } = render(
      <VirtualLogViewport
        title="idea.log"
        lines={[line]}
        maxVisibleLines={5}
      />,
    );
    const row = container.querySelector('[data-line-number="1"]');

    expect(row?.querySelector('[data-log-token-kind="stacktrace"]')?.textContent).toBe(line);
  });

  it("preserves full row text content when property tokens end before a colon", () => {
    const line =
      "2026-04-17 13:31:44,051 WARN Suppressed a frequent exception logged for the 2nd time: write beyond end of stream";
    const { container } = render(
      <VirtualLogViewport
        title="idea.3.log"
        lines={[line]}
        maxVisibleLines={5}
      />,
    );
    const row = container.querySelector('[data-line-number="1"]');

    expect(row?.querySelector('[data-log-token-kind="property"]')?.textContent).toBe("time");
    expect(row?.textContent).toContain(line);
  });

  it("hides search highlight spans while keeping inert line text rendered", () => {
    const { container } = render(
      <VirtualLogViewport
        title="app.log"
        lines={["2026-06-16T09:00:00.000Z ERROR failed hard"]}
        maxVisibleLines={5}
        searchHighlightsVisible={false}
        searchMatches={[{ lineNumber: 1, range: { start: 25, end: 30 } }]}
        activeSearchMatch={{ lineNumber: 1, range: { start: 25, end: 30 } }}
      />,
    );
    const row = container.querySelector('[data-line-number="1"]');

    expect(row?.querySelector('[data-search-highlight="true"]')).toBeNull();
    expect(row?.textContent).toContain("ERROR failed hard");
  });

  it("changes only the active highlight when the next search match is already visible", async () => {
    const lines = [
      "line 1 before visible-target after",
      "line 2 before visible-target after",
      "line 3 before visible-target after",
    ];
    const firstMatch = createSearchMatch(lines[0]!, 1, "visible-target");
    const secondMatch = createSearchMatch(lines[1]!, 2, "visible-target");
    const { getByTestId, rerender } = render(
      <div aria-label="Horizontal log scroller for app.log" className="crosslog-log-scroller" role="region">
        <VirtualLogViewport
          title="app.log"
          lines={lines}
          maxVisibleLines={5}
          searchHighlightsVisible
          searchMatches={[firstMatch, secondMatch]}
          activeSearchMatch={firstMatch}
        />
      </div>,
    );
    const viewport = getByTestId("log-viewport");
    const scroller = viewport.closest(".crosslog-log-scroller") as HTMLElement;
    const restoreGeometry = mockSearchNavigationGeometry(viewport, scroller);

    try {
      rerender(
        <div aria-label="Horizontal log scroller for app.log" className="crosslog-log-scroller" role="region">
          <VirtualLogViewport
            title="app.log"
            lines={lines}
            maxVisibleLines={5}
            searchHighlightsVisible
            searchMatches={[firstMatch, secondMatch]}
            activeSearchMatch={secondMatch}
          />
        </div>,
      );

      await waitFor(() =>
        expect(viewport.querySelector('[data-active-search-highlight="true"]')?.textContent).toBe("visible-target"),
      );
      expect(viewport.scrollTop).toBe(0);
      expect(scroller.scrollLeft).toBe(0);
      expect(viewport.querySelector('[data-line-number="2"] [data-active-search-highlight="true"]')).not.toBeNull();
    } finally {
      restoreGeometry();
    }
  });

  it("keeps vertical position and centers horizontally when the active search line is already visible", async () => {
    const lines = [
      "line 1",
      `${"x".repeat(180)}wide-target after`,
      "line 3",
    ];
    const activeMatch = createSearchMatch(lines[1]!, 2, "wide-target");
    const { getByTestId, rerender } = render(
      <div aria-label="Horizontal log scroller for app.log" className="crosslog-log-scroller" role="region">
        <VirtualLogViewport
          title="app.log"
          lines={lines}
          maxVisibleLines={5}
          searchHighlightsVisible
          searchMatches={[activeMatch]}
          activeSearchMatch={null}
        />
      </div>,
    );
    const viewport = getByTestId("log-viewport");
    const scroller = viewport.closest(".crosslog-log-scroller") as HTMLElement;
    const restoreGeometry = mockSearchNavigationGeometry(viewport, scroller);

    try {
      viewport.scrollTop = 0;
      rerender(
        <div aria-label="Horizontal log scroller for app.log" className="crosslog-log-scroller" role="region">
          <VirtualLogViewport
            title="app.log"
            lines={lines}
            maxVisibleLines={5}
            searchHighlightsVisible
            searchMatches={[activeMatch]}
            activeSearchMatch={activeMatch}
          />
        </div>,
      );

      await waitFor(() => expect(scroller.scrollLeft).toBeGreaterThan(0));
      expect(viewport.scrollTop).toBe(0);
    } finally {
      restoreGeometry();
    }
  });

  it("centers the active search match both vertically and horizontally when it starts outside the viewport", async () => {
    const lines = Array.from({ length: 20 }, (_, index) =>
      index === 14 ? `${"x".repeat(180)}wide-target after` : `line ${index + 1}`,
    );
    const activeMatch = createSearchMatch(lines[14]!, 15, "wide-target");
    const { getByTestId, rerender } = render(
      <div aria-label="Horizontal log scroller for app.log" className="crosslog-log-scroller" role="region">
        <VirtualLogViewport
          title="app.log"
          lines={lines}
          maxVisibleLines={20}
          searchHighlightsVisible
          searchMatches={[activeMatch]}
          activeSearchMatch={null}
        />
      </div>,
    );
    const viewport = getByTestId("log-viewport");
    const scroller = viewport.closest(".crosslog-log-scroller") as HTMLElement;
    const restoreGeometry = mockSearchNavigationGeometry(viewport, scroller);

    try {
      rerender(
        <div aria-label="Horizontal log scroller for app.log" className="crosslog-log-scroller" role="region">
          <VirtualLogViewport
            title="app.log"
            lines={lines}
            maxVisibleLines={20}
            searchHighlightsVisible
            searchMatches={[activeMatch]}
            activeSearchMatch={activeMatch}
          />
        </div>,
      );

      await waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(0));
      expect(scroller.scrollLeft).toBeGreaterThan(0);

      const row = viewport.querySelector<HTMLElement>('[data-line-number="15"]');
      const highlight = viewport.querySelector<HTMLElement>('[data-active-search-highlight="true"]');

      expect(row).not.toBeNull();
      expect(highlight).not.toBeNull();

      const viewportRect = viewport.getBoundingClientRect();
      const rowRect = row!.getBoundingClientRect();
      const highlightRect = highlight!.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();

      expect(Math.abs(rowRect.top + rowRect.height / 2 - (viewportRect.top + viewport.clientHeight / 2))).toBeLessThanOrEqual(12);
      expect(
        Math.abs(highlightRect.left + highlightRect.width / 2 - (scrollerRect.left + scroller.clientWidth / 2)),
      ).toBeLessThanOrEqual(12);
    } finally {
      restoreGeometry();
    }
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

function scrollViewportToLine(element: HTMLElement, lineNumber: number): void {
  element.scrollTop = lineNumber <= 1 ? 0 : 8 + (lineNumber - 1) * 18;
  fireEvent.scroll(element);
}

function scrollViewportToBottom(element: HTMLElement): void {
  const lineCount = Number(element.getAttribute("data-line-count") ?? 0);

  element.scrollTop = getExpectedVirtualMaxScrollTop(lineCount, element.clientHeight);
  fireEvent.scroll(element);
}

function scrollViewportToTop(element: HTMLElement): void {
  element.scrollTop = 0;
  fireEvent.scroll(element);
}

function getExpectedVirtualMaxScrollTop(lineCount: number, clientHeight: number): number {
  return 8 * 2 + lineCount * 18 - clientHeight;
}

function createSearchMatch(text: string, lineNumber: number, needle: string) {
  const start = text.indexOf(needle);

  if (start < 0) {
    throw new Error(`Missing ${needle} in line ${lineNumber}.`);
  }

  return {
    lineNumber,
    range: {
      start,
      end: start + needle.length,
    },
  };
}

function mockSearchNavigationGeometry(viewport: HTMLElement, scroller: HTMLElement): () => void {
  Object.defineProperty(viewport, "clientHeight", { configurable: true, value: 200 });
  Object.defineProperty(scroller, "clientWidth", { configurable: true, value: 320 });
  Object.defineProperty(scroller, "scrollWidth", { configurable: true, value: 2_400 });
  Object.defineProperty(viewport, "scrollHeight", {
    configurable: true,
    value: 16 + Number(viewport.getAttribute("data-line-count") ?? 0) * 18,
  });

  const rectSpy = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function () {
    if (this === viewport || this === scroller) {
      return createRect({ left: 40, top: 60, width: 320, height: 200 });
    }

    if (this.classList.contains("crosslog-log-viewport__row")) {
      const lineNumber = Number(this.getAttribute("data-line-number") ?? 1);
      const top = 60 + 8 + (lineNumber - 1) * 18 - viewport.scrollTop;

      return createRect({ left: 52, top, width: 2_000, height: 18 });
    }

    if (this.getAttribute("data-search-highlight") === "true") {
      const row = this.closest<HTMLElement>(".crosslog-log-viewport__row");
      const lineNumber = Number(row?.getAttribute("data-line-number") ?? 1);
      const matchStart = Number(this.getAttribute("data-match-start") ?? 0);
      const matchEnd = Number(this.getAttribute("data-match-end") ?? matchStart);
      const top = 60 + 8 + (lineNumber - 1) * 18 - viewport.scrollTop;
      const left = 52 + matchStart * 8 - scroller.scrollLeft;
      const width = Math.max(8, (matchEnd - matchStart) * 8);

      return createRect({ left, top, width, height: 18 });
    }

    return createRect({ left: 0, top: 0, width: 0, height: 0 });
  });

  return () => rectSpy.mockRestore();
}

function createRect({
  left,
  top,
  width,
  height,
}: {
  left: number;
  top: number;
  width: number;
  height: number;
}): DOMRect {
  return {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
  } as DOMRect;
}
