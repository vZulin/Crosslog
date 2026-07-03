import React from "react";
import type {
  CrosslogPlatform,
  UiTestDarkThemeColorEvidence,
  UiTestFutureControlState,
  UiTestIconCenteringEvidence,
  UiTestObsoleteControlVisibility,
  UiTestCopyActionEvidence,
  UiTestPaneNavigationEvidence,
  UiTestSearchHighlightEvidence,
  UiTestSourceKind,
  UiTestSourceOpeningEntryPoint,
  UiTestSourceOpeningEvidence,
  UiTestTimeOffsetValidationEvidence,
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
  validateTimeOffsetDraft,
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
import { SettingsSurface } from "./SettingsSurface";
import { TimestampConfigError } from "../sync/TimestampConfigError";
import { Topbar } from "./Topbar";
import {
  defaultThemePreference,
  resolveShellPresentation,
  resolveSystemThemeVariant,
  resolveThemePreferenceVariant,
  systemThemeMediaQuery,
  type ShellPresentation,
  type ThemePreference,
  type ThemeVariant,
} from "./shellPresentation";
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
  readonly useShellPresentationTheme?: boolean;
}

const uiTestClipboardWriter: ClipboardWriter = {
  writeText: async () => undefined,
};

export function AppShell({
  platform,
  renderMacosTrafficLights = true,
  shellPresentation: shellPresentationOverride,
  useShellPresentationTheme = true,
}: AppShellProps) {
  const shellPresentation =
    shellPresentationOverride ?? resolveShellPresentation({ runtimeKind: platform.kind });
  const systemThemeVariant = useSystemThemeVariant();
  const [themePreference, setThemePreference] = React.useState<ThemePreference>(defaultThemePreference);
  const resolvedProductThemeVariant = resolveThemePreferenceVariant(themePreference, systemThemeVariant);
  const effectiveThemeVariant =
    useShellPresentationTheme && shellPresentationOverride
      ? shellPresentation.themeVariant
      : resolvedProductThemeVariant;
  const [state, dispatch] = React.useReducer(logPaneReducer, createLogPaneState());
  const [fileSources, setFileSources] = React.useState<FileSourceMap>(() => createInitialFileSources(platform.kind));
  const [uiTestEnabled, setUiTestEnabled] = React.useState(false);
  const [uiTestCopiedPaneTitle, setUiTestCopiedPaneTitle] = React.useState<string | null>(null);
  const [sourceOpeningEvidence, setSourceOpeningEvidence] = React.useState<UiTestSourceOpeningEvidence>(
    initialSourceOpeningEvidence,
  );
  const [uiTestCopyActionPublishSequence, setUiTestCopyActionPublishSequence] = React.useState(0);
  const [openSearchPaneId, setOpenSearchPaneId] = React.useState<string | null>(null);
  const [openTimeOffsetPaneId, setOpenTimeOffsetPaneId] = React.useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [searchFocusRequestSequence, setSearchFocusRequestSequence] = React.useState(0);
  const settingsButtonRef = React.useRef<HTMLButtonElement>(null);
  const liveAppendCounter = React.useRef(1);
  const openDroppedSourcesRef = React.useRef<(sources: readonly DragDropSource[]) => void>(() => {});
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
  const searchHighlightVisibility = usePaneSearchStore((store) => store.highlightVisibility);
  const setPaneSearchLines = usePaneSearchStore((store) => store.setPaneLines);
  const setSearchQuery = usePaneSearchStore((store) => store.setQuery);
  const setSearchMode = usePaneSearchStore((store) => store.setMode);
  const setSearchCaseSensitive = usePaneSearchStore((store) => store.setCaseSensitive);
  const selectPreviousSearchMatch = usePaneSearchStore((store) => store.selectPreviousMatch);
  const selectNextSearchMatch = usePaneSearchStore((store) => store.selectNextMatch);
  const showSearchHighlights = usePaneSearchStore((store) => store.showHighlights);
  const hideSearchHighlights = usePaneSearchStore((store) => store.hideHighlights);
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
    searchHighlightsVisible: searchHighlightVisibility[entry.pane.id] ?? false,
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
      themeVariant: effectiveThemeVariant,
      themePreference,
      platformShellVariant: shellPresentation.platformShellVariant,
      paneCount: panes.length,
      paneTitles: panes.map((entry) => entry.pane.title),
      activePaneTitle,
      synchronizationEnabled,
      syncVisualState: synchronizationEnabled ? "active" : "inactive",
      syncPressedState: synchronizationEnabled,
      paneSearchStatus,
      paneSearchPaneTitle: openSearchPane?.pane.title ?? null,
      timeOffsetPopoverStatus,
      timeOffsetPaneTitle: openTimeOffsetPane?.pane.title ?? null,
      settingsSurfaceStatus: settingsOpen ? "open" : "closed",
      activePaneOffsetLabel,
      copiedPaneTitle: uiTestCopiedPaneTitle,
      sessionSnapshotStatus,
      redesignedRegions: getPublishedRedesignedRegions(
        panes.length,
        openSearchPaneId !== null,
        openTimeOffsetPaneId !== null,
        settingsOpen,
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
      darkThemeColors: getPublishedDarkThemeColorEvidence(effectiveThemeVariant),
      iconCentering: getPublishedIconCenteringEvidence(),
      paneNavigation: getPublishedPaneNavigationEvidence(panes.map((entry) => entry.pane.title)),
      sourceOpening: sourceOpeningEvidence,
      searchHighlights: getPublishedSearchHighlightEvidence(),
      copyAction: getPublishedCopyActionEvidence(),
      timeOffsetValidation: getPublishedTimeOffsetValidationEvidence(),
      futureControls: publishedFutureControlState,
    });
  }, [
    activePaneTitle,
    effectiveThemeVariant,
    openSearchPane,
    openSearchPaneId,
    openTimeOffsetPane,
    openTimeOffsetPaneId,
    panes,
    activePaneOffsetLabel,
    paneSearchStatus,
    platform.uiTestBridge,
    renderMacosTrafficLights,
    settingsOpen,
    shellPresentation.platformShellVariant,
    publishedDirectorySelectedFile,
    publishedDirectorySource,
    publishedFileLifecycleSummary,
    sessionSnapshotStatus,
    sourceOpeningEvidence,
    searchHighlightVisibility,
    synchronizationEnabled,
    themePreference,
    timeOffsetPopoverStatus,
    uiTestCopyActionPublishSequence,
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
    if (open) {
      setOpenTimeOffsetPaneId(null);
      showSearchHighlights(paneId);
      setOpenSearchPaneId(paneId);
      return;
    }

    hideSearchHighlights(paneId);
    setOpenSearchPaneId((currentPaneId) => (currentPaneId === paneId ? null : currentPaneId));
  }, [hideSearchHighlights, showSearchHighlights]);

  const handleTimeOffsetOpenChange = React.useCallback((paneId: string, open: boolean) => {
    if (open) {
      if (openSearchPaneId) {
        hideSearchHighlights(openSearchPaneId);
      }
      setOpenSearchPaneId(null);
      setOpenTimeOffsetPaneId(paneId);
      return;
    }

    setOpenTimeOffsetPaneId((currentPaneId) => (currentPaneId === paneId ? null : currentPaneId));
  }, [hideSearchHighlights, openSearchPaneId]);

  const handleSettingsOpen = React.useCallback(() => {
    setSettingsOpen(true);
  }, []);

  const handleSettingsClose = React.useCallback(() => {
    setSettingsOpen(false);
    globalThis.setTimeout(() => settingsButtonRef.current?.focus(), 0);
  }, []);

  const handleThemePreferenceChange = React.useCallback((nextThemePreference: ThemePreference) => {
    setThemePreference(nextThemePreference);
  }, []);

  const requestActivePaneSearch = React.useCallback(() => {
    const paneId = state.activePaneId ?? state.panes[0]?.id ?? null;

    if (!paneId) {
      return;
    }

    setOpenSearchPaneId(paneId);
    setOpenTimeOffsetPaneId(null);
    showSearchHighlights(paneId);
    setSearchFocusRequestSequence((current) => current + 1);
  }, [showSearchHighlights, state.activePaneId, state.panes]);

  const requestActivePaneTimeOffset = React.useCallback(() => {
    const paneId = state.activePaneId ?? state.panes[0]?.id ?? null;

    if (!paneId) {
      return;
    }

    if (openSearchPaneId) {
      hideSearchHighlights(openSearchPaneId);
    }
    setOpenSearchPaneId(null);
    setOpenTimeOffsetPaneId(paneId);
  }, [hideSearchHighlights, openSearchPaneId, state.activePaneId, state.panes]);

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
            setSourceOpeningEvidence((current) => ({
              ...current,
              status: "opened",
              entryPoint: "ui-test-fixture",
              selectedSourceKind: "mixed",
              fixtureSamplePaneCount: current.fixtureSamplePaneCount + samplePanes.length,
            }));
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
        case "openSettings":
          handleSettingsOpen();
          break;
        case "closeSettings":
          handleSettingsClose();
          break;
        case "setThemeSystem":
          setThemePreference("system");
          break;
        case "setThemeLight":
          setThemePreference("light");
          break;
        case "setThemeDark":
          setThemePreference("dark");
          break;
        case "reorderFirstPaneAfterSecond":
          if (state.panes.length >= 2) {
            dispatch({ type: "reorderPane", paneId: state.panes[0].id, targetIndex: 1 });
          }
          break;
        case "dropNativeSampleSource":
          // Exercises the native drag-drop wiring (openDroppedSources → pane)
          // that native OS drops trigger via subscribeToNativeDrops. The real
          // OS drag gesture is verified by the manual/interactive runner.
          openDroppedSourcesRef.current([
            {
              type: "file",
              source: { id: "desktop-drop-sample", name: "dropped-native.log" },
            },
          ]);
          break;
        case "keyboardNavigateActivePaneDown":
          dispatchNavigationEventToActiveViewport("keyboard");
          break;
        case "wheelNavigateActivePaneDown":
          dispatchNavigationEventToActiveViewport("wheel");
          break;
        case "openActivePaneSearch":
          requestActivePaneSearch();
          break;
        case "setActivePaneSearchQuery": {
          const paneId = state.activePaneId ?? state.panes[0]?.id ?? null;

          if (paneId) {
            setOpenSearchPaneId(paneId);
            setOpenTimeOffsetPaneId(null);
            showSearchHighlights(paneId);
            setSearchMode(paneId, "text");
            setSearchQuery(paneId, "line 180 token=outside-viewport");
          }
          break;
        }
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
        case "closeActivePaneSearch":
          if (openSearchPaneId) {
            hideSearchHighlights(openSearchPaneId);
          }
          setOpenSearchPaneId(null);
          break;
        case "showFirstPaneCopyMenu":
          dispatchCopyMenuEventToFirstPane("contextmenu");
          setUiTestCopyActionPublishSequence((current) => current + 1);
          break;
        case "dismissCopyMenu":
          dispatchCopyMenuEventToFirstPane("dismiss");
          setUiTestCopyActionPublishSequence((current) => current + 1);
          break;
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
      handleSettingsClose,
      handleSettingsOpen,
      handleSynchronizationEnabledChange,
      hideSearchHighlights,
      openSearchPaneId,
      requestActivePaneSearch,
      requestActivePaneTimeOffset,
      setPaneOffset,
      setSearchMode,
      setSearchQuery,
      showSearchHighlights,
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
        title: result.source.displayName,
        sourceRef: result.source.id,
        width: 520,
        status: "ready",
      },
    });
  };

  const openDirectorySource = async (sourceRef: DirectorySourceRef) => {
    const files = await platform.directoryAccess.listTopLevelFiles(sourceRef);

    dispatchDirectorySource({
      type: "replaceSource",
      source: createDirectorySource({
        id: directorySource.id,
        directoryIdentity: { value: sourceRef.id, platform: platform.kind },
        displayName: sourceRef.name,
        files,
        watchState: platform.capabilities.canDiscoverNewDirectoryFiles ? "watching" : "unsupported",
      }),
    });
    dispatch({
      type: "addPane",
      pane: {
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

    if (sources.length > 0) {
      publishOpenedSources("drag-drop", getSourceKind(sources), sources.length);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void platform.dragDropSource.mapDroppedSources(event.nativeEvent).then(openDroppedSources);
  };

  openDroppedSourcesRef.current = openDroppedSources;

  // Native OS drops (Tauri) bypass the DOM drop event, so subscribe to the
  // platform's native drag-drop channel when the adapter provides one. The
  // browser adapter has no such channel and keeps using handleDrop above.
  React.useEffect(() => {
    const dragDropSource = platform.dragDropSource;

    if (!dragDropSource.subscribeToNativeDrops) {
      return;
    }

    let disposed = false;
    let unsubscribe: (() => void) | null = null;

    void dragDropSource
      .subscribeToNativeDrops((sources) => {
        void openDroppedSourcesRef.current(sources);
      })
      .then((dispose) => {
        if (disposed) {
          dispose();
          return;
        }
        unsubscribe = dispose;
      });

    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [platform.dragDropSource]);

  const publishSourceSelectionStarted = (entryPoint: UiTestSourceOpeningEntryPoint) => {
    setSourceOpeningEvidence((current) => ({
      ...current,
      status: "pending",
      entryPoint,
      selectedSourceKind: "none",
      pickerRequestCount: current.pickerRequestCount + 1,
    }));
  };

  const publishSourceSelectionCancelled = (entryPoint: UiTestSourceOpeningEntryPoint) => {
    setSourceOpeningEvidence((current) => ({
      ...current,
      status: "cancelled",
      entryPoint,
      selectedSourceKind: "none",
      cancelledPickerCount: current.cancelledPickerCount + 1,
    }));
  };

  const publishOpenedSources = (
    entryPoint: UiTestSourceOpeningEntryPoint,
    selectedSourceKind: UiTestSourceKind,
    sourceCount: number,
  ) => {
    setSourceOpeningEvidence((current) => ({
      ...current,
      status: "opened",
      entryPoint,
      selectedSourceKind,
      openedSourceCount: current.openedSourceCount + sourceCount,
    }));
  };

  const requestSourceSelection = async (
    entryPoint: UiTestSourceOpeningEntryPoint,
    sourceKind: "file" | "directory" | "auto" = "auto",
  ) => {
    publishSourceSelectionStarted(entryPoint);

    try {
      if (sourceKind !== "directory") {
        const selectedFiles = await platform.sourcePicker.pickFiles();

        if (selectedFiles.length > 0) {
          for (const selectedFile of selectedFiles) {
            await openFileSource(selectedFile);
          }
          publishOpenedSources(entryPoint, "file", selectedFiles.length);
          return;
        }

        if (sourceKind === "file") {
          publishSourceSelectionCancelled(entryPoint);
          return;
        }
      }

      const selectedDirectory = await platform.sourcePicker.pickDirectory();

      if (selectedDirectory) {
        await openDirectorySource(selectedDirectory);
        publishOpenedSources(entryPoint, "directory", 1);
        return;
      }

      publishSourceSelectionCancelled(entryPoint);
    } catch {
      setSourceOpeningEvidence((current) => ({
        ...current,
        status: "error",
        entryPoint,
        selectedSourceKind: "none",
      }));
    }
  };

  const handleOpenSource = () => {
    void requestSourceSelection("empty-workspace");
  };

  const handleAddPane = () => {
    void requestSourceSelection("topbar-add-pane");
  };

  const handleOpenFile = () => {
    void requestSourceSelection("empty-workspace", "file");
  };

  const handleOpenDirectory = () => {
    void requestSourceSelection("empty-workspace", "directory");
  };

  const handleAddFile = () => {
    void requestSourceSelection("topbar-add-pane", "file");
  };

  const handleAddDirectory = () => {
    void requestSourceSelection("topbar-add-pane", "directory");
  };

  // Every platform offers explicit File/Directory open actions (see
  // docs/mockups/crosslog-macos-redesign-mockups.html). Native file dialogs on
  // Windows/Linux cannot choose files and folders in one dialog, so the choice
  // is made before the picker opens on desktop too — matching the web app.
  const offerSourceKindOptions = true;

  const statusMessage =
    unsupportedPaneCount > 0
      ? `${unsupportedPaneCount} untimed ${unsupportedPaneCount === 1 ? "pane" : "panes"} excluded`
      : null;
  const paneWorkspace =
    state.panes.length === 0 ? (
      <EmptyWorkspace
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        onOpenSource={handleOpenSource}
        showSourceKindOptions={offerSourceKindOptions}
        onOpenFile={handleOpenFile}
        onOpenDirectory={handleOpenDirectory}
      />
    ) : (
      <PaneRail
        panes={panes}
        onClosePane={(paneId) => dispatch({ type: "closePane", paneId })}
        onActivatePane={(paneId) => dispatch({ type: "setActivePane", paneId })}
        onResizePane={(leftPaneId, delta) => dispatch({ type: "resizePane", leftPaneId, delta })}
        onReorderPane={(paneId, targetIndex) => dispatch({ type: "reorderPane", paneId, targetIndex })}
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
          activeItemId={settingsOpen ? "settings" : null}
          onSettings={handleSettingsOpen}
          settingsButtonRef={settingsButtonRef}
        />
      }
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      paneWorkspace={paneWorkspace}
      platformShellVariant={shellPresentation.platformShellVariant}
      popovers={
        settingsOpen ? (
          <SettingsSurface
            onClose={handleSettingsClose}
            onThemePreferenceChange={handleThemePreferenceChange}
            resolvedThemeVariant={effectiveThemeVariant}
            returnFocusRef={settingsButtonRef}
            themePreference={themePreference}
          />
        ) : null
      }
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
      themeVariant={effectiveThemeVariant}
      topbar={
        <Topbar
          syncEnabled={synchronizationEnabled}
          onAddPane={handleAddPane}
          onSyncEnabledChange={handleSynchronizationEnabledChange}
          showSourceKindOptions={offerSourceKindOptions}
          onAddFile={handleAddFile}
          onAddDirectory={handleAddDirectory}
        />
      }
    />
  );
}

function useSystemThemeVariant(): ThemeVariant {
  const [systemThemeVariant, setSystemThemeVariant] = React.useState<ThemeVariant>(() => readSystemThemeVariant());

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQueryList = window.matchMedia(systemThemeMediaQuery);
    const updateThemeVariant = () => setSystemThemeVariant(resolveSystemThemeVariant(mediaQueryList.matches));

    if (typeof mediaQueryList.addEventListener === "function") {
      mediaQueryList.addEventListener("change", updateThemeVariant);
      return () => mediaQueryList.removeEventListener("change", updateThemeVariant);
    }

    if (typeof mediaQueryList.addListener === "function") {
      mediaQueryList.addListener(updateThemeVariant);
      return () => mediaQueryList.removeListener(updateThemeVariant);
    }
  }, []);

  return systemThemeVariant;
}

function readSystemThemeVariant(): ThemeVariant {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return resolveSystemThemeVariant(null);
  }

  return resolveSystemThemeVariant(window.matchMedia(systemThemeMediaQuery).matches);
}

function getPublishedRedesignedRegions(
  paneCount: number,
  searchOpen: boolean,
  timeOffsetOpen: boolean,
  settingsOpen: boolean,
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
      redesignedShellTestIds.emptyOpenFile,
      redesignedShellTestIds.emptyOpenDirectory,
      ...(settingsOpen ? [redesignedShellTestIds.settingsSurface] : []),
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
    ...(settingsOpen ? [redesignedShellTestIds.settingsSurface] : []),
  ];
}

function getPublishedTimeOffsetValidationEvidence(): UiTestTimeOffsetValidationEvidence {
  const validBoundary = validateTimeOffsetDraft({
    days: "123456",
    hours: "23",
    minutes: "59",
    seconds: "59",
    milliseconds: "999",
  });
  const invalidBoundary = validateTimeOffsetDraft({
    days: "0",
    hours: "24",
    minutes: "60",
    seconds: "60",
    milliseconds: "1000",
  });
  const blankDraft = validateTimeOffsetDraft({
    days: "",
    hours: "",
    minutes: "",
    seconds: "",
    milliseconds: "",
  });

  return {
    validBoundaryAccepted: validBoundary.valid,
    invalidBoundaryRejected: !invalidBoundary.valid,
    blankFieldAppliesAsZero:
      blankDraft.valid &&
      blankDraft.offset.days === 0 &&
      blankDraft.offset.hours === 0 &&
      blankDraft.offset.minutes === 0 &&
      blankDraft.offset.seconds === 0 &&
      blankDraft.offset.milliseconds === 0,
    invalidFields: invalidBoundary.valid ? [] : invalidBoundary.errors.map((error) => error.field),
  };
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

function getPublishedDarkThemeColorEvidence(themeVariant: ThemeVariant): UiTestDarkThemeColorEvidence {
  if (typeof document === "undefined" || themeVariant !== "dark") {
    return emptyDarkThemeColorEvidence;
  }

  const mismatchedSurfaces = darkThemeColorExpectations.flatMap((expectation) => {
    const element = document.querySelector<HTMLElement>(expectation.selector);

    if (!element) {
      return [expectation.name];
    }

    const actualValue = globalThis.getComputedStyle(element)[expectation.property];

    return actualValue === expectation.expectedValue ? [] : [expectation.name];
  });

  return {
    matchesAuthoritativeMockup: mismatchedSurfaces.length === 0,
    mismatchedSurfaces,
  };
}

function getPublishedIconCenteringEvidence(): UiTestIconCenteringEvidence {
  if (typeof document === "undefined") {
    return emptyIconCenteringEvidence;
  }

  const offCenterControls = iconCenteringSelectors.flatMap((selector) =>
    getVisibleElements(selector.selector).flatMap((element, index) => {
      const icon = element.querySelector<SVGSVGElement>("svg");

      if (!icon) {
        return [];
      }

      return isIconCenteredWithinControl(element, icon) ? [] : [`${selector.name}:${index}`];
    }),
  );

  return {
    allCentered: offCenterControls.length === 0,
    offCenterControls,
  };
}

function getPublishedPaneNavigationEvidence(paneOrder: readonly string[]): UiTestPaneNavigationEvidence {
  if (typeof document === "undefined") {
    return emptyPaneNavigationEvidence;
  }

  const viewports = queryAllTestElements(redesignedShellTestIds.logViewport);
  const activeViewport = getActiveViewportElement() ?? viewports[0] ?? null;
  const syncTarget = document.querySelector<HTMLElement>('[data-sync-target="true"]');
  const gutterDigitCounts = viewports
    .map((viewport) => parseNullableInteger(viewport.dataset.gutterDigits))
    .filter((value): value is number => value !== null);

  return {
    paneOrder,
    selectedLineNumber: parseNullableInteger(activeViewport?.dataset.selectedLineNumber),
    maxGutterDigitCount: gutterDigitCounts.length > 0 ? Math.max(...gutterDigitCounts) : null,
    lastNavigation: parseLastNavigation(activeViewport?.dataset.lastNavigation),
    syncTargetLineNumber: parseNullableInteger(syncTarget?.dataset.lineNumber),
  };
}

function getPublishedSearchHighlightEvidence(): UiTestSearchHighlightEvidence {
  if (typeof document === "undefined") {
    return emptySearchHighlightEvidence;
  }

  const highlights = getVisibleElements('[data-search-highlight="true"]');

  return {
    visible: highlights.length > 0,
    count: highlights.length,
  };
}

function getPublishedCopyActionEvidence(): UiTestCopyActionEvidence {
  if (typeof document === "undefined") {
    return emptyCopyActionEvidence;
  }

  const action = getVisibleElements(".crosslog-log-text-selection__menuitem")[0] ?? null;

  return {
    visible: action !== null,
    pointerAnchored: action ? parseBooleanDataAttribute(action.dataset.pointerAnchored) : null,
    viewportBounded: action ? parseBooleanDataAttribute(action.dataset.viewportBounded) : null,
    copiedProductTextVisible: hasVisibleExactText("Copied"),
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

const emptyDarkThemeColorEvidence: UiTestDarkThemeColorEvidence = {
  matchesAuthoritativeMockup: null,
  mismatchedSurfaces: [],
};

const emptyIconCenteringEvidence: UiTestIconCenteringEvidence = {
  allCentered: null,
  offCenterControls: [],
};

const emptyPaneNavigationEvidence: UiTestPaneNavigationEvidence = {
  paneOrder: [],
  selectedLineNumber: null,
  maxGutterDigitCount: null,
  lastNavigation: "none",
  syncTargetLineNumber: null,
};

const emptySearchHighlightEvidence: UiTestSearchHighlightEvidence = {
  visible: false,
  count: 0,
};

const emptyCopyActionEvidence: UiTestCopyActionEvidence = {
  visible: false,
  pointerAnchored: null,
  viewportBounded: null,
  copiedProductTextVisible: false,
};

function dispatchNavigationEventToActiveViewport(mode: "keyboard" | "wheel"): void {
  const viewport = getActiveViewportElement();

  if (!viewport) {
    return;
  }

  viewport.focus();

  if (mode === "keyboard") {
    viewport.dispatchEvent(new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "ArrowDown",
    }));
    return;
  }

  viewport.dispatchEvent(new WheelEvent("wheel", {
    bubbles: true,
    cancelable: true,
    deltaY: 120,
  }));
}

function dispatchCopyMenuEventToFirstPane(mode: "contextmenu" | "dismiss"): void {
  if (typeof document === "undefined") {
    return;
  }

  const firstPane = queryAllTestElements(redesignedShellTestIds.logPane)[0] ?? null;
  const textActions = firstPane?.querySelector<HTMLElement>(".crosslog-log-text-selection") ?? null;

  if (!textActions) {
    return;
  }

  const rect = textActions.getBoundingClientRect();

  if (mode === "dismiss") {
    textActions.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true,
      button: 0,
      clientX: rect.left + 8,
      clientY: rect.top + 8,
    }));
    return;
  }

  textActions.dispatchEvent(new MouseEvent("contextmenu", {
    bubbles: true,
    button: 2,
    cancelable: true,
    clientX: Math.min(rect.right - 1, rect.left + 160),
    clientY: Math.min(rect.bottom - 1, rect.top + 54),
  }));
}

function getActiveViewportElement(): HTMLElement | null {
  if (typeof document === "undefined") {
    return null;
  }

  const activePane = document.querySelector<HTMLElement>(
    `[data-testid="${redesignedShellTestIds.logPane}"][data-active="true"]`,
  );

  return activePane?.querySelector<HTMLElement>(`[data-testid="${redesignedShellTestIds.logViewport}"]`) ?? null;
}

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

function hasVisibleExactText(text: string): boolean {
  return getVisibleElements("body *").some((element) => normalizeText(element.textContent) === text);
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

function isIconCenteredWithinControl(control: HTMLElement, icon: SVGSVGElement): boolean {
  const controlRect = control.getBoundingClientRect();
  const iconRect = icon.getBoundingClientRect();

  if (controlRect.width <= 0 || controlRect.height <= 0 || iconRect.width <= 0 || iconRect.height <= 0) {
    return false;
  }

  const centerDeltaX = Math.abs((iconRect.left + iconRect.width / 2) - (controlRect.left + controlRect.width / 2));
  const centerDeltaY = Math.abs((iconRect.top + iconRect.height / 2) - (controlRect.top + controlRect.height / 2));

  return centerDeltaX <= iconCenteringTolerancePx && centerDeltaY <= iconCenteringTolerancePx;
}

function normalizeText(text: string | null): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

function normalizeMeasurement(value: number): number | null {
  return Number.isFinite(value) ? Math.round(value) : null;
}

function parseNullableInteger(value: string | undefined): number | null {
  if (value === undefined) {
    return null;
  }

  const parsedValue = Number.parseInt(value, 10);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function parseBooleanDataAttribute(value: string | undefined): boolean | null {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return null;
}

function parseLastNavigation(value: string | undefined): UiTestPaneNavigationEvidence["lastNavigation"] {
  switch (value) {
    case "click":
    case "keyboard":
    case "wheel":
      return value;
    default:
      return "none";
  }
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

const initialSourceOpeningEvidence: UiTestSourceOpeningEvidence = {
  status: "idle",
  entryPoint: "none",
  selectedSourceKind: "none",
  openedSourceCount: 0,
  pickerRequestCount: 0,
  cancelledPickerCount: 0,
  fixtureSamplePaneCount: 0,
};

const publishedFutureControlState: UiTestFutureControlState = {
  activityRailOpenSources: "disabled",
  activityRailSearch: "disabled",
  topbarCommandField: "disabled",
  activityRailSettings: "enabled",
};

const iconCenteringTolerancePx = 1;

const darkThemeColorExpectations = [
  {
    name: "shell",
    selector: `[data-testid="${redesignedShellTestIds.crosslogShell}"]`,
    property: "backgroundColor",
    expectedValue: "rgb(28, 28, 30)",
  },
  {
    name: "topbar",
    selector: `[data-testid="${redesignedShellTestIds.topbar}"]`,
    property: "backgroundColor",
    expectedValue: "rgb(37, 38, 42)",
  },
  {
    name: "rail",
    selector: `[data-testid="${redesignedShellTestIds.activityRail}"]`,
    property: "backgroundColor",
    expectedValue: "rgb(31, 32, 36)",
  },
  {
    name: "workspace",
    selector: `[data-testid="${redesignedShellTestIds.paneWorkspace}"]`,
    property: "backgroundColor",
    expectedValue: "rgb(32, 33, 36)",
  },
  {
    name: "status",
    selector: `[data-testid="${redesignedShellTestIds.statusBar}"]`,
    property: "backgroundColor",
    expectedValue: "rgb(31, 32, 36)",
  },
  {
    name: "command",
    selector: ".crosslog-command-field",
    property: "backgroundColor",
    expectedValue: "rgb(32, 33, 36)",
  },
] as const satisfies readonly {
  readonly name: string;
  readonly selector: string;
  readonly property: "backgroundColor";
  readonly expectedValue: string;
}[];

const iconCenteringSelectors = [
  { name: "sync", selector: '[data-ui-test-action="toggleSynchronization"]' },
  { name: "topbar-add-pane", selector: `[data-testid="${redesignedShellTestIds.topbarAddPane}"]` },
  { name: "topbar-add-file", selector: `[data-testid="${redesignedShellTestIds.topbarAddFile}"]` },
  { name: "topbar-add-directory", selector: `[data-testid="${redesignedShellTestIds.topbarAddDirectory}"]` },
  { name: "activity-rail", selector: `[data-testid="${redesignedShellTestIds.activityRail}"] button` },
  { name: "pane-close", selector: `[data-testid="${redesignedShellTestIds.paneHeaderClose}"]` },
  { name: "search-previous", selector: `[data-testid="${redesignedShellTestIds.paneSearchPrevious}"]` },
  { name: "search-next", selector: `[data-testid="${redesignedShellTestIds.paneSearchNext}"]` },
] as const;

function getSourceKind(sources: readonly DragDropSource[]): UiTestSourceKind {
  const hasFile = sources.some((source) => source.type === "file");
  const hasDirectory = sources.some((source) => source.type === "directory");

  if (hasFile && hasDirectory) {
    return "mixed";
  }

  if (hasFile) {
    return "file";
  }

  return hasDirectory ? "directory" : "none";
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
