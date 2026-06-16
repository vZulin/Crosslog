import React from "react";
import type { CrosslogPlatform } from "@crosslog/platform";
import {
  createLogPane,
  createLogPaneState,
  createDirectoryFileEntry,
  createDirectorySource,
  createSynchronizationPlan,
  createTimeAnchorPane,
  createTimestampRecognitionService,
  defaultTimestampFormats,
  directorySourceReducer,
  emptySearchState,
  getCurrentDirectoryFile,
  logPaneReducer,
} from "@crosslog/core";
import { FuturePaneToolbarSlot } from "../log-pane/FuturePaneToolbarSlot";
import { PaneRail } from "../pane-rail/PaneRail";
import { usePaneSearchStore } from "../search/usePaneSearchStore";
import { SynchronizationToggle } from "../sync/SynchronizationToggle";
import { TimestampConfigError } from "../sync/TimestampConfigError";
import { getPaneOffset, useSynchronizationStore } from "../sync/useSynchronizationStore";

export interface AppShellProps {
  readonly platform: CrosslogPlatform;
}

export function AppShell({ platform }: AppShellProps) {
  const [state, dispatch] = React.useReducer(logPaneReducer, createLogPaneState());
  const [directorySource, dispatchDirectorySource] = React.useReducer(
    directorySourceReducer,
    createDirectorySource({
      id: "source-directory",
      directoryIdentity: { value: "source-directory", platform: platform.kind },
      displayName: "logs/2026",
      files: sampleDirectoryFiles,
      watchState: platform.capabilities.canDiscoverNewDirectoryFiles ? "watching" : "unsupported",
    }),
  );
  const synchronizationEnabled = useSynchronizationStore((store) => store.enabled);
  const syncOffsets = useSynchronizationStore((store) => store.offsets);
  const syncTargets = useSynchronizationStore((store) => store.targets);
  const excludedPaneIds = useSynchronizationStore((store) => store.excludedPaneIds);
  const setSynchronizationEnabled = useSynchronizationStore((store) => store.setEnabled);
  const setSynchronizationAnchor = useSynchronizationStore((store) => store.setAnchor);
  const setPaneOffset = useSynchronizationStore((store) => store.setPaneOffset);
  const setPlanResult = useSynchronizationStore((store) => store.setPlanResult);
  const searchStates = usePaneSearchStore((store) => store.states);
  const setPaneSearchLines = usePaneSearchStore((store) => store.setPaneLines);
  const setSearchQuery = usePaneSearchStore((store) => store.setQuery);
  const setSearchMode = usePaneSearchStore((store) => store.setMode);
  const setSearchCaseSensitive = usePaneSearchStore((store) => store.setCaseSensitive);
  const selectPreviousSearchMatch = usePaneSearchStore((store) => store.selectPreviousMatch);
  const selectNextSearchMatch = usePaneSearchStore((store) => store.selectNextMatch);
  const timestampService = React.useMemo(
    () => createTimestampRecognitionService(defaultTimestampFormats),
    [],
  );
  const paneData = React.useMemo(
    () =>
      state.panes.map((pane) => {
        const currentDirectoryFile =
          pane.sourceRef === directorySource.id ? getCurrentDirectoryFile(directorySource) : null;
        const paneTitle = currentDirectoryFile?.name ?? pane.title;
        const lines = currentDirectoryFile ? getSampleLines(currentDirectoryFile.name) : getSampleLines(pane.title);
        const recognizedLines = lines.map((line, index) => timestampService.recognizeLine(index + 1, line, pane.id));

        return {
          pane: {
            ...pane,
            title: paneTitle,
            timeOffset: getPaneOffset(syncOffsets, pane.id),
            syncEnabled: synchronizationEnabled,
            status:
              pane.sourceRef === directorySource.id && directorySource.files.length === 0
                ? ("empty" as const)
                : pane.status,
          },
          lines,
          timestamps: recognizedLines.map((line) => line.timestamp),
          synchronizationTargetLineNumber: syncTargets[pane.id] ?? null,
          directorySource: pane.sourceRef === directorySource.id ? directorySource : undefined,
        };
      }),
    [directorySource, state.panes, syncOffsets, syncTargets, synchronizationEnabled, timestampService],
  );
  const panes = paneData.map((entry) => ({
    ...entry,
    pane: {
      ...entry.pane,
      searchState: searchStates[entry.pane.id] ?? emptySearchState,
    },
  }));

  React.useEffect(() => {
    paneData.forEach((entry) => setPaneSearchLines(entry.pane.id, entry.lines));
  }, [paneData, setPaneSearchLines]);

  const handleAnchorChange = (paneId: string, _lineNumber: number, timestamp: Date | null) => {
    const anchor = createTimeAnchorPane(paneId, timestamp, "scroll");
    setSynchronizationAnchor(anchor);

    if (!anchor || !synchronizationEnabled) {
      setPlanResult([], []);
      return;
    }

    const plan = createSynchronizationPlan({
      enabled: synchronizationEnabled,
      anchorPaneId: anchor.paneId,
      anchorTimestamp: anchor.anchorTimestamp,
      panes: paneData.map((entry) => ({
        paneId: entry.pane.id,
        timeOffset: entry.pane.timeOffset,
        syncEnabled: entry.pane.syncEnabled,
        lines: entry.timestamps.map((lineTimestamp, index) => ({
          lineNumber: index + 1,
          timestamp: lineTimestamp,
        })),
      })),
    });

    setPlanResult(plan.targets, plan.excludedPaneIds);
  };

  const handleSynchronizationEnabledChange = (enabled: boolean) => {
    setSynchronizationEnabled(enabled);

    if (!enabled) {
      setPlanResult([], []);
    }
  };

  const unsupportedPaneCount = excludedPaneIds.length;

  return (
    <main aria-label="Crosslog workspace">
      {state.panes.length === 0 ? (
        <section aria-label="Empty workspace">
          <h1>Crosslog</h1>
          <button
            type="button"
            onClick={() => {
              samplePanes.forEach((pane) => dispatch({ type: "addPane", pane }));
            }}
          >
            Open logs
          </button>
          <button
            type="button"
            onClick={() => {
              dispatchDirectorySource({ type: "refreshFiles", files: [] });
              dispatch({
                type: "addPane",
                pane: {
                  id: "pane-empty-directory",
                  title: "logs/empty",
                  sourceRef: "source-directory",
                  width: 520,
                  status: "empty",
                },
              });
            }}
          >
            Open empty directory
          </button>
          <p>{platform.kind === "web" ? "Web workspace" : "Desktop workspace"}</p>
        </section>
      ) : (
        <>
          <div role="toolbar" aria-label="Global tools">
            <SynchronizationToggle
              enabled={synchronizationEnabled}
              onEnabledChange={handleSynchronizationEnabledChange}
            />
            <button
              type="button"
              onClick={() =>
                dispatchDirectorySource({
                  type: "refreshFiles",
                  files: [newerDirectoryFile, ...directorySource.files],
                })
              }
            >
              Discover newer directory file
            </button>
            {unsupportedPaneCount > 0 ? (
              <span aria-live="polite">{unsupportedPaneCount} untimed pane excluded</span>
            ) : null}
          </div>
          <TimestampConfigError message={null} />
          <PaneRail
            panes={panes}
            onAddPane={() => dispatch({ type: "addPane", pane: createAddedPane(state.nextPaneNumber) })}
            onSplitPane={() => dispatch({ type: "splitPane" })}
            onClosePane={(paneId) => dispatch({ type: "closePane", paneId })}
            onActivatePane={(paneId) => dispatch({ type: "setActivePane", paneId })}
            onResizePane={(leftPaneId, delta) => dispatch({ type: "resizePane", leftPaneId, delta })}
            onHorizontalScroll={(paneId, scrollLeft) =>
              dispatch({ type: "setHorizontalScroll", paneId, scrollLeft })
            }
            onNavigateDirectory={(_paneId, direction) => dispatchDirectorySource({ type: "navigate", direction })}
            onTimeAnchorChange={handleAnchorChange}
            onTimeOffsetChange={setPaneOffset}
            onSearchQueryChange={setSearchQuery}
            onSearchRegexModeChange={(paneId, enabled) => setSearchMode(paneId, enabled ? "regex" : "text")}
            onSearchCaseSensitiveChange={setSearchCaseSensitive}
            onPreviousSearchMatch={selectPreviousSearchMatch}
            onNextSearchMatch={selectNextSearchMatch}
          />
        </>
      )}
      <FuturePaneToolbarSlot />
    </main>
  );
}

const samplePanes = [
  createLogPane({
    id: "pane-app",
    title: "app.log",
    sourceRef: "source-app",
    active: true,
    width: 520,
    status: "ready",
  }),
  createLogPane({
    id: "pane-service",
    title: "service.log",
    sourceRef: "source-service",
    width: 520,
    status: "ready",
  }),
  createLogPane({
    id: "pane-directory",
    title: "latest.log",
    sourceRef: "source-directory",
    width: 520,
    status: "ready",
  }),
];

const sampleDirectoryFiles = [
  createDirectoryFileEntry({
    identity: { value: "directory-file-2026-06-16", platform: "web" },
    name: "app-2026-06-16.log",
    createdAt: new Date("2026-06-16T09:00:00.000Z"),
    sizeBytes: 4096,
  }),
  createDirectoryFileEntry({
    identity: { value: "directory-file-2026-06-15", platform: "web" },
    name: "app-2026-06-15.log",
    createdAt: new Date("2026-06-15T09:00:00.000Z"),
    sizeBytes: 4096,
  }),
  createDirectoryFileEntry({
    identity: { value: "directory-file-2026-06-14", platform: "web" },
    name: "app-2026-06-14.log",
    createdAt: new Date("2026-06-14T09:00:00.000Z"),
    sizeBytes: 4096,
  }),
];

const newerDirectoryFile = createDirectoryFileEntry({
  identity: { value: "directory-file-2026-06-17", platform: "web" },
  name: "app-2026-06-17.log",
  createdAt: new Date("2026-06-17T09:00:00.000Z"),
  sizeBytes: 4096,
});

function createAddedPane(nextPaneNumber: number) {
  return {
    title: `adhoc-${nextPaneNumber}.log`,
    sourceRef: `source-adhoc-${nextPaneNumber}`,
    width: 480,
    status: "ready" as const,
  };
}

function getSampleLines(title: string): readonly string[] {
  return Array.from({ length: 250 }, (_, index) => {
    const lineNumber = index + 1;
    const secondsAfterStart = index;
    const minute = Math.floor(secondsAfterStart / 60);
    const second = secondsAfterStart % 60;

    if (lineNumber === 181) {
      return `2026-06-16T09:03:00.000Z ${title} line 180 token=outside-viewport`;
    }

    return [
      `2026-06-16T09:00:00.000Z ${title} boot sequence started with a deliberately long line for horizontal scrolling verification`,
      `2026-06-16T09:00:01.250Z ${title} connected to upstream service`,
      `2026-06-16T09:00:02.500Z ${title} processed request id=42 status=ok`,
      `2026-06-16T09:00:03.750Z ${title} completed comparison sample`,
    ][index] ?? `2026-06-16T09:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}.000Z ${title} line ${lineNumber}`;
  });
}
