import React from "react";

export interface VisibleLogLine {
  readonly lineNumber: number;
  readonly text: string;
}

export interface VirtualLogViewportProps {
  readonly title: string;
  readonly lines: readonly string[];
  readonly maxVisibleLines?: number;
}

export function createVisibleLogLineWindow(
  lines: readonly string[],
  maxVisibleLines = 120,
): readonly VisibleLogLine[] {
  return lines.slice(0, maxVisibleLines).map((line, index) => ({
    lineNumber: index + 1,
    text: line,
  }));
}

export function VirtualLogViewport({ title, lines, maxVisibleLines }: VirtualLogViewportProps) {
  const visibleLines = createVisibleLogLineWindow(lines, maxVisibleLines);

  return (
    <ol aria-label={`Virtual log viewport for ${title}`} data-testid="virtual-log-viewport">
      {visibleLines.map((line) => (
        <li key={line.lineNumber} data-line-number={line.lineNumber}>
          <span>{line.lineNumber}</span>
          <code>{line.text}</code>
        </li>
      ))}
    </ol>
  );
}
