import React from "react";
import type { CrosslogPlatform } from "@crosslog/platform";
import type { DirectorySourceRef, DragDropSource, FileSourceRef, UiTestAction } from "@crosslog/platform";
import {
  createLogPane,
  createLogPaneState,
  createDirectoryFileEntry,
  createDirectorySource,
  appendRawLinesToChunks,
  defaultFileOpenPolicy,
  flattenLineChunkText,
  createSynchronizationPlan,
  createTimeAnchorPane,
  createTimestampRecognitionService,
  createSessionSnapshot,
  defaultTimestampFormats,
  directorySourceReducer,
  emptySearchState,
  getCurrentDirectoryFile,
  logPaneReducer,
  restoreLogPaneStateFromSession,
  type DirectoryFileEntry,
  type FileSource,
  type Session,
  type SessionDirectorySource,
  type SessionFileSource,
} from "@crosslog/core";
import { CapabilityLimitations } from "./CapabilityLimitations";
import { FuturePaneToolbarSlot } from "../log-pane/FuturePaneToolbarSlot";
import { PaneRail } from "../pane-rail/PaneRail";
import { usePaneSearchStore } from "../search/usePaneSearchStore";
import { SessionRecoveryBanner } from "../session/SessionRecoveryBanner";
import { useSessionRestore, useSessionSnapshotWriter } from "../session/useSessionRestore";
import { SynchronizationToggle } from "../sync/SynchronizationToggle";
import { TimestampConfigError } from "../sync/TimestampConfigError";
import { getPaneOffset, useSynchronizationStore } from "../sync/useSynchronizationStore";
import { useFileLifecycleEvents, type FileSourceMap } from "../log-pane/useFileLifecycleEvents";

export interface AppShellProps {
  readonly platform: CrosslogPlatform;
}

export function AppShell({ platform }: AppShellProps) {
  const [state, dispatch] = React.useReducer(logPaneReducer, createLogPaneState());
  const [fileSources, setFileSources] = React.useState<FileSourceMap>(() => createInitialFileSources(platform.kind));
  const [uiTestEnabled, setUiTestEnabled] = React.useState(false);
  const [uiTestCopiedPaneTitle, setUiTestCopiedPaneTitle] = React.useState<string | null>(null);
  const liveAppendCounter = React.useRef(1);
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
  const publishFileLifecycleEvent = useFileLifecycleEvents(setFileSources);
  const restoreState = useSessionRestore(platform.sessionStore, {
    onSessionRestored: (session) => {
      const restoredDirectorySource = session.sources.find(
        (source): source is SessionDirectorySource => source.kind === "directory",
      );

      dispatch({ type: "replaceState", state: restoreLogPaneStateFromSession(session) });
      setFileSources(restoreFileSourcesFromSession(session));

      if (restoredDirectorySource) {
        const restoredFiles = restoreDirectoryFilesFromSession(restoredDirectorySource);
        dispatchDirectorySource({ type: "refreshFiles", files: restoredFiles });

        if (restoredDirectorySource.currentFileId) {
          dispatchDirectorySource({ type: "selectFile", fileId: restoredDirectorySource.currentFileId });
        }
      }
    },
  });
  const timestampService = React.useMemo(
    () => createTimestampRecognitionService(defaultTimestampFormats),
    [],
  );
  const sessionSnapshot = React.useMemo(
    () =>
      state.panes.length === 0
        ? null
        : createSessionSnapshot({
            panes: state.panes,
            fileSources: Object.values(fileSources),
            directorySources: [directorySource],
          }),
    [directorySource, fileSources, state.panes],
  );

  useSessionSnapshotWriter(
    platform.sessionStore,
    sessionSnapshot,
    restoreState.status === "ready" && state.panes.length > 0,
  );

  const paneData = React.useMemo(
    () =>
      state.panes.map((pane) => {
        const currentDirectoryFile =
          pane.sourceRef === directorySource.id ? getCurrentDirectoryFile(directorySource) : null;
        const paneTitle = currentDirectoryFile?.name ?? pane.title;
        const fileSource = pane.sourceRef ? fileSources[pane.sourceRef] : null;
        const lines = currentDirectoryFile
          ? getSampleLines(currentDirectoryFile.name)
          : fileSource
            ? flattenLineChunkText(fileSource.lineChunks)
            : getSampleLines(pane.title);
        const recognizedLines = lines.map((line, index) => timestampService.recognizeLine(index + 1, line, pane.id));
        const status = fileSource?.deleted
          ? ("deleted" as const)
          : fileSource?.watchState === "unsupported"
            ? pane.status
            : pane.sourceRef === directorySource.id && directorySource.files.length === 0
              ? ("empty" as const)
              : pane.status;

        return {
          pane: {
            ...pane,
            title: paneTitle,
            timeOffset: getPaneOffset(syncOffsets, pane.id),
            syncEnabled: synchronizationEnabled,
            status,
          },
          lines,
          timestamps: recognizedLines.map((line) => line.timestamp),
          synchronizationTargetLineNumber: syncTargets[pane.id] ?? null,
          directorySource: pane.sourceRef === directorySource.id ? directorySource : undefined,
        };
      }),
    [directorySource, fileSources, state.panes, syncOffsets, syncTargets, synchronizationEnabled, timestampService],
  );
  const panes = paneData.map((entry) => ({
    ...entry,
    pane: {
      ...entry.pane,
      searchState: searchStates[entry.pane.id] ?? emptySearchState,
    },
  }));
  const unsupportedPaneCount = excludedPaneIds.length;
  const activePane = state.panes.find((pane) => pane.id === state.activePaneId) ?? null;
  const activePaneTitle = panes.find((entry) => entry.pane.id === state.activePaneId)?.pane.title ?? null;
  const activeFileSource = activePane?.sourceRef ? fileSources[activePane.sourceRef] : null;
  const lifecycleActionsDisabled = !activeFileSource;

  React.useEffect(() => {
    let active = true;

    void platform.uiTestBridge?.isEnabled().then((enabled) => {
      if (active) {
        setUiTestEnabled(enabled);
      }
    });

    return () => {
      active = false;
    };
  }, [platform.uiTestBridge]);

  React.useEffect(() => {
    if (!uiTestEnabled) {
      return;
    }

    void platform.uiTestBridge?.publishShellState({
      status: panes.length === 0 ? "empty" : "logs",
      paneCount: panes.length,
      paneTitles: panes.map((entry) => entry.pane.title),
      activePaneTitle,
      synchronizationEnabled,
      copiedPaneTitle: uiTestCopiedPaneTitle,
    });
  }, [activePaneTitle, panes, platform.uiTestBridge, synchronizationEnabled, uiTestCopiedPaneTitle, uiTestEnabled]);

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

  const handleSynchronizationEnabledChange = React.useCallback((enabled: boolean) => {
    setSynchronizationEnabled(enabled);

    if (!enabled) {
      setPlanResult([], []);
    }
  }, [setPlanResult, setSynchronizationEnabled]);

  const handleAppendLiveLine = () => {
    if (!activeFileSource) {
      return;
    }

    publishFileLifecycleEvent({
      type: "FileAppended",
      sourceId: activeFileSource.id,
      lines: [`2026-06-16T09:05:00.000Z ${activeFileSource.displayName} live appended line ${liveAppendCounter.current++}`],
    });
  };

  const handleDeleteActiveFile = () => {
    if (!activeFileSource) {
      return;
    }

    publishFileLifecycleEvent({ type: "FileDeleted", sourceId: activeFileSource.id });
  };

  const handleReplaceActiveFile = () => {
    if (!activeFileSource) {
      return;
    }

    publishFileLifecycleEvent({
      type: "FileReplaced",
      sourceId: activeFileSource.id,
      identity: `${activeFileSource.fileIdentity.value}:replacement:${Date.now()}`,
      sizeBytes: 96,
      lines: [
        `2026-06-16T09:06:00.000Z ${activeFileSource.displayName} replacement file started`,
        `2026-06-16T09:06:01.000Z ${activeFileSource.displayName} replacement file ready`,
      ],
    });
  };

  const firstPaneTitle = panes[0]?.pane.title ?? null;
  const executeUiTestAction = React.useCallback(
    (action: UiTestAction) => {
      switch (action) {
        case "openSampleLogs":
          if (!clickUiTestActionControl("openSampleLogs") && state.panes.length === 0) {
            samplePanes.forEach((pane) => dispatch({ type: "addPane", pane }));
          }
          break;
        case "copyFirstPane":
          if (firstPaneTitle) {
            clickElementByAriaLabel(`Copy selected text from ${firstPaneTitle}`);
          }
          break;
        case "toggleSynchronization":
          if (!clickUiTestActionControl("toggleSynchronization")) {
            handleSynchronizationEnabledChange(!synchronizationEnabled);
          }
          break;
      }
    },
    [firstPaneTitle, handleSynchronizationEnabledChange, state.panes.length, synchronizationEnabled],
  );

  React.useEffect(() => {
    if (!uiTestEnabled || !platform.uiTestBridge) {
      return;
    }

    let disposed = false;
    let consuming = false;
    const consume = () => {
      if (consuming) {
        return;
      }

      consuming = true;
      void platform.uiTestBridge?.consumePendingAction().then((action) => {
        if (!disposed && action) {
          executeUiTestAction(action);
        }
      }).finally(() => {
        consuming = false;
      });
    };

    consume();
    const intervalId = globalThis.setInterval(consume, uiTestActionPollIntervalMs);

    return () => {
      disposed = true;
      globalThis.clearInterval(intervalId);
    };
  }, [executeUiTestAction, platform.uiTestBridge, uiTestEnabled]);

  const openFileSource = async (sourceRef: FileSourceRef) => {
    const result = await platform.fileAccess.openFileReadOnly(sourceRef, defaultFileOpenPolicy);

    if (!result.ok) {
      dispatch({
        type: "addPane",
        pane: {
          id: `pane-error-${sourceRef.id}`,
          title: sourceRef.name,
          sourceRef: null,
          width: 520,
          status: result.error.code === "FileTooLarge" ? "memory-limited" : "error",
        },
      });
      return;
    }

    setFileSources((current) => ({
      ...current,
      [result.source.id]: result.source,
    }));
    dispatch({
      type: "addPane",
      pane: {
        id: `pane-${result.source.id}`,
        title: result.source.displayName,
        sourceRef: result.source.id,
        width: 520,
        status: "ready",
      },
    });
  };

  const openDirectorySource = async (sourceRef: DirectorySourceRef) => {
    const files = await platform.directoryAccess.listTopLevelFiles(sourceRef);

    dispatchDirectorySource({ type: "refreshFiles", files });
    dispatch({
      type: "addPane",
      pane: {
        id: `pane-directory-${sourceRef.id}`,
        title: sourceRef.name,
        sourceRef: directorySource.id,
        width: 520,
        status: files.length === 0 ? "empty" : "ready",
      },
    });
  };

  const openDroppedSources = async (sources: readonly DragDropSource[]) => {
    for (const source of sources) {
      if (source.type === "file") {
        await openFileSource(source.source);
      } else {
        await openDirectorySource(source.source);
      }
    }
  };

  const handleBrowserFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);

    void Promise.all(
      files.map((file) =>
        openFileSource({
          id: `browser-file-${sanitizeSourceId(file.name)}-${file.size}-${file.lastModified}`,
          name: file.name,
          file,
        }),
      ),
    );
    event.currentTarget.value = "";
  };

  const handleOpenBrowserDirectory = () => {
    void openDirectorySource({
      id: "browser-directory-fixture",
      name: "browser-fixtures",
      entries: browserDirectoryEntries,
    });
  };

  const handleDrop = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    void platform.dragDropSource.mapDroppedSources(event.nativeEvent).then(openDroppedSources);
  };

  return (
    <main aria-label="Crosslog workspace">
      <SessionRecoveryBanner message={restoreState.message} />
      <CapabilityLimitations limitations={platform.capabilities.limitations} />
      {state.panes.length === 0 ? (
        <section aria-label="Empty workspace" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
          <h1>Crosslog</h1>
          <button
            type="button"
            data-ui-test-action="openSampleLogs"
            onClick={() => {
              samplePanes.forEach((pane) => dispatch({ type: "addPane", pane }));
            }}
          >
            Open logs
          </button>
          {platform.kind === "web" ? (
            <>
              <label>
                Open browser files
                <input
                  aria-label="Open browser files"
                  multiple
                  type="file"
                  onChange={handleBrowserFileInput}
                />
              </label>
              <button type="button" onClick={handleOpenBrowserDirectory}>
                Open browser directory
              </button>
            </>
          ) : null}
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
          <div
            role="toolbar"
            aria-label="Global tools"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
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
            <button type="button" disabled={lifecycleActionsDisabled} onClick={handleAppendLiveLine}>
              Append live line
            </button>
            <button type="button" disabled={lifecycleActionsDisabled} onClick={handleDeleteActiveFile}>
              Delete active file
            </button>
            <button type="button" disabled={lifecycleActionsDisabled} onClick={handleReplaceActiveFile}>
              Replace active file
            </button>
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
            onCopied={setUiTestCopiedPaneTitle}
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

const browserDirectoryEntries = [
  {
    kind: "file" as const,
    id: "browser-directory-new",
    name: "browser-new.log",
    createdAt: new Date("2026-06-16T12:00:00.000Z"),
    sizeBytes: 128,
  },
  {
    kind: "file" as const,
    id: "browser-directory-old",
    name: "browser-old.log",
    createdAt: new Date("2026-06-15T12:00:00.000Z"),
    sizeBytes: 128,
  },
  {
    kind: "directory" as const,
    id: "browser-directory-nested",
    name: "nested",
  },
];

const uiTestActionPollIntervalMs = 100;

function clickUiTestActionControl(action: UiTestAction): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  return clickElement(document.querySelector<HTMLElement>(`[data-ui-test-action="${action}"]`));
}

function clickElementByAriaLabel(label: string): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  const element = Array.from(document.querySelectorAll<HTMLElement>("button,input")).find(
    (candidate) => candidate.getAttribute("aria-label") === label,
  );

  return clickElement(element ?? null);
}

function clickElement(element: HTMLElement | null): boolean {
  if (!element) {
    return false;
  }

  element.click();
  return true;
}

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

function createInitialFileSources(platform: FileSource["fileIdentity"]["platform"]): FileSourceMap {
  return Object.fromEntries(
    samplePanes
      .filter((pane) => pane.sourceRef && pane.sourceRef !== "source-directory")
      .map((pane) => [pane.sourceRef, createSampleFileSource(pane.sourceRef!, pane.title, platform)]),
  );
}

function restoreFileSourcesFromSession(session: Session): FileSourceMap {
  return Object.fromEntries(
    session.sources
      .filter((source): source is SessionFileSource => source.kind === "file")
      .map((source) => [
        source.id,
        createSampleFileSource(source.id, source.displayName, source.fileIdentity.platform),
      ]),
  );
}

function restoreDirectoryFilesFromSession(source: SessionDirectorySource): readonly DirectoryFileEntry[] {
  return source.files.map((file) =>
    createDirectoryFileEntry({
      identity: file.identity,
      name: file.name,
      createdAt: file.createdAt ? new Date(file.createdAt) : null,
      fallbackOrderKey: file.fallbackOrderKey,
      sizeBytes: file.sizeBytes,
    }),
  );
}

function createSampleFileSource(
  id: string,
  displayName: string,
  platform: FileSource["fileIdentity"]["platform"],
): FileSource {
  const lines = getSampleLines(displayName);

  return {
    id,
    fileIdentity: { value: id, platform },
    displayName,
    pathLabel: displayName,
    sizeBytes: lines.join("\n").length,
    encoding: "utf-8",
    lineChunks: appendRawLinesToChunks([], lines),
    watchState: platform === "desktop" ? "watching" : "unsupported",
    deleted: false,
    replaced: false,
    readError: null,
  };
}

function sanitizeSourceId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
