import type { LogPaneId } from "./log-pane";

export const MIN_PANE_WIDTH = 320;
export const DEFAULT_PANE_WIDTH = 640;

export interface PaneLayoutItem {
  readonly id: LogPaneId;
  readonly width: number;
}

export function clampPaneWidth(width: number, minWidth = MIN_PANE_WIDTH): number {
  if (!Number.isFinite(width)) {
    return minWidth;
  }

  return Math.max(minWidth, Math.round(width));
}

export function normalizePaneLayout<TPane extends PaneLayoutItem>(
  panes: readonly TPane[],
  minWidth = MIN_PANE_WIDTH,
): readonly TPane[] {
  return panes.map((pane) => ({ ...pane, width: clampPaneWidth(pane.width, minWidth) }));
}

export function splitPaneLayout<TPane extends PaneLayoutItem>(
  panes: readonly TPane[],
  paneId: LogPaneId,
  nextPane: TPane,
  minWidth = MIN_PANE_WIDTH,
): readonly TPane[] {
  const paneIndex = panes.findIndex((pane) => pane.id === paneId);

  if (paneIndex < 0) {
    return panes;
  }

  const pane = panes[paneIndex];
  const splitWidth = clampPaneWidth(pane.width / 2, minWidth);
  const resizedPane = { ...pane, width: splitWidth };
  const insertedPane = { ...nextPane, width: splitWidth };

  return [...panes.slice(0, paneIndex), resizedPane, insertedPane, ...panes.slice(paneIndex + 1)];
}

export function closePaneLayout<TPane extends PaneLayoutItem>(
  panes: readonly TPane[],
  paneId: LogPaneId,
): readonly TPane[] {
  const paneIndex = panes.findIndex((pane) => pane.id === paneId);

  if (paneIndex < 0) {
    return panes;
  }

  const closedPane = panes[paneIndex];
  const remaining = [...panes.slice(0, paneIndex), ...panes.slice(paneIndex + 1)];

  if (remaining.length === 0) {
    return [];
  }

  const receiverIndex = Math.max(0, paneIndex - 1);

  return remaining.map((pane, index) =>
    index === receiverIndex ? { ...pane, width: pane.width + closedPane.width } : pane,
  );
}

export function resizeAdjacentPanes<TPane extends PaneLayoutItem>(
  panes: readonly TPane[],
  leftPaneId: LogPaneId,
  delta: number,
  minWidth = MIN_PANE_WIDTH,
): readonly TPane[] {
  const leftIndex = panes.findIndex((pane) => pane.id === leftPaneId);
  const rightIndex = leftIndex + 1;

  if (leftIndex < 0 || rightIndex >= panes.length || !Number.isFinite(delta)) {
    return panes;
  }

  const leftPane = panes[leftIndex];
  const rightPane = panes[rightIndex];
  const minDelta = minWidth - leftPane.width;
  const maxDelta = rightPane.width - minWidth;
  const safeDelta = Math.max(minDelta, Math.min(maxDelta, Math.round(delta)));

  if (safeDelta === 0) {
    return panes;
  }

  return panes.map((pane, index) => {
    if (index === leftIndex) {
      return { ...pane, width: pane.width + safeDelta };
    }

    if (index === rightIndex) {
      return { ...pane, width: pane.width - safeDelta };
    }

    return pane;
  });
}

export function reorderPaneLayout<TPane extends PaneLayoutItem>(
  panes: readonly TPane[],
  paneId: LogPaneId,
  targetIndex: number,
): readonly TPane[] {
  const currentIndex = panes.findIndex((pane) => pane.id === paneId);

  if (currentIndex < 0 || !Number.isFinite(targetIndex)) {
    return panes;
  }

  const nextPanes = [...panes];
  const [movedPane] = nextPanes.splice(currentIndex, 1);
  const safeTargetIndex = Math.max(0, Math.min(nextPanes.length, Math.round(targetIndex)));

  if (safeTargetIndex === currentIndex) {
    return panes;
  }

  nextPanes.splice(safeTargetIndex, 0, movedPane);

  return nextPanes;
}
