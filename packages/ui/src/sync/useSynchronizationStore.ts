import { create } from "zustand";
import type { Session, SynchronizationTarget, TimeAnchorPane, TimeOffset } from "@crosslog/core";
import { zeroTimeOffset } from "@crosslog/core";

export interface SynchronizationTargetViewState {
  readonly lineNumber: number;
  readonly visualLineOffset: number | null;
}

export interface SynchronizationStoreState {
  readonly enabled: boolean;
  readonly anchor: TimeAnchorPane | null;
  readonly offsets: Readonly<Record<string, TimeOffset>>;
  readonly targets: Readonly<Record<string, SynchronizationTargetViewState>>;
  readonly excludedPaneIds: readonly string[];
  readonly setEnabled: (enabled: boolean) => void;
  readonly setAnchor: (anchor: TimeAnchorPane | null) => void;
  readonly setPaneOffset: (paneId: string, offset: TimeOffset) => void;
  readonly setPlanResult: (
    targets: readonly SynchronizationTarget[],
    excludedPaneIds: readonly string[],
    visualLineOffset: number | null,
  ) => void;
  readonly restoreSessionState: (session: Session) => void;
  readonly reset: () => void;
}

export const useSynchronizationStore = create<SynchronizationStoreState>((set) => ({
  enabled: true,
  anchor: null,
  offsets: {},
  targets: {},
  excludedPaneIds: [],
  setEnabled: (enabled) =>
    set(() =>
      enabled
        ? { enabled }
        : {
            enabled,
            targets: {},
            excludedPaneIds: [],
          },
    ),
  setAnchor: (anchor) => set({ anchor }),
  setPaneOffset: (paneId, offset) =>
    set((state) => ({
      offsets: {
        ...state.offsets,
        [paneId]: offset,
      },
    })),
  setPlanResult: (targets, excludedPaneIds, visualLineOffset) =>
    set({
      targets: Object.fromEntries(
        targets.map((target) => [
          target.paneId,
          {
            lineNumber: target.lineNumber,
            visualLineOffset,
          },
        ]),
      ),
      excludedPaneIds,
    }),
  restoreSessionState: (session) =>
    set({
      enabled: session.synchronizationEnabled,
      anchor: null,
      offsets: Object.fromEntries(session.panes.map((pane) => [pane.id, pane.timeOffset])),
      targets: {},
      excludedPaneIds: [],
    }),
  reset: () =>
    set({
      enabled: true,
      anchor: null,
      offsets: {},
      targets: {},
      excludedPaneIds: [],
    }),
}));

export function getPaneOffset(offsets: Readonly<Record<string, TimeOffset>>, paneId: string): TimeOffset {
  return offsets[paneId] ?? zeroTimeOffset;
}
