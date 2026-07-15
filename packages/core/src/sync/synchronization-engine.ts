import type { TimeOffset } from "./time-offset";
import { applyTimeOffset, timeOffsetToMilliseconds, zeroTimeOffset } from "./time-offset";

export interface SynchronizationLine {
  readonly lineNumber: number;
  readonly timestamp: Date | null;
}

export interface SynchronizationPane {
  readonly paneId: string;
  readonly lines: readonly SynchronizationLine[];
  readonly timeline?: SynchronizationTimeline;
  readonly timeOffset?: TimeOffset;
  readonly syncEnabled?: boolean;
}

export interface SynchronizationTimelineEntry {
  readonly line: SynchronizationLine & { readonly timestamp: Date };
  readonly timestampMs: number;
}

export interface SynchronizationTimeline {
  readonly entries: readonly SynchronizationTimelineEntry[];
}

export interface SynchronizationRequest {
  readonly enabled: boolean;
  readonly anchorPaneId: string | null;
  readonly anchorTimestamp: Date | null;
  readonly panes: readonly SynchronizationPane[];
}

export interface SynchronizationTarget {
  readonly paneId: string;
  readonly lineNumber: number;
  readonly timestamp: Date;
}

export interface SynchronizationPlan {
  readonly targets: readonly SynchronizationTarget[];
  readonly excludedPaneIds: readonly string[];
}

export function createSynchronizationTimeline(
  lines: readonly SynchronizationLine[],
): SynchronizationTimeline {
  const entries: Array<SynchronizationTimelineEntry & { readonly sourceIndex: number }> = [];

  lines.forEach((line, sourceIndex) => {
    if (!line.timestamp) {
      return;
    }

    const timestampMs = line.timestamp.getTime();

    if (!Number.isFinite(timestampMs)) {
      return;
    }

    entries.push({
      line: line as SynchronizationLine & { readonly timestamp: Date },
      sourceIndex,
      timestampMs,
    });
  });
  entries.sort((left, right) => left.timestampMs - right.timestampMs || left.sourceIndex - right.sourceIndex);

  return {
    entries: entries.map(({ line, timestampMs }) => ({ line, timestampMs })),
  };
}

export function createSynchronizationPlan(request: SynchronizationRequest): SynchronizationPlan {
  if (!request.enabled || !request.anchorPaneId || !request.anchorTimestamp) {
    return { targets: [], excludedPaneIds: [] };
  }

  const anchorPane = request.panes.find((pane) => pane.paneId === request.anchorPaneId);
  const anchorOffset = anchorPane?.timeOffset ?? zeroTimeOffset;
  const normalizedAnchorTime = applyTimeOffset(request.anchorTimestamp, anchorOffset).getTime();
  const targets: SynchronizationTarget[] = [];
  const excludedPaneIds: string[] = [];

  for (const pane of request.panes) {
    if (pane.paneId === request.anchorPaneId || pane.syncEnabled === false) {
      continue;
    }

    const target = findGreatestLineAtOrBefore(
      pane.timeline ?? createSynchronizationTimeline(pane.lines),
      pane.timeOffset ?? zeroTimeOffset,
      normalizedAnchorTime,
    );

    if (!target) {
      excludedPaneIds.push(pane.paneId);
      continue;
    }

    targets.push({
      paneId: pane.paneId,
      lineNumber: target.line.lineNumber,
      timestamp: target.line.timestamp,
    });
  }

  return { targets, excludedPaneIds };
}

function findGreatestLineAtOrBefore(
  timeline: SynchronizationTimeline,
  offset: TimeOffset,
  targetTime: number,
): { readonly line: SynchronizationLine; readonly normalizedTime: number } | null {
  const rawTargetTime = targetTime - timeOffsetToMilliseconds(offset);
  const entries = timeline.entries;
  let low = 0;
  let high = entries.length - 1;
  let bestIndex = -1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const entry = entries[middle];

    if (!entry) {
      break;
    }

    if (entry.timestampMs <= rawTargetTime) {
      bestIndex = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  if (bestIndex < 0) {
    return null;
  }

  const bestTimestampMs = entries[bestIndex]?.timestampMs;

  if (bestTimestampMs === undefined) {
    return null;
  }

  low = 0;
  high = bestIndex;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    const timestampMs = entries[middle]?.timestampMs;

    if (timestampMs !== undefined && timestampMs < bestTimestampMs) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  const bestEntry = entries[low];

  return bestEntry
    ? {
        line: bestEntry.line,
        normalizedTime: bestEntry.timestampMs + timeOffsetToMilliseconds(offset),
      }
    : null;
}
