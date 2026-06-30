import { create } from "zustand";
import type { SearchMode, SearchState } from "@crosslog/core";
import { emptySearchState, updateSearchIndex } from "@crosslog/core";

export interface PaneSearchStoreState {
  readonly states: Readonly<Record<string, SearchState>>;
  readonly lines: Readonly<Record<string, readonly string[]>>;
  readonly lineKeys: Readonly<Record<string, string>>;
  readonly highlightVisibility: Readonly<Record<string, boolean>>;
  readonly getPaneSearchState: (paneId: string) => SearchState;
  readonly getPaneSearchHighlightsVisible: (paneId: string) => boolean;
  readonly setPaneLines: (paneId: string, lines: readonly string[]) => void;
  readonly setQuery: (paneId: string, query: string) => void;
  readonly setMode: (paneId: string, mode: SearchMode) => void;
  readonly setCaseSensitive: (paneId: string, caseSensitive: boolean) => void;
  readonly selectNextMatch: (paneId: string) => void;
  readonly selectPreviousMatch: (paneId: string) => void;
  readonly showHighlights: (paneId: string) => void;
  readonly hideHighlights: (paneId: string) => void;
  readonly reset: () => void;
}

export const usePaneSearchStore = create<PaneSearchStoreState>((set, get) => ({
  states: {},
  lines: {},
  lineKeys: {},
  highlightVisibility: {},
  getPaneSearchState: (paneId) => get().states[paneId] ?? emptySearchState,
  getPaneSearchHighlightsVisible: (paneId) => get().highlightVisibility[paneId] ?? false,
  setPaneLines: (paneId, lines) =>
    set((state) => {
      const nextLineKey = createLineKey(lines);

      if (state.lineKeys[paneId] === nextLineKey) {
        return state;
      }

      const previousState = state.states[paneId] ?? emptySearchState;
      const nextSearchState = updateSearchIndex(previousState, lines);
      const highlightsVisible =
        state.highlightVisibility[paneId] === true && nextSearchState.matches.length > 0;

      return {
        lines: {
          ...state.lines,
          [paneId]: lines,
        },
        lineKeys: {
          ...state.lineKeys,
          [paneId]: nextLineKey,
        },
        states: {
          ...state.states,
          [paneId]: nextSearchState,
        },
        highlightVisibility: {
          ...state.highlightVisibility,
          [paneId]: highlightsVisible,
        },
      };
    }),
  setQuery: (paneId, query) => updatePaneSearchState(set, paneId, { query }),
  setMode: (paneId, mode) => updatePaneSearchState(set, paneId, { mode }),
  setCaseSensitive: (paneId, caseSensitive) => updatePaneSearchState(set, paneId, { caseSensitive }),
  selectNextMatch: (paneId) => selectMatch(set, get, paneId, 1),
  selectPreviousMatch: (paneId) => selectMatch(set, get, paneId, -1),
  showHighlights: (paneId) =>
    set((state) => ({
      highlightVisibility: {
        ...state.highlightVisibility,
        [paneId]: true,
      },
    })),
  hideHighlights: (paneId) =>
    set((state) => ({
      highlightVisibility: {
        ...state.highlightVisibility,
        [paneId]: false,
      },
    })),
  reset: () =>
    set({
      states: {},
      lines: {},
      lineKeys: {},
      highlightVisibility: {},
    }),
}));

function updatePaneSearchState(
  set: (updater: (state: PaneSearchStoreState) => Partial<PaneSearchStoreState>) => void,
  paneId: string,
  patch: Partial<Pick<SearchState, "query" | "mode" | "caseSensitive">>,
): void {
  set((state) => {
    const previousState = state.states[paneId] ?? emptySearchState;
    const nextStateCandidate = {
      ...previousState,
      ...patch,
    };
    const nextState = updateSearchIndex(previousState, state.lines[paneId] ?? [], nextStateCandidate);

    return {
      states: {
        ...state.states,
        [paneId]: nextState,
      },
      highlightVisibility: {
        ...state.highlightVisibility,
        [paneId]: nextState.query.length > 0 && nextState.matches.length > 0,
      },
    };
  });
}

function selectMatch(
  set: (updater: (state: PaneSearchStoreState) => Partial<PaneSearchStoreState>) => void,
  get: () => PaneSearchStoreState,
  paneId: string,
  direction: 1 | -1,
): void {
  set((state) => {
    const previousState = get().states[paneId] ?? emptySearchState;

    if (previousState.matches.length === 0) {
      return state;
    }

    const currentMatchIndex = previousState.currentMatchIndex ?? 0;
    const nextMatchIndex =
      (currentMatchIndex + direction + previousState.matches.length) % previousState.matches.length;

    return {
      states: {
        ...state.states,
        [paneId]: {
          ...previousState,
          currentMatchIndex: nextMatchIndex,
        },
      },
      highlightVisibility: {
        ...state.highlightVisibility,
        [paneId]: true,
      },
    };
  });
}

function createLineKey(lines: readonly string[]): string {
  return lines.join("\n");
}
