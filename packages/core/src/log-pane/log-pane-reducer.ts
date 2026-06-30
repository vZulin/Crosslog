import { emptySearchState } from "../search/search-state";
import { zeroTimeOffset } from "../sync/time-offset";
import type { LogPane, LogPaneId } from "./log-pane";
import {
  DEFAULT_PANE_WIDTH,
  closePaneLayout,
  normalizePaneLayout,
  reorderPaneLayout,
  resizeAdjacentPanes,
  splitPaneLayout,
} from "./pane-layout";

export interface LogPaneState {
  readonly panes: readonly LogPane[];
  readonly activePaneId: LogPaneId | null;
  readonly nextPaneNumber: number;
}

export type LogPaneAction =
  | { readonly type: "addPane"; readonly pane?: Partial<LogPane> }
  | { readonly type: "splitPane"; readonly paneId?: LogPaneId; readonly pane?: Partial<LogPane> }
  | { readonly type: "closePane"; readonly paneId: LogPaneId }
  | { readonly type: "resizePane"; readonly leftPaneId: LogPaneId; readonly delta: number }
  | { readonly type: "reorderPane"; readonly paneId: LogPaneId; readonly targetIndex: number }
  | { readonly type: "setHorizontalScroll"; readonly paneId: LogPaneId; readonly scrollLeft: number }
  | { readonly type: "setActivePane"; readonly paneId: LogPaneId }
  | { readonly type: "replaceState"; readonly state: LogPaneState };

export function createLogPane(overrides: Partial<LogPane> = {}): LogPane {
  const id = overrides.id ?? "pane-1";

  return {
    id,
    sourceRef: overrides.sourceRef ?? null,
    title: overrides.title ?? "Untitled log",
    active: overrides.active ?? false,
    width: overrides.width ?? DEFAULT_PANE_WIDTH,
    horizontalScroll: overrides.horizontalScroll ?? 0,
    searchState: overrides.searchState ?? emptySearchState,
    syncEnabled: overrides.syncEnabled ?? true,
    timeOffset: overrides.timeOffset ?? zeroTimeOffset,
    status: overrides.status ?? "empty",
  };
}

export function createLogPaneState(panes: readonly LogPane[] = []): LogPaneState {
  const normalizedPanes = normalizePaneLayout(panes);
  const activePane = normalizedPanes.find((pane) => pane.active) ?? normalizedPanes[0] ?? null;

  return {
    panes: normalizedPanes.map((pane) => ({ ...pane, active: pane.id === activePane?.id })),
    activePaneId: activePane?.id ?? null,
    nextPaneNumber: normalizedPanes.length + 1,
  };
}

export function logPaneReducer(state: LogPaneState, action: LogPaneAction): LogPaneState {
  switch (action.type) {
    case "replaceState":
      return createLogPaneState(action.state.panes);

    case "addPane": {
      const pane = createNumberedPane(state.nextPaneNumber, action.pane);
      return activatePane({
        ...state,
        panes: [...state.panes, pane],
        nextPaneNumber: state.nextPaneNumber + 1,
      }, pane.id);
    }

    case "splitPane": {
      const sourcePaneId = action.paneId ?? state.activePaneId ?? state.panes.at(-1)?.id;

      if (!sourcePaneId) {
        return logPaneReducer(state, { type: "addPane", pane: action.pane });
      }

      const pane = createNumberedPane(state.nextPaneNumber, {
        title: "Split log",
        status: "ready",
        ...action.pane,
      });
      const nextPanes = splitPaneLayout(state.panes, sourcePaneId, pane);

      if (nextPanes === state.panes) {
        return state;
      }

      return activatePane({
        ...state,
        panes: nextPanes,
        nextPaneNumber: state.nextPaneNumber + 1,
      }, pane.id);
    }

    case "closePane": {
      const closedIndex = state.panes.findIndex((pane) => pane.id === action.paneId);

      if (closedIndex < 0) {
        return state;
      }

      const nextPanes = closePaneLayout(state.panes, action.paneId);
      const nextActivePane = chooseNextActivePane(nextPanes, closedIndex, state.activePaneId, action.paneId);

      return activatePane({ ...state, panes: nextPanes }, nextActivePane);
    }

    case "resizePane":
      return {
        ...state,
        panes: resizeAdjacentPanes(state.panes, action.leftPaneId, action.delta),
      };

    case "reorderPane": {
      const nextPanes = reorderPaneLayout(state.panes, action.paneId, action.targetIndex);

      return nextPanes === state.panes ? state : { ...state, panes: nextPanes };
    }

    case "setHorizontalScroll":
      return {
        ...state,
        panes: state.panes.map((pane) =>
          pane.id === action.paneId ? { ...pane, horizontalScroll: Math.max(0, action.scrollLeft) } : pane,
        ),
      };

    case "setActivePane":
      return activatePane(state, action.paneId);
  }
}

function createNumberedPane(nextPaneNumber: number, overrides: Partial<LogPane> = {}): LogPane {
  return createLogPane({
    id: `pane-${nextPaneNumber}`,
    title: `Log ${nextPaneNumber}`,
    status: "ready",
    ...overrides,
  });
}

function activatePane(state: LogPaneState, paneId: LogPaneId | null): LogPaneState {
  if (!paneId || !state.panes.some((pane) => pane.id === paneId)) {
    return {
      ...state,
      activePaneId: null,
      panes: state.panes.map((pane) => ({ ...pane, active: false })),
    };
  }

  return {
    ...state,
    activePaneId: paneId,
    panes: state.panes.map((pane) => ({ ...pane, active: pane.id === paneId })),
  };
}

function chooseNextActivePane(
  panes: readonly LogPane[],
  closedIndex: number,
  activePaneId: LogPaneId | null,
  closedPaneId: LogPaneId,
): LogPaneId | null {
  if (activePaneId && activePaneId !== closedPaneId && panes.some((pane) => pane.id === activePaneId)) {
    return activePaneId;
  }

  return panes[Math.min(closedIndex, panes.length - 1)]?.id ?? null;
}
