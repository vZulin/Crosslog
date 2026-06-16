import type { TimeOffset } from "./time-offset";
import { applyTimeOffset, zeroTimeOffset } from "./time-offset";

export interface SynchronizationLine {
  readonly lineNumber: number;
  readonly timestamp: Date | null;
}

export interface SynchronizationPane {
  readonly paneId: string;
  readonly lines: readonly SynchronizationLine[];
  readonly timeOffset?: TimeOffset;
  readonly syncEnabled?: boolean;
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

    const target = findGreatestLineAtOrBefore(pane.lines, pane.timeOffset ?? zeroTimeOffset, normalizedAnchorTime);

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
  lines: readonly SynchronizationLine[],
  offset: TimeOffset,
  targetTime: number,
): { readonly line: SynchronizationLine; readonly normalizedTime: number } | null {
  let best: { readonly line: SynchronizationLine; readonly normalizedTime: number } | null = null;

  for (const line of lines) {
    if (!line.timestamp) {
      continue;
    }

    const normalizedTime = applyTimeOffset(line.timestamp, offset).getTime();

    if (normalizedTime <= targetTime && (!best || normalizedTime > best.normalizedTime)) {
      best = { line, normalizedTime };
    }
  }

  return best;
}
