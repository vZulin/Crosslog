import React from "react";
import { flushSync } from "react-dom";
import type { SearchMatch } from "@crosslog/core";
import { redesignedShellTestIds } from "../app-shell/testIds";
import type { LogSyntaxToken } from "./logSyntaxHighlighting";
import { resolveLogSeverityLevel, tokenizeLogLineSyntax } from "./logSyntaxHighlighting";

export interface VisibleLogLine {
  readonly lineNumber: number;
  readonly text: string;
  readonly timestamp: Date | null;
}

export type LogViewportNavigationKind = "click" | "keyboard" | "wheel";

export interface VirtualLogViewportProps {
  readonly title: string;
  readonly lines: readonly string[];
  readonly timestamps?: readonly (Date | null)[];
  readonly searchMatches?: readonly SearchMatch[];
  readonly searchHighlightsVisible?: boolean;
  readonly activeSearchMatch?: SearchMatch | null;
  readonly maxVisibleLines?: number;
  readonly synchronizationTargetLineNumber?: number | null;
  readonly synchronizationTargetVisualLineOffset?: number | null;
  readonly onTimeAnchorChange?: (
    lineNumber: number,
    timestamp: Date | null,
    visualLineOffset: number,
    navigationKind: LogViewportNavigationKind,
  ) => void;
  readonly timeAnchorChangeThrottleMs?: number;
  readonly horizontalScrollLeft?: number;
  readonly horizontalContentWidth?: number;
  readonly onUiTestNavigationEvidenceChange?: () => void;
}

interface PendingVerticalScrollUpdate {
  readonly nextLineNumber: number;
  readonly nextFirstVisibleLineNumber: number | null;
  readonly anchorLineNumber: number;
  readonly anchorVisualLineOffset: number;
}

interface PendingTimeAnchorChange {
  readonly lineNumber: number;
  readonly timestamp: Date | null;
  readonly visualLineOffset: number;
  readonly navigationKind: LogViewportNavigationKind;
}

type ScrollDirection = "backward" | "forward";

export function createVisibleLogLineWindow(
  lines: readonly string[],
  maxVisibleLines = 120,
  timestamps: readonly (Date | null)[] = [],
  targetLineNumber: number | null = null,
  firstVisibleLineNumber: number | null = null,
): readonly VisibleLogLine[] {
  const startIndex = getVisibleWindowStartIndex(
    lines.length,
    maxVisibleLines,
    targetLineNumber,
    firstVisibleLineNumber,
  );

  return lines.slice(startIndex, startIndex + maxVisibleLines).map((line, index) => ({
    lineNumber: startIndex + index + 1,
    text: line,
    timestamp: timestamps[startIndex + index] ?? null,
  }));
}

export function VirtualLogViewport({
  title,
  lines,
  timestamps,
  searchMatches = [],
  searchHighlightsVisible = false,
  activeSearchMatch = null,
  maxVisibleLines,
  synchronizationTargetLineNumber,
  synchronizationTargetVisualLineOffset,
  onTimeAnchorChange,
  timeAnchorChangeThrottleMs = 0,
  horizontalScrollLeft = 0,
  horizontalContentWidth,
  onUiTestNavigationEvidenceChange,
}: VirtualLogViewportProps) {
  const visibleLineCapacity = Math.max(1, Math.min(maxVisibleLines ?? 120, Math.max(lines.length, 1)));
  const searchMatchesByLineNumber = React.useMemo(
    () => groupSearchMatchesByLineNumber(searchHighlightsVisible ? searchMatches : []),
    [searchHighlightsVisible, searchMatches],
  );
  const activeSearchMatchLineNumber = activeSearchMatch?.lineNumber ?? null;
  const targetLineNumber = activeSearchMatchLineNumber ?? synchronizationTargetLineNumber ?? null;
  const targetVisualLineOffset = normalizeVisualLineOffset(synchronizationTargetVisualLineOffset);
  const [selectedLineNumber, setSelectedLineNumber] = React.useState(() =>
    clampLineNumber(targetLineNumber ?? 1, lines.length),
  );
  const [firstVisibleLineNumber, setFirstVisibleLineNumber] = React.useState(() =>
    getVisibleWindowStartIndex(lines.length, visibleLineCapacity, targetLineNumber, null) + 1,
  );
  const [lastNavigation, setLastNavigation] = React.useState<"none" | "click" | "keyboard" | "wheel">("none");
  const viewportRef = React.useRef<HTMLOListElement | null>(null);
  // Keep syntax work outside the scroll commit's hot path for rows that remain in the window.
  const syntaxTokenCacheRef = React.useRef<Map<string, readonly LogSyntaxToken[]>>(new Map());
  const selectedLineNumberRef = React.useRef(selectedLineNumber);
  const selectionLockedRef = React.useRef(false);
  const pendingVerticalScrollUpdateRef = React.useRef<PendingVerticalScrollUpdate | null>(null);
  const cancelVerticalScrollFrameRef = React.useRef<(() => void) | null>(null);
  const pendingTimeAnchorChangeRef = React.useRef<PendingTimeAnchorChange | null>(null);
  const timeAnchorChangeTimeoutRef = React.useRef<number | null>(null);
  // Guards only the exact scroll event caused by our own imperative scroll.
  // A stale boolean would incorrectly swallow the next user scroll if the
  // browser does not dispatch a programmatic scroll event.
  const suppressedScrollTopRef = React.useRef<number | null>(null);
  // Set whenever a navigation should pull the rendered text to the selected line.
  const pendingScrollToSelectionRef = React.useRef<{
    readonly lineNumber: number;
    readonly visualLineOffset: number | null;
  } | null>(null);
  const pendingSearchMatchRef = React.useRef<{
    readonly lineNumber: number;
    readonly range: SearchMatch["range"];
    readonly centerHorizontally: boolean | null;
    readonly centerVertically: boolean | null;
  } | null>(null);
  const previousScrollTopRef = React.useRef(0);
  const previousScrollDirectionRef = React.useRef<ScrollDirection | null>(null);

  selectedLineNumberRef.current = selectedLineNumber;

  const viewportStateRef = React.useRef({
    lineCount: lines.length,
    timestamps,
    onTimeAnchorChange,
    timeAnchorChangeThrottleMs,
    visibleLineCapacity,
  });
  viewportStateRef.current = {
    lineCount: lines.length,
    timestamps,
    onTimeAnchorChange,
    visibleLineCapacity,
  };

  const queueTimeAnchorChange = React.useCallback((change: PendingTimeAnchorChange) => {
    pendingTimeAnchorChangeRef.current = change;

    if (viewportStateRef.current.timeAnchorChangeThrottleMs <= 0) {
      pendingTimeAnchorChangeRef.current = null;
      viewportStateRef.current.onTimeAnchorChange?.(
        change.lineNumber,
        change.timestamp,
        change.visualLineOffset,
        change.navigationKind,
      );
      return;
    }

    if (timeAnchorChangeTimeoutRef.current !== null) {
      return;
    }

    timeAnchorChangeTimeoutRef.current = globalThis.setTimeout(() => {
      timeAnchorChangeTimeoutRef.current = null;
      const pendingChange = pendingTimeAnchorChangeRef.current;
      pendingTimeAnchorChangeRef.current = null;

      if (!pendingChange) {
        return;
      }

      viewportStateRef.current.onTimeAnchorChange?.(
        pendingChange.lineNumber,
        pendingChange.timestamp,
        pendingChange.visualLineOffset,
        pendingChange.navigationKind,
      );
    }, viewportStateRef.current.timeAnchorChangeThrottleMs);
  }, []);

  const applyPendingVerticalScrollUpdate = React.useCallback(() => {
    cancelVerticalScrollFrameRef.current = null;

    const pendingUpdate = pendingVerticalScrollUpdateRef.current;

    if (!pendingUpdate) {
      return;
    }

    pendingVerticalScrollUpdateRef.current = null;
    const currentState = viewportStateRef.current;

    // Commit the local window before the browser paints the next frame. React 19
    // may otherwise defer a state update scheduled from requestAnimationFrame,
    // leaving the native scroll position ahead of the rendered absolute rows.
    // The parent synchronization callback intentionally stays outside flushSync
    // so scrolling does not synchronously flush the application shell.
    flushSync(() => {
      setFirstVisibleLineNumber((currentFirstVisibleLineNumber) =>
        pendingUpdate.nextFirstVisibleLineNumber ??
        keepLineVisible(
          pendingUpdate.anchorLineNumber,
          currentFirstVisibleLineNumber,
          currentState.visibleLineCapacity,
          currentState.lineCount,
        ),
      );

      if (!selectionLockedRef.current) {
        selectedLineNumberRef.current = pendingUpdate.nextLineNumber;
        setSelectedLineNumber((currentSelectedLineNumber) =>
          currentSelectedLineNumber === pendingUpdate.nextLineNumber
            ? currentSelectedLineNumber
            : pendingUpdate.nextLineNumber,
        );
      }

      setLastNavigation("wheel");
    });

    queueTimeAnchorChange({
      lineNumber: pendingUpdate.anchorLineNumber,
      timestamp: currentState.timestamps?.[pendingUpdate.anchorLineNumber - 1] ?? null,
      visualLineOffset: pendingUpdate.anchorVisualLineOffset,
      navigationKind: "wheel",
    });
  }, [queueTimeAnchorChange]);

  const scheduleVerticalScrollUpdate = React.useCallback(() => {
    if (cancelVerticalScrollFrameRef.current !== null) {
      return;
    }

    cancelVerticalScrollFrameRef.current = scheduleAnimationFrame(applyPendingVerticalScrollUpdate);
  }, [applyPendingVerticalScrollUpdate]);

  React.useEffect(
    () => () => {
      cancelVerticalScrollFrameRef.current?.();
      cancelVerticalScrollFrameRef.current = null;
      pendingVerticalScrollUpdateRef.current = null;
      if (timeAnchorChangeTimeoutRef.current !== null) {
        globalThis.clearTimeout(timeAnchorChangeTimeoutRef.current);
        timeAnchorChangeTimeoutRef.current = null;
      }
      pendingTimeAnchorChangeRef.current = null;
    },
    [],
  );

  React.useLayoutEffect(() => {
    if (!activeSearchMatch) {
      return;
    }

    const safeTargetLineNumber = clampLineNumber(activeSearchMatch.lineNumber, lines.length);

    selectionLockedRef.current = true;
    selectedLineNumberRef.current = safeTargetLineNumber;
    setSelectedLineNumber(safeTargetLineNumber);
    setFirstVisibleLineNumber((currentFirstLineNumber) =>
      ensureLineIsRendered(
        currentFirstLineNumber,
        visibleLineCapacity,
        safeTargetLineNumber,
        lines.length,
      ),
    );
    pendingSearchMatchRef.current = {
      lineNumber: safeTargetLineNumber,
      range: activeSearchMatch.range,
      centerHorizontally: null,
      centerVertically: null,
    };
  }, [activeSearchMatch, lines.length, visibleLineCapacity]);

  React.useLayoutEffect(() => {
    if (activeSearchMatchLineNumber !== null) {
      return;
    }

    if (!synchronizationTargetLineNumber) {
      return;
    }

    const safeTargetLineNumber = clampLineNumber(synchronizationTargetLineNumber, lines.length);

    selectionLockedRef.current = true;
    selectedLineNumberRef.current = safeTargetLineNumber;
    setSelectedLineNumber(safeTargetLineNumber);
    setFirstVisibleLineNumber((currentFirstLineNumber) =>
      getFirstVisibleLineNumberForTarget(
        lines.length,
        visibleLineCapacity,
        safeTargetLineNumber,
        targetVisualLineOffset,
        currentFirstLineNumber,
      ),
    );
    pendingScrollToSelectionRef.current = {
      lineNumber: safeTargetLineNumber,
      visualLineOffset: targetVisualLineOffset,
    };
  }, [
    activeSearchMatchLineNumber,
    lines.length,
    synchronizationTargetLineNumber,
    targetVisualLineOffset,
    visibleLineCapacity,
  ]);

  React.useEffect(() => {
    const safeSelectedLineNumber = clampLineNumber(selectedLineNumber, lines.length);

    if (safeSelectedLineNumber !== selectedLineNumber) {
      selectedLineNumberRef.current = safeSelectedLineNumber;
      setSelectedLineNumber(safeSelectedLineNumber);
    }

    if (!selectionLockedRef.current) {
      setFirstVisibleLineNumber((currentFirstLineNumber) =>
        keepLineVisible(
          safeSelectedLineNumber,
          currentFirstLineNumber,
          visibleLineCapacity,
          lines.length,
        ),
      );
    }
  }, [lines.length, selectedLineNumber, visibleLineCapacity]);

  // Drive the rendered text position from the selected line: a navigation moves the
  // scroll offset so the text itself moves, instead of leaving the content frozen
  // while only the selection indicator advances (bug 5).
  React.useLayoutEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const pendingScroll = pendingScrollToSelectionRef.current;

    if (!pendingScroll) {
      return;
    }

    pendingScrollToSelectionRef.current = null;

    const nextScrollTop =
      pendingScroll.visualLineOffset === null
        ? scrollTopForLine(viewport, pendingScroll.lineNumber, lines.length)
        : scrollTopForLineAtVisualOffset(
            viewport,
            pendingScroll.lineNumber,
            pendingScroll.visualLineOffset,
            lines.length,
          );

    if (nextScrollTop === null || Math.abs(viewport.scrollTop - nextScrollTop) <= 1) {
      return;
    }

    suppressedScrollTopRef.current = nextScrollTop;
    viewport.scrollTop = nextScrollTop;
  }, [firstVisibleLineNumber, lines.length, selectedLineNumber, targetVisualLineOffset]);

  React.useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const pendingSearchMatch = pendingSearchMatchRef.current;

    if (!viewport || !pendingSearchMatch) {
      return;
    }

    const row = viewport.querySelector<HTMLElement>(`[data-line-number="${pendingSearchMatch.lineNumber}"]`);
    const activeHighlight = row?.querySelector<HTMLElement>(
      `[data-search-highlight="true"][data-match-start="${pendingSearchMatch.range.start}"][data-match-end="${pendingSearchMatch.range.end}"]`,
    );
    const scroller = viewport.closest<HTMLElement>(".crosslog-log-scroller");

    if (!row || !activeHighlight || !scroller) {
      return;
    }

    const lineVisibleVertically = isElementVisibleVerticallyWithinViewport(row, viewport);
    const matchVisibleHorizontally = isElementVisibleHorizontallyWithinScroller(activeHighlight, scroller);
    const centerVertically =
      pendingSearchMatch.centerVertically ?? !lineVisibleVertically;
    const centerHorizontally =
      pendingSearchMatch.centerHorizontally ?? (centerVertically || !matchVisibleHorizontally);

    if (!centerVertically && !centerHorizontally) {
      pendingSearchMatchRef.current = null;
      return;
    }

    if (centerVertically) {
      const nextScrollTop = getCenteredScrollTopForElement(viewport, row, lines.length);

      if (nextScrollTop !== null && Math.abs(viewport.scrollTop - nextScrollTop) > 1) {
        suppressedScrollTopRef.current = nextScrollTop;
        viewport.scrollTop = nextScrollTop;
      }
    }

    if (centerHorizontally) {
      const nextScrollLeft = getCenteredScrollLeftForElement(scroller, activeHighlight);

      if (nextScrollLeft !== null && Math.abs(scroller.scrollLeft - nextScrollLeft) > 1) {
        pendingSearchMatchRef.current = {
          ...pendingSearchMatch,
          centerHorizontally: true,
          centerVertically: false,
        };
        scroller.scrollLeft = nextScrollLeft;
        scroller.dispatchEvent(new Event("scroll", { bubbles: true }));
        return;
      }
    }

    pendingSearchMatchRef.current = null;
  }, [activeSearchMatch, firstVisibleLineNumber, horizontalScrollLeft, lines.length]);

  const handleScroll = (event: React.UIEvent<HTMLOListElement>) => {
    const suppressedScrollTop = suppressedScrollTopRef.current;

    if (suppressedScrollTop !== null) {
      suppressedScrollTopRef.current = null;

      if (Math.abs(event.currentTarget.scrollTop - suppressedScrollTop) <= 1) {
        return;
      }
    }

    if (lines.length <= 1) {
      return;
    }

    const viewport = event.currentTarget;
    const scrollTop = viewport.scrollTop;
    const scrollDirection: ScrollDirection =
      scrollTop >= previousScrollTopRef.current ? "forward" : "backward";
    previousScrollTopRef.current = scrollTop;
    const directionChanged =
      previousScrollDirectionRef.current !== null &&
      previousScrollDirectionRef.current !== scrollDirection;
    previousScrollDirectionRef.current = scrollDirection;
    const nextLineNumber = lineForScrollTop(event.currentTarget, lines.length);
    const nextFirstVisibleLineNumber = firstVisibleLineForScrollTop(
      scrollTop,
      visibleLineCapacity,
      lines.length,
      scrollDirection,
    );

    if (directionChanged && nextFirstVisibleLineNumber !== null) {
      // A directional window intentionally favors the previous movement. When
      // the user reverses direction, repair that bias immediately so the old
      // window cannot expose a blank edge before the next animation frame.
      flushSync(() => setFirstVisibleLineNumber(nextFirstVisibleLineNumber));
    }

    if (nextLineNumber === null) {
      return;
    }

    const anchorLineNumber = selectionLockedRef.current
      ? selectedLineNumberRef.current
      : nextLineNumber;
    const anchorVisualLineOffset = getVisualLineOffsetForScrollTop(anchorLineNumber, scrollTop);

    pendingVerticalScrollUpdateRef.current = {
      nextLineNumber,
      nextFirstVisibleLineNumber,
      anchorLineNumber,
      anchorVisualLineOffset,
    };

    scheduleVerticalScrollUpdate();
  };

  const visibleLines = createVisibleLogLineWindow(
    lines,
    visibleLineCapacity,
    timestamps,
    selectedLineNumber,
    firstVisibleLineNumber,
  );
  const syntaxTokensByLine = visibleLines.map((line) => {
    const cache = syntaxTokenCacheRef.current;
    const cachedTokens = cache.get(line.text);

    if (cachedTokens) {
      return cachedTokens;
    }

    const tokens = tokenizeLogLineSyntax(line.text);
    cache.set(line.text, tokens);

    if (cache.size > 2_048) {
      const oldestKey = cache.keys().next().value;

      if (oldestKey !== undefined) {
        cache.delete(oldestKey);
      }
    }

    return tokens;
  });
  const lineNumberDigitCount = getLineNumberDigitCount(lines.length);
  const virtualScrollHeightPx = getVirtualScrollHeight(lines.length);
  const rowInlineSizePx = Number.isFinite(horizontalContentWidth)
    ? Math.max(0, Math.round(horizontalContentWidth) - logViewportInlinePaddingPx * 2)
    : null;
  const rowHorizontalOffsetPx = Math.max(0, Math.round(horizontalScrollLeft));

  React.useLayoutEffect(() => {
    onUiTestNavigationEvidenceChange?.();
  }, [
    firstVisibleLineNumber,
    lastNavigation,
    lines.length,
    onUiTestNavigationEvidenceChange,
    selectedLineNumber,
    synchronizationTargetLineNumber,
    visibleLineCapacity,
  ]);

  const handleLineSelect = React.useCallback(
    (lineNumber: number, timestamp: Date | null) => {
      const viewport = viewportRef.current;
      const visualLineOffset = viewport
        ? getVisualLineOffsetForScrollTop(lineNumber, viewport.scrollTop)
        : 0;

      selectionLockedRef.current = true;
      selectedLineNumberRef.current = lineNumber;
      setSelectedLineNumber(lineNumber);
      setFirstVisibleLineNumber((currentFirstLineNumber) =>
        keepLineVisible(lineNumber, currentFirstLineNumber, visibleLineCapacity, lines.length),
      );
      setLastNavigation("click");
      onTimeAnchorChange?.(lineNumber, timestamp, visualLineOffset, "click");
    },
    [lines.length, onTimeAnchorChange, visibleLineCapacity],
  );

  const moveSelectedLine = React.useCallback(
    (delta: number, navigation: "keyboard" | "wheel") => {
      const viewport = viewportRef.current;

      setSelectedLineNumber((currentLineNumber) => {
        const nextLineNumber = clampLineNumber(currentLineNumber + delta, lines.length);
        const nextVisualLineOffset = getNextKeyboardVisualLineOffset(
          viewport,
          currentLineNumber,
          delta,
        );

        selectedLineNumberRef.current = nextLineNumber;
        setFirstVisibleLineNumber((currentFirstLineNumber) =>
          keepLineVisible(nextLineNumber, currentFirstLineNumber, visibleLineCapacity, lines.length),
        );
        setLastNavigation(navigation);
        selectionLockedRef.current = true;
        pendingScrollToSelectionRef.current = {
          lineNumber: nextLineNumber,
          visualLineOffset: nextVisualLineOffset,
        };
        onTimeAnchorChange?.(
          nextLineNumber,
          timestamps?.[nextLineNumber - 1] ?? null,
          nextVisualLineOffset ?? 0,
          navigation,
        );

        return nextLineNumber;
      });
    },
    [lines.length, onTimeAnchorChange, timestamps, visibleLineCapacity],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLOListElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveSelectedLine(1, "keyboard");
        break;
      case "ArrowUp":
        event.preventDefault();
        moveSelectedLine(-1, "keyboard");
        break;
      case "ArrowRight":
        event.preventDefault();
        moveHorizontalScroller(event.currentTarget, horizontalKeyboardStepPx);
        break;
      case "ArrowLeft":
        event.preventDefault();
        moveHorizontalScroller(event.currentTarget, -horizontalKeyboardStepPx);
        break;
    }
  };

  return (
    <ol
      aria-label={`Virtual log viewport for ${title}`}
      className="crosslog-log-viewport"
      data-gutter-digits={lineNumberDigitCount}
      data-last-navigation={lastNavigation}
      data-line-count={lines.length}
      data-selected-line-number={selectedLineNumber}
      data-testid={redesignedShellTestIds.logViewport}
      id={redesignedShellTestIds.logViewport}
      onKeyDown={handleKeyDown}
      onScroll={handleScroll}
      ref={viewportRef}
      style={
        {
          "--crosslog-line-number-digits": lineNumberDigitCount,
          "--crosslog-horizontal-scroll-left": `${rowHorizontalOffsetPx}px`,
        } as React.CSSProperties
      }
      tabIndex={0}
    >
      <li
        aria-hidden="true"
        className="crosslog-log-viewport__spacer"
        style={{ blockSize: virtualScrollHeightPx }}
      />
      {visibleLines.map((line, lineIndex) => {
        const selected = line.lineNumber === selectedLineNumber;
        const lineSearchMatches = searchMatchesByLineNumber.get(line.lineNumber) ?? emptySearchMatches;

        return (
          <LogViewportRow
            key={line.lineNumber}
            lineNumber={line.lineNumber}
            text={line.text}
            timestamp={line.timestamp}
            lineSearchMatches={lineSearchMatches}
            activeSearchMatch={activeSearchMatch}
            activeSearchMatchLineNumber={activeSearchMatchLineNumber}
            searchHighlightsVisible={searchHighlightsVisible}
            selected={selected}
            synchronizationTargetLineNumber={synchronizationTargetLineNumber}
            rowInlineSizePx={rowInlineSizePx}
            syntaxTokens={syntaxTokensByLine[lineIndex] ?? emptySyntaxTokens}
            onSelect={handleLineSelect}
          />
        );
      })}
    </ol>
  );
}

const horizontalKeyboardStepPx = 40;
const logViewportPaddingBlockPx = 8;
const logViewportRowHeightPx = 18;
const logViewportInlinePaddingPx = 12;
const emptySearchMatches: readonly SearchMatch[] = [];
const emptySyntaxTokens: readonly LogSyntaxToken[] = [];

interface LogViewportRowProps {
  readonly lineNumber: number;
  readonly text: string;
  readonly timestamp: Date | null;
  readonly lineSearchMatches: readonly SearchMatch[];
  readonly activeSearchMatch: SearchMatch | null;
  readonly activeSearchMatchLineNumber: number | null;
  readonly searchHighlightsVisible: boolean;
  readonly selected: boolean;
  readonly synchronizationTargetLineNumber?: number | null;
  readonly rowInlineSizePx: number | null;
  readonly syntaxTokens: readonly LogSyntaxToken[];
  readonly onSelect: (lineNumber: number, timestamp: Date | null) => void;
}

const LogViewportRow = React.memo(function LogViewportRow({
  lineNumber,
  text,
  timestamp,
  lineSearchMatches,
  activeSearchMatch,
  activeSearchMatchLineNumber,
  searchHighlightsVisible,
  selected,
  synchronizationTargetLineNumber,
  rowInlineSizePx,
  syntaxTokens,
  onSelect,
}: LogViewportRowProps) {
  const lineTopPx = logViewportPaddingBlockPx + (lineNumber - 1) * logViewportRowHeightPx;

  return (
    <li
      className="crosslog-log-viewport__row"
      data-line-number={lineNumber}
      data-active-search-match={
        searchHighlightsVisible && lineNumber === activeSearchMatchLineNumber ? "true" : "false"
      }
      data-selected-line={selected ? "true" : "false"}
      data-sync-target={lineNumber === synchronizationTargetLineNumber ? "true" : "false"}
      style={getRowStyle(lineTopPx, rowInlineSizePx)}
      onClick={() => onSelect(lineNumber, timestamp)}
    >
      <span className="crosslog-log-viewport__line-number">{lineNumber}</span>
      <code className="crosslog-log-viewport__line-text">
        {renderLineText(text, lineSearchMatches, lineNumber, activeSearchMatch, syntaxTokens)}
      </code>
    </li>
  );
});

function scheduleAnimationFrame(callback: () => void): () => void {
  if (typeof globalThis.requestAnimationFrame === "function") {
    const frameId = globalThis.requestAnimationFrame(() => callback());

    return () => globalThis.cancelAnimationFrame(frameId);
  }

  const timeoutId = globalThis.setTimeout(callback, 0);

  return () => globalThis.clearTimeout(timeoutId);
}

function getRowStyle(
  insetBlockStart: number,
  inlineSize: number | null,
): React.CSSProperties {
  return {
    insetBlockStart,
    ...(inlineSize !== null ? { inlineSize } : {}),
  };
}

// Keep the browser scroll range proportional to the complete log, not to the
// currently rendered slice. Large files otherwise desynchronize the scroll
// offset from the virtual window and can leave the viewport blank.
function scrollTopForLine(viewport: HTMLElement, lineNumber: number, lineCount: number): number | null {
  const maxScrollTop = getMaxVirtualScrollTop(viewport, lineCount);

  if (maxScrollTop <= 0 || lineCount <= 1) {
    return null;
  }

  return scrollTopForLineNumber(lineNumber, viewport, lineCount);
}

function lineForScrollTop(viewport: HTMLElement, lineCount: number): number | null {
  const maxScrollTop = getMaxVirtualScrollTop(viewport, lineCount);

  if (maxScrollTop <= 0 || lineCount <= 1) {
    return null;
  }

  if (viewport.scrollTop >= maxScrollTop - 1) {
    return lineCount;
  }

  return lineForScrollOffset(viewport.scrollTop, lineCount);
}

function scrollTopForLineNumber(lineNumber: number, viewport: HTMLElement, lineCount: number): number {
  const safeLineNumber = clampLineNumber(lineNumber, lineCount);

  if (safeLineNumber <= 1) {
    return 0;
  }

  return clampScrollTop(
    logViewportPaddingBlockPx + (safeLineNumber - 1) * logViewportRowHeightPx,
    viewport,
    lineCount,
  );
}

function scrollTopForLineAtVisualOffset(
  viewport: HTMLElement,
  lineNumber: number,
  visualLineOffset: number,
  lineCount: number,
): number | null {
  const maxScrollTop = getMaxVirtualScrollTop(viewport, lineCount);

  if (maxScrollTop <= 0 || lineCount <= 1) {
    return null;
  }

  const safeLineNumber = clampLineNumber(lineNumber, lineCount);
  const safeVisualLineOffset = Math.round(visualLineOffset);

  return clampScrollTop(
    (safeLineNumber - 1 - safeVisualLineOffset) * logViewportRowHeightPx,
    viewport,
    lineCount,
  );
}

function lineForScrollOffset(scrollTop: number, lineCount: number): number {
  return clampLineNumber(
    Math.floor(Math.max(0, scrollTop - logViewportPaddingBlockPx) / logViewportRowHeightPx) + 1,
    lineCount,
  );
}

function getVisualLineOffsetForScrollTop(lineNumber: number, scrollTop: number): number {
  const lineTopPx = logViewportPaddingBlockPx + (lineNumber - 1) * logViewportRowHeightPx;
  const visualLineOffset = Math.round(
    (lineTopPx - Math.max(0, scrollTop) - logViewportPaddingBlockPx) / logViewportRowHeightPx,
  );

  return Object.is(visualLineOffset, -0) ? 0 : visualLineOffset;
}

function getNextKeyboardVisualLineOffset(
  viewport: HTMLElement | null,
  currentLineNumber: number,
  delta: number,
): number | null {
  if (!viewport) {
    return null;
  }

  const currentVisualLineOffset = getVisualLineOffsetForScrollTop(currentLineNumber, viewport.scrollTop);
  const viewportLineCapacity = Math.max(
    1,
    Math.floor(Math.max(0, viewport.clientHeight - logViewportPaddingBlockPx * 2) / logViewportRowHeightPx),
  );

  return Math.max(0, Math.min(viewportLineCapacity - 1, currentVisualLineOffset + delta));
}

export function firstVisibleLineForScrollTop(
  scrollTop: number,
  maxVisibleLines: number,
  lineCount: number,
  scrollDirection: ScrollDirection = "forward",
): number | null {
  if (lineCount <= 1) {
    return null;
  }

  const maxFirstVisibleLineNumber = Math.max(1, lineCount - Math.max(1, maxVisibleLines) + 1);
  const topLineNumber = lineForScrollOffset(scrollTop, lineCount);
  // Keep the same DOM budget while placing most of it ahead of the scroll.
  // Rendering work can take longer than one frame on a shared CI runner, so a
  // symmetric window may end behind a fast forward scroll before its next
  // state commit. Reserve only 10% behind the movement and reverse the bias
  // when the user scrolls back.
  const overscanBeforeLineCount =
    scrollDirection === "forward"
      ? Math.floor(Math.max(1, maxVisibleLines) / 10)
      : Math.ceil((Math.max(1, maxVisibleLines) * 9) / 10);

  return Math.max(1, Math.min(maxFirstVisibleLineNumber, topLineNumber - overscanBeforeLineCount));
}

function clampScrollTop(scrollTop: number, viewport: HTMLElement, lineCount: number): number {
  return Math.max(0, Math.min(getMaxVirtualScrollTop(viewport, lineCount), Math.round(scrollTop)));
}

function getMaxVirtualScrollTop(viewport: HTMLElement, lineCount: number): number {
  return Math.max(0, getVirtualScrollHeight(lineCount) - viewport.clientHeight);
}

function getVirtualScrollHeight(lineCount: number): number {
  return logViewportPaddingBlockPx * 2 + Math.max(0, lineCount) * logViewportRowHeightPx;
}

function getFirstVisibleLineNumberForTarget(
  lineCount: number,
  maxVisibleLines: number,
  targetLineNumber: number,
  visualLineOffset: number | null,
  fallbackFirstVisibleLineNumber: number,
): number {
  if (visualLineOffset === null) {
    return getVisibleWindowStartIndex(lineCount, maxVisibleLines, targetLineNumber, null) + 1;
  }

  const desiredTopLineNumber = targetLineNumber - visualLineOffset;
  const desiredScrollTop = Math.max(0, (desiredTopLineNumber - 1) * logViewportRowHeightPx);

  return (
    firstVisibleLineForScrollTop(desiredScrollTop, maxVisibleLines, lineCount) ??
    keepLineVisible(targetLineNumber, fallbackFirstVisibleLineNumber, maxVisibleLines, lineCount)
  );
}

function ensureLineIsRendered(
  firstVisibleLineNumber: number,
  maxVisibleLines: number,
  targetLineNumber: number,
  lineCount: number,
): number {
  const visibleEndLineNumber = firstVisibleLineNumber + maxVisibleLines - 1;

  if (targetLineNumber >= firstVisibleLineNumber && targetLineNumber <= visibleEndLineNumber) {
    return firstVisibleLineNumber;
  }

  return getVisibleWindowStartIndex(lineCount, maxVisibleLines, targetLineNumber, null) + 1;
}

function normalizeVisualLineOffset(visualLineOffset: number | null | undefined): number | null {
  return typeof visualLineOffset === "number" && Number.isFinite(visualLineOffset)
    ? Math.round(visualLineOffset)
    : null;
}

function getVisibleWindowStartIndex(
  lineCount: number,
  maxVisibleLines: number,
  targetLineNumber: number | null,
  firstVisibleLineNumber: number | null,
): number {
  const safeLineCount = Math.max(0, lineCount);
  const safeMaxVisibleLines = Math.max(1, maxVisibleLines);
  const maxStartIndex = Math.max(0, safeLineCount - safeMaxVisibleLines);

  if (firstVisibleLineNumber !== null) {
    return Math.max(0, Math.min(maxStartIndex, firstVisibleLineNumber - 1));
  }

  if (!targetLineNumber) {
    return 0;
  }

  return Math.max(0, Math.min(maxStartIndex, targetLineNumber - Math.ceil(safeMaxVisibleLines / 2)));
}

function clampLineNumber(lineNumber: number, lineCount: number): number {
  if (lineCount <= 0) {
    return 1;
  }

  return Math.max(1, Math.min(lineCount, Math.round(lineNumber)));
}

function keepLineVisible(
  lineNumber: number,
  firstVisibleLineNumber: number,
  maxVisibleLines: number,
  lineCount: number,
): number {
  const safeFirstVisibleLineNumber = Math.max(1, firstVisibleLineNumber);
  const visibleEndLineNumber = safeFirstVisibleLineNumber + maxVisibleLines - 1;

  if (lineNumber < safeFirstVisibleLineNumber) {
    return lineNumber;
  }

  if (lineNumber > visibleEndLineNumber) {
    return Math.max(1, Math.min(lineCount, lineNumber - maxVisibleLines + 1));
  }

  return safeFirstVisibleLineNumber;
}

function getLineNumberDigitCount(lineCount: number): number {
  return Math.max(1, String(Math.max(1, lineCount)).length);
}

function moveHorizontalScroller(viewport: HTMLElement, delta: number): void {
  const scroller = viewport.closest<HTMLElement>(".crosslog-log-scroller");

  if (!scroller) {
    return;
  }

  scroller.scrollLeft = Math.max(0, scroller.scrollLeft + delta);
  scroller.dispatchEvent(new Event("scroll", { bubbles: true }));
}

function isElementVisibleVerticallyWithinViewport(element: HTMLElement, viewport: HTMLElement): boolean {
  const elementRect = element.getBoundingClientRect();
  const viewportRect = viewport.getBoundingClientRect();
  const visibleTop = viewportRect.top + logViewportPaddingBlockPx;
  const visibleBottom = viewportRect.bottom - logViewportPaddingBlockPx;

  return elementRect.top >= visibleTop - 1 && elementRect.bottom <= visibleBottom + 1;
}

function isElementVisibleHorizontallyWithinScroller(element: HTMLElement, scroller: HTMLElement): boolean {
  const elementRect = element.getBoundingClientRect();
  const visibleFrameRect = getHorizontalVisibleFrameRect(scroller);

  return elementRect.left >= visibleFrameRect.left - 1 && elementRect.right <= visibleFrameRect.right + 1;
}

function getCenteredScrollTopForElement(
  viewport: HTMLElement,
  element: HTMLElement,
  lineCount: number,
): number | null {
  const viewportRect = viewport.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const delta = elementRect.top + elementRect.height / 2 - (viewportRect.top + viewport.clientHeight / 2);

  return clampScrollTop(viewport.scrollTop + delta, viewport, lineCount);
}

function getCenteredScrollLeftForElement(scroller: HTMLElement, element: HTMLElement): number | null {
  const maxScrollLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth);

  if (maxScrollLeft <= 0) {
    return null;
  }

  const frame = scroller.querySelector<HTMLElement>(".crosslog-log-scroller__viewport-frame");
  const visibleFrameRect = frame?.getBoundingClientRect() ?? scroller.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const delta =
    elementRect.left + elementRect.width / 2 - (visibleFrameRect.left + visibleFrameRect.width / 2);
  const compensationFactor = frame ? 2 : 1;

  return Math.max(0, Math.min(maxScrollLeft, Math.round(scroller.scrollLeft + delta * compensationFactor)));
}

function getHorizontalVisibleFrameRect(scroller: HTMLElement): DOMRect {
  return (
    scroller.querySelector<HTMLElement>(".crosslog-log-scroller__viewport-frame")?.getBoundingClientRect() ??
    scroller.getBoundingClientRect()
  );
}

function groupSearchMatchesByLineNumber(
  matches: readonly SearchMatch[],
): ReadonlyMap<number, readonly SearchMatch[]> {
  const groupedMatches = new Map<number, SearchMatch[]>();

  matches.forEach((match) => {
    const lineMatches = groupedMatches.get(match.lineNumber) ?? [];

    lineMatches.push(match);
    groupedMatches.set(match.lineNumber, lineMatches);
  });

  groupedMatches.forEach((lineMatches) => {
    lineMatches.sort((left, right) => left.range.start - right.range.start);
  });

  return groupedMatches;
}

function renderLineText(
  text: string,
  matches: readonly SearchMatch[],
  lineNumber: number,
  activeSearchMatch: SearchMatch | null,
  syntaxTokens: readonly LogSyntaxToken[],
): React.ReactNode {
  if (matches.length === 0 && syntaxTokens.length === 0) {
    return text;
  }

  if (matches.length === 0) {
    return renderSyntaxRange(text, syntaxTokens, 0, text.length, "plain");
  }

  const fragments: React.ReactNode[] = [];
  let cursor = 0;

  matches.forEach((match, matchIndex) => {
    const start = Math.max(cursor, Math.min(text.length, match.range.start));
    const end = Math.max(start, Math.min(text.length, match.range.end));

    if (start > cursor) {
      fragments.push(...renderSyntaxRange(text, syntaxTokens, cursor, start, `plain:${matchIndex}`));
    }

    if (end > start) {
      fragments.push(
        <mark
          className="crosslog-log-viewport__search-highlight"
          data-active-search-highlight={
            activeSearchMatch &&
            activeSearchMatch.lineNumber === lineNumber &&
            activeSearchMatch.range.start === match.range.start &&
            activeSearchMatch.range.end === match.range.end
              ? "true"
              : "false"
          }
          data-match-end={match.range.end}
          data-match-start={match.range.start}
          data-search-highlight="true"
          key={`match:${matchIndex}:${start}:${end}`}
        >
          {renderSyntaxRange(text, syntaxTokens, start, end, `match:${matchIndex}`)}
        </mark>,
      );
    }

    cursor = end;
  });

  if (cursor < text.length) {
    fragments.push(...renderSyntaxRange(text, syntaxTokens, cursor, text.length, "tail"));
  }

  return fragments;
}

function renderSyntaxRange(
  text: string,
  syntaxTokens: readonly LogSyntaxToken[],
  start: number,
  end: number,
  keyPrefix: string,
): React.ReactNode[] {
  if (end <= start) {
    return [];
  }

  const fragments: React.ReactNode[] = [];
  let cursor = start;

  syntaxTokens.forEach((token, tokenIndex) => {
    if (token.end <= start || token.start >= end) {
      return;
    }

    const tokenStart = Math.max(start, token.start);
    const tokenEnd = Math.min(end, token.end);

    if (tokenStart > cursor) {
      fragments.push(text.slice(cursor, tokenStart));
    }

    if (tokenEnd > tokenStart) {
      const severityLevel = token.kind === "severity" ? resolveLogSeverityLevel(text.slice(tokenStart, tokenEnd)) : null;
      fragments.push(
        <span
          className="crosslog-log-token"
          data-log-token-kind={token.kind}
          data-log-severity-level={severityLevel ?? undefined}
          key={`${keyPrefix}:${token.kind}:${tokenIndex}:${tokenStart}:${tokenEnd}`}
        >
          {text.slice(tokenStart, tokenEnd)}
        </span>,
      );
    }

    cursor = tokenEnd;
  });

  if (cursor < end) {
    fragments.push(text.slice(cursor, end));
  }

  return fragments.length === 0 ? [text.slice(start, end)] : fragments;
}
