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
    set((state) => {
      const nextTargets = Object.fromEntries(
        targets.map((target) => [
          target.paneId,
          {
            lineNumber: target.lineNumber,
            visualLineOffset,
          },
        ]),
      );
      const targetsUnchanged = areSynchronizationTargetsEqual(state.targets, nextTargets);
      const excludedPaneIdsUnchanged = areStringArraysEqual(state.excludedPaneIds, excludedPaneIds);

      if (targetsUnchanged && excludedPaneIdsUnchanged) {
        return state;
      }

      return {
        targets: targetsUnchanged ? state.targets : nextTargets,
        excludedPaneIds: excludedPaneIdsUnchanged ? state.excludedPaneIds : excludedPaneIds,
      };
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

function areSynchronizationTargetsEqual(
  current: Readonly<Record<string, SynchronizationTargetViewState>>,
  next: Readonly<Record<string, SynchronizationTargetViewState>>,
): boolean {
  const currentPaneIds = Object.keys(current);
  const nextPaneIds = Object.keys(next);

  return (
    currentPaneIds.length === nextPaneIds.length &&
    currentPaneIds.every((paneId) => {
      const currentTarget = current[paneId];
      const nextTarget = next[paneId];

      return (
        currentTarget?.lineNumber === nextTarget?.lineNumber &&
        currentTarget?.visualLineOffset === nextTarget?.visualLineOffset
      );
    })
  );
}

function areStringArraysEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
