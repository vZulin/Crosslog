import React from "react";
import type {
  CrosslogPlatform,
  UiTestObsoleteControlVisibility,
  UiTestWorkspaceLayoutMeasurements,
} from "@crosslog/platform";
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
  formatTimeOffset,
  getCurrentDirectoryFile,
  logPaneReducer,
  restoreLogPaneStateFromSession,
  type DirectoryFileEntry,
  type FileSource,
  type Session,
  type SessionDirectorySource,
  type SessionFileSource,
} from "@crosslog/core";
import { ActivityRail } from "./ActivityRail";
import { ActivityRailShell } from "./ActivityRailShell";
import { CapabilityLimitations } from "./CapabilityLimitations";
import { EmptyWorkspace } from "./EmptyWorkspace";
import { copySelectedLogText, type ClipboardWriter } from "../log-pane/LogTextSelection";
import { PaneRail } from "../pane-rail/PaneRail";
import { usePaneSearchStore } from "../search/usePaneSearchStore";
import { SessionRecoveryBanner } from "../session/SessionRecoveryBanner";
import { useSessionRestore, useSessionSnapshotWriter } from "../session/useSessionRestore";
import { StatusBar } from "./StatusBar";
import { TimestampConfigError } from "../sync/TimestampConfigError";
import { Topbar } from "./Topbar";
import { resolveShellPresentation, type ShellPresentation } from "./shellPresentation";
import { redesignedShellTestIds, type RedesignedShellTestId } from "./testIds";
import { getPaneOffset, useSynchronizationStore } from "../sync/useSynchronizationStore";
import {
  getPaneHeaderLifecycleState,
  useFileLifecycleEvents,
  type FileSourceMap,
} from "../log-pane/useFileLifecycleEvents";

export interface AppShellProps {
  readonly platform: CrosslogPlatform;
  readonly renderMacosTrafficLights?: boolean;
  readonly shellPresentation?: ShellPresentation;
}

const uiTestClipboardWriter: ClipboardWriter = {
  writeText: async () => undefined,
};

export function AppShell({
  platform,
  renderMacosTrafficLights = true,
  shellPresentation: shellPresentationOverride,
}: AppShellProps) {
  const shellPresentation =
    shellPresentationOverride ?? resolveShellPresentation({ runtimeKind: platform.kind });
  const [state, dispatch] = React.useReducer(logPaneReducer, createLogPaneState());
  const [fileSources, setFileSources] = React.useState<FileSourceMap>(() => createInitialFileSources(platform.kind));
  const [uiTestEnabled, setUiTestEnabled] = React.useState(false);
  const [uiTestCopiedPaneTitle, setUiTestCopiedPaneTitle] = React.useState<string | null>(null);
  const [openSearchPaneId, setOpenSearchPaneId] = React.useState<string | null>(null);
  const [openTimeOffsetPaneId, setOpenTimeOffsetPaneId] = React.useState<string | null>(null);
  const [searchFocusRequestSequence, setSearchFocusRequestSequence] = React.useState(0);
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
  const restoreSynchronizationSessionState = useSynchronizationStore((store) => store.restoreSessionState);
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
      restoreSynchronizationSessionState(session);
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
          : fileSource?.readError || fileSource?.watchState === "failed"
            ? ("error" as const)
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
          lifecycleState: getPaneHeaderLifecycleState(fileSource),
        };
      }),
    [directorySource, fileSources, state.panes, syncOffsets, syncTargets, synchronizationEnabled, timestampService],
  );
  const sessionSnapshot = React.useMemo(
    () =>
      paneData.length === 0
        ? null
        : createSessionSnapshot({
            panes: paneData.map((entry) => entry.pane),
            fileSources: Object.values(fileSources),
            directorySources: [directorySource],
            synchronizationEnabled,
          }),
    [directorySource, fileSources, paneData, synchronizationEnabled],
  );

  const sessionSnapshotStatus = useSessionSnapshotWriter(
    platform.sessionStore,
    sessionSnapshot,
    restoreState.status === "ready" && paneData.length > 0,
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
  const openSearchPane = openSearchPaneId
    ? panes.find((entry) => entry.pane.id === openSearchPaneId) ?? null
    : null;
  const openTimeOffsetPane = openTimeOffsetPaneId
    ? panes.find((entry) => entry.pane.id === openTimeOffsetPaneId) ?? null
    : null;
  const openSearchState = openSearchPaneId ? searchStates[openSearchPaneId] ?? emptySearchState : null;
  const paneSearchStatus = openSearchPaneId ? (openSearchState?.error ? "error" : "open") : "closed";
  const timeOffsetPopoverStatus = openTimeOffsetPaneId ? "open" : "closed";
  const activePaneEntry = panes.find((entry) => entry.pane.id === state.activePaneId) ?? null;
  const activePaneOffsetLabel = activePaneEntry ? formatTimeOffset(activePaneEntry.pane.timeOffset) : null;
  const publishedDirectorySource = panes.find((entry) => entry.directorySource)?.directorySource ?? null;
  const publishedDirectorySelectedFile = publishedDirectorySource
    ? getCurrentDirectoryFile(publishedDirectorySource)
    : null;
  const publishedFileLifecycleSummary = formatFileLifecycleSummary(Object.values(fileSources));

  React.useEffect(() => {
    if (openSearchPaneId && !state.panes.some((pane) => pane.id === openSearchPaneId)) {
      setOpenSearchPaneId(null);
    }
  }, [openSearchPaneId, state.panes]);

  React.useEffect(() => {
    if (openTimeOffsetPaneId && !state.panes.some((pane) => pane.id === openTimeOffsetPaneId)) {
      setOpenTimeOffsetPaneId(null);
    }
  }, [openTimeOffsetPaneId, state.panes]);

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
      themeVariant: shellPresentation.themeVariant,
      platformShellVariant: shellPresentation.platformShellVariant,
      paneCount: panes.length,
      paneTitles: panes.map((entry) => entry.pane.title),
      activePaneTitle,
      synchronizationEnabled,
      paneSearchStatus,
      paneSearchPaneTitle: openSearchPane?.pane.title ?? null,
      timeOffsetPopoverStatus,
      timeOffsetPaneTitle: openTimeOffsetPane?.pane.title ?? null,
      activePaneOffsetLabel,
      copiedPaneTitle: uiTestCopiedPaneTitle,
      sessionSnapshotStatus,
      redesignedRegions: getPublishedRedesignedRegions(
        panes.length,
        openSearchPaneId !== null,
        openTimeOffsetPaneId !== null,
        shellPresentation.platformShellVariant,
        renderMacosTrafficLights,
      ),
      directoryName: publishedDirectorySource?.displayName ?? null,
      directorySelectedFileTitle: publishedDirectorySelectedFile?.name ?? null,
      directoryPreviousAvailable: Boolean(publishedDirectorySource?.navigationIndex.previousFileId),
      directoryNextAvailable: Boolean(publishedDirectorySource?.navigationIndex.nextFileId),
      directoryFileCount: publishedDirectorySource?.files.length ?? 0,
      directoryEmptyVisible: publishedDirectorySource?.files.length === 0,
      fileLifecycleSummary: publishedFileLifecycleSummary,
      obsoleteControlVisibility: getPublishedObsoleteControlVisibility(),
      workspaceLayout: getPublishedWorkspaceLayoutMeasurements(),
    });
  }, [
    activePaneTitle,
    openSearchPane,
    openSearchPaneId,
    openTimeOffsetPane,
    openTimeOffsetPaneId,
    panes,
    activePaneOffsetLabel,
    paneSearchStatus,
    platform.uiTestBridge,
    renderMacosTrafficLights,
    shellPresentation.platformShellVariant,
    shellPresentation.themeVariant,
    publishedDirectorySelectedFile,
    publishedDirectorySource,
    publishedFileLifecycleSummary,
    sessionSnapshotStatus,
    synchronizationEnabled,
    timeOffsetPopoverStatus,
    uiTestCopiedPaneTitle,
    uiTestEnabled,
  ]);

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

  const handleSearchOpenChange = React.useCallback((paneId: string, open: boolean) => {
    setOpenSearchPaneId((currentPaneId) => {
      if (open) {
        setOpenTimeOffsetPaneId(null);
        return paneId;
      }

      return currentPaneId === paneId ? null : currentPaneId;
    });
  }, []);

  const handleTimeOffsetOpenChange = React.useCallback((paneId: string, open: boolean) => {
    setOpenTimeOffsetPaneId((currentPaneId) => {
      if (open) {
        setOpenSearchPaneId(null);
        return paneId;
      }

      return currentPaneId === paneId ? null : currentPaneId;
    });
  }, []);

  const requestActivePaneSearch = React.useCallback(() => {
    const paneId = state.activePaneId ?? state.panes[0]?.id ?? null;

    if (!paneId) {
      return;
    }

    setOpenSearchPaneId(paneId);
    setOpenTimeOffsetPaneId(null);
    setSearchFocusRequestSequence((current) => current + 1);
  }, [state.activePaneId, state.panes]);

  const requestActivePaneTimeOffset = React.useCallback(() => {
    const paneId = state.activePaneId ?? state.panes[0]?.id ?? null;

    if (!paneId) {
      return;
    }

    setOpenSearchPaneId(null);
    setOpenTimeOffsetPaneId(paneId);
  }, [state.activePaneId, state.panes]);

  const getFileLifecycleTarget = React.useCallback(() => {
    if (activeFileSource && activePane) {
      return { paneId: activePane.id, source: activeFileSource };
    }

    const firstFilePane = state.panes.find((pane) => pane.sourceRef && fileSources[pane.sourceRef]);

    if (!firstFilePane?.sourceRef) {
      return null;
    }

    return {
      paneId: firstFilePane.id,
      source: fileSources[firstFilePane.sourceRef],
    };
  }, [activeFileSource, activePane, fileSources, state.panes]);

  const publishAppendForSource = React.useCallback((source: FileSource) => {
    publishFileLifecycleEvent({
      type: "FileAppended",
      sourceId: source.id,
      lines: [`2026-06-16T09:05:00.000Z ${source.displayName} live appended line ${liveAppendCounter.current++}`],
    });
  }, [publishFileLifecycleEvent]);

  const publishReplacementForSource = React.useCallback((source: FileSource) => {
    publishFileLifecycleEvent({
      type: "FileReplaced",
      sourceId: source.id,
      identity: `${source.fileIdentity.value}:replacement:${Date.now()}`,
      sizeBytes: 96,
      lines: [
        `2026-06-16T09:06:00.000Z ${source.displayName} replacement file started`,
        `2026-06-16T09:06:01.000Z ${source.displayName} replacement file ready`,
      ],
    });
  }, [publishFileLifecycleEvent]);

  const handleFileLifecycleTestAction = React.useCallback(
    (action: "append" | "delete" | "replace") => {
      const target = getFileLifecycleTarget();

      if (!target) {
        return;
      }

      dispatch({ type: "setActivePane", paneId: target.paneId });

      if (action === "append") {
        publishAppendForSource(target.source);
        return;
      }

      if (action === "delete") {
        publishFileLifecycleEvent({ type: "FileDeleted", sourceId: target.source.id });
        return;
      }

      publishReplacementForSource(target.source);
    },
    [getFileLifecycleTarget, publishAppendForSource, publishFileLifecycleEvent, publishReplacementForSource],
  );

  const firstPaneEntry = panes[0] ?? null;
  const executeUiTestAction = React.useCallback(
    (action: UiTestAction) => {
      switch (action) {
        case "openSampleLogs":
          if (state.panes.length === 0) {
            samplePanes.forEach((pane) => dispatch({ type: "addPane", pane }));
          }
          break;
        case "copyFirstPane":
          if (firstPaneEntry) {
            void copySelectedLogText(firstPaneEntry.lines, undefined, uiTestClipboardWriter).then(() => {
              setUiTestCopiedPaneTitle(firstPaneEntry.pane.title);
            });
          }
          break;
        case "toggleSynchronization":
          handleSynchronizationEnabledChange(!synchronizationEnabled);
          break;
        case "openActivePaneSearch":
          requestActivePaneSearch();
          break;
        case "setActivePaneInvalidSearch": {
          const paneId = state.activePaneId ?? state.panes[0]?.id ?? null;

          if (paneId) {
            setOpenSearchPaneId(paneId);
            setOpenTimeOffsetPaneId(null);
            setSearchFocusRequestSequence((current) => current + 1);
            setSearchMode(paneId, "regex");
            setSearchQuery(paneId, "[broken");
          }
          break;
        }
        case "openEmptyDirectory":
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
          break;
        case "navigatePreviousDirectoryFile":
          dispatchDirectorySource({ type: "navigate", direction: "previous" });
          break;
        case "navigateNextDirectoryFile":
          dispatchDirectorySource({ type: "navigate", direction: "next" });
          break;
        case "discoverNewerDirectoryFile":
          dispatchDirectorySource({
            type: "addFiles",
            files: [newerDirectoryFile],
          });
          break;
        case "openActivePaneTimeOffset":
          requestActivePaneTimeOffset();
          break;
        case "setActivePaneTimeOffset": {
          const paneId = state.activePaneId ?? state.panes[0]?.id ?? null;

          if (paneId) {
            setPaneOffset(paneId, {
              days: 0,
              hours: 0,
              minutes: 1,
              seconds: 0,
              milliseconds: 0,
            });
            setOpenTimeOffsetPaneId(null);
          }
          break;
        }
        case "appendActiveFile":
          handleFileLifecycleTestAction("append");
          break;
        case "deleteActiveFile":
          handleFileLifecycleTestAction("delete");
          break;
        case "replaceActiveFile":
          handleFileLifecycleTestAction("replace");
          break;
      }
    },
    [
      firstPaneEntry,
      handleFileLifecycleTestAction,
      handleSynchronizationEnabledChange,
      requestActivePaneSearch,
      requestActivePaneTimeOffset,
      setPaneOffset,
      setSearchMode,
      setSearchQuery,
      state.activePaneId,
      state.panes,
      synchronizationEnabled,
    ],
  );
  const executeUiTestActionRef = React.useRef(executeUiTestAction);

  React.useEffect(() => {
    executeUiTestActionRef.current = executeUiTestAction;
  }, [executeUiTestAction]);

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
          executeUiTestActionRef.current(action);
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
  }, [platform.uiTestBridge, uiTestEnabled]);

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

  const handleDrop = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    void platform.dragDropSource.mapDroppedSources(event.nativeEvent).then(openDroppedSources);
  };

  const handleOpenSampleLogs = () => {
    samplePanes.forEach((pane) => dispatch({ type: "addPane", pane }));
  };

  const handleAddPane = () => {
    const rightmostPane = state.panes.at(-1);

    if (rightmostPane) {
      dispatch({
        type: "splitPane",
        paneId: rightmostPane.id,
        pane: createAddedPane(state.nextPaneNumber),
      });
      return;
    }

    dispatch({ type: "addPane", pane: createAddedPane(state.nextPaneNumber) });
  };

  const handleOpenSourcesFromRail = () => {
    if (state.panes.length === 0) {
      handleOpenSampleLogs();
      return;
    }

    handleAddPane();
  };

  const statusMessage =
    unsupportedPaneCount > 0
      ? `${unsupportedPaneCount} untimed ${unsupportedPaneCount === 1 ? "pane" : "panes"} excluded`
      : null;
  const paneWorkspace =
    state.panes.length === 0 ? (
      <EmptyWorkspace
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        onFilesSelected={platform.kind === "web" ? handleBrowserFileInput : undefined}
        onOpenSource={handleOpenSampleLogs}
      />
    ) : (
      <PaneRail
        panes={panes}
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
        openSearchPaneId={openSearchPaneId}
        openTimeOffsetPaneId={openTimeOffsetPaneId}
        searchFocusRequestSequence={searchFocusRequestSequence}
        onSearchOpenChange={handleSearchOpenChange}
        onTimeOffsetOpenChange={handleTimeOffsetOpenChange}
        onCopied={setUiTestCopiedPaneTitle}
        clipboard={uiTestEnabled ? uiTestClipboardWriter : undefined}
      />
    );

  return (
    <ActivityRailShell
      activityRail={
        <ActivityRail
          onOpenSources={handleOpenSourcesFromRail}
          onSearch={requestActivePaneSearch}
          onSettings={() => undefined}
        />
      }
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      paneWorkspace={paneWorkspace}
      platformShellVariant={shellPresentation.platformShellVariant}
      renderMacosTrafficLights={renderMacosTrafficLights}
      statusBar={
        <StatusBar
          activeSourceLabel={activePaneTitle}
          message={statusMessage}
          paneCount={state.panes.length}
          syncEnabled={synchronizationEnabled}
        />
      }
      systemBanners={
        <>
          <SessionRecoveryBanner message={restoreState.message} />
          <CapabilityLimitations limitations={platform.capabilities.limitations} />
          <TimestampConfigError message={null} />
        </>
      }
      themeVariant={shellPresentation.themeVariant}
      topbar={
        <Topbar
          syncEnabled={synchronizationEnabled}
          onAddPane={handleAddPane}
          onCommandSearch={requestActivePaneSearch}
          onSyncEnabledChange={handleSynchronizationEnabledChange}
        />
      }
    />
  );
}

function getPublishedRedesignedRegions(
  paneCount: number,
  searchOpen: boolean,
  timeOffsetOpen: boolean,
  platformShellVariant: ShellPresentation["platformShellVariant"],
  renderMacosTrafficLights: boolean,
): readonly string[] {
  const platformChromeRegion = getPlatformChromeRegion(platformShellVariant, renderMacosTrafficLights);
  const persistentRegions = [
    redesignedShellTestIds.crosslogShell,
    redesignedShellTestIds.topbar,
    redesignedShellTestIds.commandField,
    redesignedShellTestIds.themeVariant,
    redesignedShellTestIds.platformChrome,
    redesignedShellTestIds.platformChromeTitle,
    platformChromeRegion,
    redesignedShellTestIds.activityRail,
    redesignedShellTestIds.paneWorkspace,
    redesignedShellTestIds.statusBar,
  ].filter(Boolean) as RedesignedShellTestId[];

  if (paneCount === 0) {
    return [
      ...persistentRegions,
      redesignedShellTestIds.emptyWorkspace,
      redesignedShellTestIds.emptyDropZone,
      redesignedShellTestIds.emptyOpenSource,
    ];
  }

  const nonEmptyRegions = [
    ...persistentRegions,
    redesignedShellTestIds.workspaceScrollbar,
    redesignedShellTestIds.logPane,
    redesignedShellTestIds.paneHeader,
    redesignedShellTestIds.logViewport,
  ];

  return [
    ...nonEmptyRegions,
    ...(paneCount > 1 ? [redesignedShellTestIds.paneResizeBoundary] : []),
    ...(searchOpen ? [redesignedShellTestIds.paneSearchPopover] : []),
    ...(timeOffsetOpen ? [redesignedShellTestIds.timeOffsetPopover] : []),
  ];
}

function getPlatformChromeRegion(
  platformShellVariant: ShellPresentation["platformShellVariant"],
  renderMacosTrafficLights: boolean,
): RedesignedShellTestId | null {
  switch (platformShellVariant) {
    case "macos":
      return renderMacosTrafficLights ? redesignedShellTestIds.platformChromeMacosTrafficLights : null;
    case "windows":
      return redesignedShellTestIds.platformChromeWindowsCaptionControls;
    case "linux":
      return redesignedShellTestIds.platformChromeLinuxCaptionControls;
    case "web":
      return redesignedShellTestIds.platformChromeWebTitle;
  }
}

function getPublishedObsoleteControlVisibility(): UiTestObsoleteControlVisibility {
  return {
    workspaceToolbar:
      hasVisibleSelector(".crosslog-workspace-actions") ||
      hasVisibleTestId(redesignedShellTestIds.obsoleteWorkspaceToolbar),
    paneCopyToolbar:
      hasVisibleSelector(".crosslog-pane-tools") ||
      hasVisibleSelector(".crosslog-log-text-selection__copy") ||
      hasVisibleTestId(redesignedShellTestIds.obsoletePaneCopyToolbar),
    discoverNewerDirectoryFile: hasVisibleButtonText("Discover newer directory file"),
    appendLiveLine: hasVisibleButtonText("Append live line"),
    deleteActiveFile: hasVisibleButtonText("Delete active file"),
    replaceActiveFile: hasVisibleButtonText("Replace active file"),
    splitButton:
      hasVisibleTestId(redesignedShellTestIds.obsoleteSplitButton) ||
      hasVisibleButtonText("Split") ||
      hasVisibleAriaLabel("Split active pane"),
    synchronizeByTimeText: hasVisibleText("Synchronize by time"),
    syncStateText: hasVisibleSelector(".crosslog-topbar__sync-state"),
    resizeDecreaseButton:
      hasVisibleTestId(redesignedShellTestIds.obsoleteResizeDecrease) ||
      hasVisibleAriaLabelContaining("Move boundary after", "left"),
    resizeIncreaseButton:
      hasVisibleTestId(redesignedShellTestIds.obsoleteResizeIncrease) ||
      hasVisibleAriaLabelContaining("Move boundary after", "right"),
    paneReadyFooter:
      hasVisibleSelector(".crosslog-pane-status") ||
      hasVisibleTestId(redesignedShellTestIds.obsoletePaneReadyFooter),
  };
}

function getPublishedWorkspaceLayoutMeasurements(): UiTestWorkspaceLayoutMeasurements {
  if (typeof document === "undefined") {
    return emptyWorkspaceLayoutMeasurements;
  }

  const workspace = queryTestElement(redesignedShellTestIds.paneWorkspace);

  if (!workspace) {
    return emptyWorkspaceLayoutMeasurements;
  }

  const panes = queryAllTestElements(redesignedShellTestIds.logPane);
  const rightmostPane = panes.at(-1) ?? null;
  const workspaceRect = workspace.getBoundingClientRect();
  const rightmostPaneRect = rightmostPane?.getBoundingClientRect() ?? null;
  const workspaceWidthPx = normalizeMeasurement(workspaceRect.width);
  const workspaceContentWidthPx = normalizeMeasurement(workspace.scrollWidth);
  const workspaceRightPx = normalizeMeasurement(workspaceRect.right);
  const rightmostPaneRightPx = rightmostPaneRect ? normalizeMeasurement(rightmostPaneRect.right) : null;
  const rightEdgeGapPx =
    workspaceRightPx === null || rightmostPaneRightPx === null
      ? null
      : Math.max(0, Math.round(workspaceRightPx - rightmostPaneRightPx));

  return {
    workspaceWidthPx,
    workspaceContentWidthPx,
    workspaceRightPx,
    rightmostPaneRightPx,
    rightEdgeGapPx,
    rightmostPaneAlignedToWorkspace: rightEdgeGapPx === null ? null : rightEdgeGapPx <= 1,
    horizontalOverflow: workspace.scrollWidth > workspace.clientWidth + 1,
  };
}

const emptyWorkspaceLayoutMeasurements: UiTestWorkspaceLayoutMeasurements = {
  workspaceWidthPx: null,
  workspaceContentWidthPx: null,
  workspaceRightPx: null,
  rightmostPaneRightPx: null,
  rightEdgeGapPx: null,
  rightmostPaneAlignedToWorkspace: null,
  horizontalOverflow: false,
};

function queryTestElement(testId: RedesignedShellTestId): HTMLElement | null {
  if (typeof document === "undefined") {
    return null;
  }

  return document.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
}

function queryAllTestElements(testId: RedesignedShellTestId): readonly HTMLElement[] {
  if (typeof document === "undefined") {
    return [];
  }

  return Array.from(document.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`));
}

function hasVisibleTestId(testId: RedesignedShellTestId): boolean {
  return Boolean(queryAllTestElements(testId).find(isVisibleElement));
}

function hasVisibleSelector(selector: string): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  return Boolean(Array.from(document.querySelectorAll<HTMLElement>(selector)).find(isVisibleElement));
}

function hasVisibleButtonText(text: string): boolean {
  return getVisibleElements("button,[role='button']").some((element) => normalizeText(element.textContent) === text);
}

function hasVisibleText(text: string): boolean {
  return getVisibleElements("body *").some((element) => normalizeText(element.textContent).includes(text));
}

function hasVisibleAriaLabel(label: string): boolean {
  return getVisibleElements("[aria-label]").some((element) => element.getAttribute("aria-label") === label);
}

function hasVisibleAriaLabelContaining(prefix: string, suffix: string): boolean {
  return getVisibleElements("[aria-label]").some((element) => {
    const label = element.getAttribute("aria-label") ?? "";

    return label.includes(prefix) && label.includes(suffix);
  });
}

function getVisibleElements(selector: string): readonly HTMLElement[] {
  if (typeof document === "undefined") {
    return [];
  }

  return Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(isVisibleElement);
}

function isVisibleElement(element: HTMLElement): boolean {
  if (element.hidden || element.getAttribute("aria-hidden") === "true") {
    return false;
  }

  const style = globalThis.getComputedStyle?.(element);

  return style?.display !== "none" && style?.visibility !== "hidden";
}

function normalizeText(text: string | null): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

function normalizeMeasurement(value: number): number | null {
  return Number.isFinite(value) ? Math.round(value) : null;
}

function formatFileLifecycleSummary(fileSources: readonly FileSource[]): string {
  if (fileSources.length === 0) {
    return "none";
  }

  return fileSources
    .map((source) => `${source.displayName}:${getFileLifecycleKind(source)}`)
    .sort()
    .join(",");
}

function getFileLifecycleKind(source: FileSource): "live" | "deleted" | "replaced" | "unsupported" | "error" {
  if (source.readError || source.watchState === "failed") {
    return "error";
  }

  if (source.deleted) {
    return "deleted";
  }

  if (source.replaced) {
    return "replaced";
  }

  if (source.watchState === "unsupported") {
    return "unsupported";
  }

  return "live";
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

const uiTestActionPollIntervalMs = 100;

function createAddedPane(nextPaneNumber: number) {
  return {
    title: `adhoc-${nextPaneNumber}.log`,
    sourceRef: null,
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
