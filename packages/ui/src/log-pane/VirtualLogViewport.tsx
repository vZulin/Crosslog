import React from "react";
import type { SearchMatch } from "@crosslog/core";
import { redesignedShellTestIds } from "../app-shell/testIds";

export interface VisibleLogLine {
  readonly lineNumber: number;
  readonly text: string;
  readonly timestamp: Date | null;
}

export type LogLineSeverity = "trace" | "debug" | "info" | "warn" | "error" | "fatal" | "unknown";

export interface VirtualLogViewportProps {
  readonly title: string;
  readonly lines: readonly string[];
  readonly timestamps?: readonly (Date | null)[];
  readonly searchMatches?: readonly SearchMatch[];
  readonly activeSearchMatchLineNumber?: number | null;
  readonly maxVisibleLines?: number;
  readonly synchronizationTargetLineNumber?: number | null;
  readonly onTimeAnchorChange?: (lineNumber: number, timestamp: Date | null) => void;
}

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
  activeSearchMatchLineNumber,
  maxVisibleLines,
  synchronizationTargetLineNumber,
  onTimeAnchorChange,
}: VirtualLogViewportProps) {
  const visibleLineCapacity = Math.max(1, Math.min(maxVisibleLines ?? 120, Math.max(lines.length, 1)));
  const searchMatchLineNumbers = new Set(searchMatches.map((match) => match.lineNumber));
  const targetLineNumber = activeSearchMatchLineNumber ?? synchronizationTargetLineNumber ?? null;
  const [selectedLineNumber, setSelectedLineNumber] = React.useState(() =>
    clampLineNumber(targetLineNumber ?? 1, lines.length),
  );
  const [firstVisibleLineNumber, setFirstVisibleLineNumber] = React.useState(() =>
    getVisibleWindowStartIndex(lines.length, visibleLineCapacity, targetLineNumber, null) + 1,
  );
  const [lastNavigation, setLastNavigation] = React.useState<"none" | "click" | "keyboard" | "wheel">("none");

  React.useEffect(() => {
    if (!targetLineNumber) {
      return;
    }

    const safeTargetLineNumber = clampLineNumber(targetLineNumber, lines.length);

    setSelectedLineNumber(safeTargetLineNumber);
    setFirstVisibleLineNumber(
      getVisibleWindowStartIndex(lines.length, visibleLineCapacity, safeTargetLineNumber, null) + 1,
    );
  }, [lines.length, targetLineNumber, visibleLineCapacity]);

  React.useEffect(() => {
    const safeSelectedLineNumber = clampLineNumber(selectedLineNumber, lines.length);

    if (safeSelectedLineNumber !== selectedLineNumber) {
      setSelectedLineNumber(safeSelectedLineNumber);
    }

    setFirstVisibleLineNumber((currentFirstLineNumber) =>
      keepLineVisible(
        safeSelectedLineNumber,
        currentFirstLineNumber,
        visibleLineCapacity,
        lines.length,
      ),
    );
  }, [lines.length, selectedLineNumber, visibleLineCapacity]);

  const visibleLines = createVisibleLogLineWindow(
    lines,
    visibleLineCapacity,
    timestamps,
    selectedLineNumber,
    firstVisibleLineNumber,
  );
  const lineNumberDigitCount = getLineNumberDigitCount(lines.length);

  const moveSelectedLine = React.useCallback(
    (delta: number, navigation: "keyboard" | "wheel") => {
      setSelectedLineNumber((currentLineNumber) => {
        const nextLineNumber = clampLineNumber(currentLineNumber + delta, lines.length);

        setFirstVisibleLineNumber((currentFirstLineNumber) =>
          keepLineVisible(nextLineNumber, currentFirstLineNumber, visibleLineCapacity, lines.length),
        );
        setLastNavigation(navigation);
        onTimeAnchorChange?.(nextLineNumber, timestamps[nextLineNumber - 1] ?? null);

        return nextLineNumber;
      });
    },
    [lines.length, onTimeAnchorChange, timestamps, visibleLineCapacity],
  );

  const handleWheel = (event: React.WheelEvent<HTMLOListElement>) => {
    if (lines.length === 0 || event.deltaY === 0) {
      return;
    }

    event.preventDefault();
    const direction = event.deltaY > 0 ? 1 : -1;
    const lineDelta = direction * Math.max(1, Math.ceil(Math.abs(event.deltaY) / wheelPixelsPerLine));

    moveSelectedLine(lineDelta, "wheel");
  };

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
      onWheel={handleWheel}
      style={{ "--crosslog-line-number-digits": lineNumberDigitCount } as React.CSSProperties}
      tabIndex={0}
    >
      {visibleLines.map((line) => {
        const severity = inferLogLineSeverity(line.text);
        const selected = line.lineNumber === selectedLineNumber;

        return (
          <li
            className="crosslog-log-viewport__row"
            key={line.lineNumber}
            data-line-number={line.lineNumber}
            data-severity={severity}
            data-search-match={searchMatchLineNumbers.has(line.lineNumber) ? "true" : "false"}
            data-active-search-match={line.lineNumber === activeSearchMatchLineNumber ? "true" : "false"}
            data-selected-line={selected ? "true" : "false"}
            data-sync-target={line.lineNumber === synchronizationTargetLineNumber ? "true" : "false"}
            onClick={() => {
              setSelectedLineNumber(line.lineNumber);
              setFirstVisibleLineNumber((currentFirstLineNumber) =>
                keepLineVisible(line.lineNumber, currentFirstLineNumber, visibleLineCapacity, lines.length),
              );
              setLastNavigation("click");
              onTimeAnchorChange?.(line.lineNumber, line.timestamp);
            }}
          >
            <span className="crosslog-log-viewport__line-number">{line.lineNumber}</span>
            <code className="crosslog-log-viewport__line-text">{line.text}</code>
          </li>
        );
      })}
    </ol>
  );
}

const wheelPixelsPerLine = 40;
const horizontalKeyboardStepPx = 40;

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

export function inferLogLineSeverity(text: string): LogLineSeverity {
  const match = /\b(trace|debug|info|warn|warning|error|err|fatal)\b/i.exec(text);

  switch (match?.[1]?.toLowerCase()) {
    case "trace":
      return "trace";
    case "debug":
      return "debug";
    case "info":
      return "info";
    case "warn":
    case "warning":
      return "warn";
    case "error":
    case "err":
      return "error";
    case "fatal":
      return "fatal";
    default:
      return "unknown";
  }
}
