import { create } from "zustand";
import type { SearchMode, SearchState } from "@crosslog/core";
import { emptySearchState, updateSearchIndex } from "@crosslog/core";

export interface PaneSearchStoreState {
  readonly states: Readonly<Record<string, SearchState>>;
  readonly lines: Readonly<Record<string, readonly string[]>>;
  readonly lineKeys: Readonly<Record<string, string>>;
  readonly getPaneSearchState: (paneId: string) => SearchState;
  readonly setPaneLines: (paneId: string, lines: readonly string[]) => void;
  readonly setQuery: (paneId: string, query: string) => void;
  readonly setMode: (paneId: string, mode: SearchMode) => void;
  readonly setCaseSensitive: (paneId: string, caseSensitive: boolean) => void;
  readonly selectNextMatch: (paneId: string) => void;
  readonly selectPreviousMatch: (paneId: string) => void;
  readonly reset: () => void;
}

export const usePaneSearchStore = create<PaneSearchStoreState>((set, get) => ({
  states: {},
  lines: {},
  lineKeys: {},
  getPaneSearchState: (paneId) => get().states[paneId] ?? emptySearchState,
  setPaneLines: (paneId, lines) =>
    set((state) => {
      const nextLineKey = createLineKey(lines);

      if (state.lineKeys[paneId] === nextLineKey) {
        return state;
      }

      const previousState = state.states[paneId] ?? emptySearchState;
      const nextSearchState = updateSearchIndex(previousState, lines);

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
      };
    }),
  setQuery: (paneId, query) => updatePaneSearchState(set, get, paneId, { query }),
  setMode: (paneId, mode) => updatePaneSearchState(set, get, paneId, { mode }),
  setCaseSensitive: (paneId, caseSensitive) => updatePaneSearchState(set, get, paneId, { caseSensitive }),
  selectNextMatch: (paneId) => selectMatch(set, get, paneId, 1),
  selectPreviousMatch: (paneId) => selectMatch(set, get, paneId, -1),
  reset: () =>
    set({
      states: {},
      lines: {},
      lineKeys: {},
    }),
}));

function updatePaneSearchState(
  set: (updater: (state: PaneSearchStoreState) => Partial<PaneSearchStoreState>) => void,
  get: () => PaneSearchStoreState,
  paneId: string,
  patch: Partial<Pick<SearchState, "query" | "mode" | "caseSensitive">>,
): void {
  set((state) => {
    const previousState = state.states[paneId] ?? emptySearchState;
    const nextState = {
      ...previousState,
      ...patch,
    };

    return {
      states: {
        ...state.states,
        [paneId]: updateSearchIndex(previousState, get().lines[paneId] ?? [], nextState),
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
    };
  });
}

function createLineKey(lines: readonly string[]): string {
  return lines.join("\n");
}
