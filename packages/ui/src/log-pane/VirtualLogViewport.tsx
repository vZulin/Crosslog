import React from "react";
import type { SearchMatch } from "@crosslog/core";
import { redesignedShellTestIds } from "../app-shell/testIds";

export interface VisibleLogLine {
  readonly lineNumber: number;
  readonly text: string;
  readonly timestamp: Date | null;
}

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
): readonly VisibleLogLine[] {
  const startIndex =
    targetLineNumber && targetLineNumber > maxVisibleLines
      ? Math.max(0, targetLineNumber - Math.ceil(maxVisibleLines / 2))
      : 0;

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
  const searchMatchLineNumbers = new Set(searchMatches.map((match) => match.lineNumber));
  const targetLineNumber = activeSearchMatchLineNumber ?? synchronizationTargetLineNumber ?? null;
  const visibleLines = createVisibleLogLineWindow(
    lines,
    maxVisibleLines,
    timestamps,
    targetLineNumber,
  );

  return (
    <ol
      aria-label={`Virtual log viewport for ${title}`}
      className="crosslog-log-viewport"
      data-testid={redesignedShellTestIds.logViewport}
      id={redesignedShellTestIds.logViewport}
    >
      {visibleLines.map((line) => (
        <li
          key={line.lineNumber}
          data-line-number={line.lineNumber}
          data-search-match={searchMatchLineNumbers.has(line.lineNumber) ? "true" : "false"}
          data-active-search-match={line.lineNumber === activeSearchMatchLineNumber ? "true" : "false"}
          data-sync-target={line.lineNumber === synchronizationTargetLineNumber ? "true" : "false"}
          onClick={() => onTimeAnchorChange?.(line.lineNumber, line.timestamp)}
        >
          <span>{line.lineNumber}</span>
          <code>{line.text}</code>
        </li>
      ))}
    </ol>
  );
}
