import React from "react";
import type {
  CrosslogPlatform,
  DiagnosticLogFieldValue,
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
import type {
  DirectorySourceRef,
  DragDropSource,
  FileSourceRef,
  FileWatcherEvent,
  UiTestAction,
} from "@crosslog/platform";
import {
  createLogPane,
  createLogPaneState,
  createDirectoryFileEntry,
  createDirectorySource,
  appendRawLinesToChunks,
  defaultFileOpenPolicy,
  flattenLineChunkText,
  createSynchronizationPlan,
  createSynchronizationTimeline,
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
  timeOffsetToMilliseconds,
  validateTimeOffsetDraft,
  type DirectorySource,
  type DirectoryFileEntry,
  type FileSource,
  type LogPane as LogPaneModel,
  type Session,
  type SessionDirectorySource,
  type SessionFileSource,
  type SynchronizationLine,
  type SynchronizationTimeline,
  type TimestampRecognitionService,
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
import type { LogViewportNavigationKind } from "../log-pane/VirtualLogViewport";
import {
  compactDiagnosticFields,
  countSourceLines,
  logDiagnosticEvent,
  serializeErrorForDiagnosticLog,
} from "../diagnostics/diagnosticLogging";

export interface AppShellProps {
  readonly platform: CrosslogPlatform;
  readonly renderMacosTrafficLights?: boolean;
  readonly shellPresentation?: ShellPresentation;
  readonly useShellPresentationTheme?: boolean;
}

const uiTestClipboardWriter: ClipboardWriter = {
  writeText: async () => undefined,
};

interface PaneContent {
  readonly lines: readonly string[];
  readonly synchronizationLines: readonly SynchronizationLine[];
  readonly synchronizationTimeline: SynchronizationTimeline;
  readonly timestamps: readonly (Date | null)[];
}

type PaneContentCache = WeakMap<object, Map<string, PaneContent>>;

const emptyPaneContent: PaneContent = {
  lines: [],
  synchronizationLines: [],
  synchronizationTimeline: createSynchronizationTimeline([]),
  timestamps: [],
};

function getCachedPaneContent(
  cache: PaneContentCache,
  contentIdentity: object,
  paneId: string,
  loadLines: () => readonly string[],
  timestampService: TimestampRecognitionService,
): PaneContent {
  const contentByPaneId = cache.get(contentIdentity) ?? new Map<string, PaneContent>();
  const cachedContent = contentByPaneId.get(paneId);

  if (cachedContent) {
    return cachedContent;
  }

  const lines = loadLines();
  const timestamps = lines.map(
    (line) => timestampService.recognizeTimestampInLine(line)?.timestamp ?? null,
  );
  const synchronizationLines = timestamps.map((timestamp, index) => ({
    lineNumber: index + 1,
    timestamp,
  }));
  const content = {
    lines,
    synchronizationLines,
    synchronizationTimeline: createSynchronizationTimeline(synchronizationLines),
    timestamps,
  } satisfies PaneContent;

  contentByPaneId.set(paneId, content);
  cache.set(contentIdentity, contentByPaneId);

  return content;
}

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
  const paneCountRef = React.useRef(state.panes.length);
  const activePaneIdRef = React.useRef(state.activePaneId);
  const nextPaneNumberRef = React.useRef(state.nextPaneNumber);
  const lastSynchronizationNavigationLogAtRef = React.useRef(Number.NEGATIVE_INFINITY);
  const synchronizationNavigationLogTimeoutRef = React.useRef<number | null>(null);
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
  const restoredFileSourceRequestRef = React.useRef(0);
  const [directoryFileSources, setDirectoryFileSources] = React.useState<FileSourceMap>({});
  const [directorySource, dispatchDirectorySource] = React.useReducer(
    directorySourceReducer,
    createInitialDirectorySource(platform),
  );
  const synchronizationEnabled = useSynchronizationStore((store) => store.enabled);
  const syncOffsets = useSynchronizationStore((store) => store.offsets);
  const excludedPaneIds = useSynchronizationStore((store) => store.excludedPaneIds);
  const setSynchronizationEnabled = useSynchronizationStore((store) => store.setEnabled);
  const setSynchronizationAnchor = useSynchronizationStore((store) => store.setAnchor);
  const setPaneOffset = useSynchronizationStore((store) => store.setPaneOffset);
  const setPlanResult = useSynchronizationStore((store) => store.setPlanResult);
  const restoreSynchronizationSessionState = useSynchronizationStore((store) => store.restoreSessionState);
  const resetSynchronizationState = useSynchronizationStore((store) => store.reset);
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
  const resetPaneSearchState = usePaneSearchStore((store) => store.reset);
  const writeDiagnosticEvent = React.useCallback(
    (
      level: Parameters<typeof logDiagnosticEvent>[1],
      name: string,
      fields?: Parameters<typeof logDiagnosticEvent>[3],
    ) => {
      logDiagnosticEvent(platform.diagnosticLogger, level, name, fields);
    },
    [platform.diagnosticLogger],
  );
  const fileLifecycleDiagnosticHandlers = React.useMemo(
    () => ({
      onWatcherError: (
        event: Extract<FileWatcherEvent, { readonly type: "WatcherError" }>,
        source: FileSource,
      ) => {
        writeDiagnosticEvent("error", "desktop.file_watcher.error", {
          sourceId: source.id,
          path: getFileSourceDiagnosticPath(source),
          title: source.displayName,
          message: event.message,
        });
      },
    }),
    [writeDiagnosticEvent],
  );
  const publishFileLifecycleEvent = useFileLifecycleEvents(setFileSources, fileLifecycleDiagnosticHandlers);
  const restoreState = useSessionRestore(platform.sessionStore, {
    onSessionRestored: (session) => {
      if (!shouldRestoreSessionIntoWorkspace(session, platform)) {
        dispatch({ type: "replaceState", state: createLogPaneState() });
        resetSynchronizationState();
        resetPaneSearchState();
        setOpenSearchPaneId(null);
        setOpenTimeOffsetPaneId(null);
        setFileSources(createInitialFileSources(platform.kind));
        setDirectoryFileSources({});
        dispatchDirectorySource({ type: "replaceSource", source: createInitialDirectorySource(platform) });
        return;
      }

      const restoredDirectorySource = session.sources.find(
        (source): source is SessionDirectorySource => source.kind === "directory",
      );

      dispatch({ type: "replaceState", state: restoreLogPaneStateFromSession(session) });
      restoreSynchronizationSessionState(session);
      const restoreRequest = restoredFileSourceRequestRef.current + 1;
      restoredFileSourceRequestRef.current = restoreRequest;
      setFileSources(createRestoredFileSourcePlaceholders(session));
      setDirectoryFileSources({});
      void readRestoredFileSourcesFromSession(session, platform).then((restoredFileSources) => {
        if (restoredFileSourceRequestRef.current !== restoreRequest) {
          return;
        }

        setFileSources((currentSources) => ({ ...currentSources, ...restoredFileSources }));
      });

      if (restoredDirectorySource) {
        const restoredFiles = restoreDirectoryFilesFromSession(restoredDirectorySource);
        dispatchDirectorySource({ type: "refreshFiles", files: restoredFiles });

        if (restoredDirectorySource.currentFileId) {
          dispatchDirectorySource({ type: "selectFile", fileId: restoredDirectorySource.currentFileId });
        }
      }
    },
    onSessionRestoreFailed: (error) => {
      writeDiagnosticEvent(
        "error",
        "desktop.session.restore_failed",
        serializeErrorForDiagnosticLog(error),
      );
    },
  });
  const timestampService = React.useMemo(
    () => createTimestampRecognitionService(defaultTimestampFormats),
    [],
  );
  const paneContentCacheRef = React.useRef<PaneContentCache>(new WeakMap());
  const currentDirectoryFile = getCurrentDirectoryFile(directorySource);
  const currentDirectoryFileIdentity = currentDirectoryFile?.identity.value ?? null;
  const currentDirectoryFilePlatform = currentDirectoryFile?.identity.platform ?? null;
  const currentDirectoryFileName = currentDirectoryFile?.name ?? null;
  const directorySourceId = directorySource.id;
  const directorySourceIdentityValue = directorySource.directoryIdentity.value;

  React.useEffect(() => {
    paneCountRef.current = state.panes.length;
    activePaneIdRef.current = state.activePaneId;
    nextPaneNumberRef.current = state.nextPaneNumber;
  }, [state.activePaneId, state.nextPaneNumber, state.panes.length]);

  React.useEffect(
    () => () => {
      if (synchronizationNavigationLogTimeoutRef.current !== null) {
        globalThis.clearTimeout(synchronizationNavigationLogTimeoutRef.current);
      }
    },
    [],
  );

  React.useEffect(() => {
    if (!platform.diagnosticLogger || typeof window === "undefined") {
      return;
    }

    const handleError = (event: ErrorEvent) => {
      writeDiagnosticEvent(
        "error",
        "desktop.ui.unhandled_error",
        compactDiagnosticFields({
          ...serializeErrorForDiagnosticLog(event.error ?? event.message),
          browserMessage: event.message || undefined,
          source: event.filename || null,
          lineNumber: event.lineno || null,
          columnNumber: event.colno || null,
        }),
      );
    };
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      writeDiagnosticEvent(
        "error",
        "desktop.ui.unhandled_rejection",
        serializeErrorForDiagnosticLog(event.reason),
      );
    };

    writeDiagnosticEvent("info", "desktop.ui.mounted", { platform: platform.kind });
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      writeDiagnosticEvent("info", "desktop.ui.unmounted", { platform: platform.kind });
    };
  }, [platform.diagnosticLogger, platform.kind, writeDiagnosticEvent]);

  React.useEffect(() => {
    if (!platform.diagnosticLogger || typeof document === "undefined") {
      return;
    }

    const checkShellHealth = () => {
      const diagnosticFields = getBlankShellDiagnosticFields(paneCountRef.current);

      if (!diagnosticFields) {
        return;
      }

      writeDiagnosticEvent("warn", "desktop.ui.blank_shell_detected", diagnosticFields);
    };
    const intervalId = globalThis.setInterval(checkShellHealth, blankShellHealthCheckIntervalMs);

    return () => {
      globalThis.clearInterval(intervalId);
    };
  }, [platform.diagnosticLogger, writeDiagnosticEvent]);

  React.useEffect(() => {
    if (
      !currentDirectoryFileIdentity ||
      !currentDirectoryFilePlatform ||
      !currentDirectoryFileName ||
      isSampleDirectorySourceIdentity(directorySourceId, directorySourceIdentityValue)
    ) {
      return;
    }

    const path = getRestorableDirectoryFilePath(currentDirectoryFileIdentity, currentDirectoryFilePlatform);

    if (!path || platform.kind !== "desktop") {
      return;
    }

    let active = true;
    const sourceId = getDirectoryFileSourceId(directorySourceId, currentDirectoryFileIdentity);

    void platform.fileAccess
      .openFileReadOnly(
        {
          id: sourceId,
          name: currentDirectoryFileName,
          path,
        },
        defaultFileOpenPolicy,
      )
      .then((result) => {
        if (!active || !result.ok) {
          return;
        }

        setDirectoryFileSources((currentSources) => ({
          ...currentSources,
          [sourceId]: result.source,
        }));
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [
    currentDirectoryFileIdentity,
    currentDirectoryFileName,
    currentDirectoryFilePlatform,
    directorySourceId,
    directorySourceIdentityValue,
    platform.fileAccess,
    platform.kind,
  ]);

  const paneSourceData = React.useMemo(
    () =>
      state.panes.map((pane) => {
        const currentDirectoryFile =
          pane.sourceRef === directorySource.id ? getCurrentDirectoryFile(directorySource) : null;
        const paneTitle = currentDirectoryFile?.name ?? pane.title;
        const fileSource = pane.sourceRef ? fileSources[pane.sourceRef] : null;
        const directoryFileSource =
          currentDirectoryFile && pane.sourceRef
            ? directoryFileSources[
                getDirectoryFileSourceId(pane.sourceRef, currentDirectoryFile.identity.value)
              ] ?? null
            : null;
        const contentIdentity = currentDirectoryFile
          ? directoryFileSource?.lineChunks ?? currentDirectoryFile
          : fileSource?.lineChunks ?? null;
        const content = contentIdentity
          ? getCachedPaneContent(
              paneContentCacheRef.current,
              contentIdentity,
              pane.id,
              () =>
                currentDirectoryFile
                  ? getDirectoryFileLines(currentDirectoryFile, directorySource, directoryFileSource)
                  : fileSource
                    ? flattenLineChunkText(fileSource.lineChunks)
                    : [],
              timestampService,
            )
          : emptyPaneContent;
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
            status,
          },
          lines: content.lines,
          synchronizationLines: content.synchronizationLines,
          synchronizationTimeline: content.synchronizationTimeline,
          timestamps: content.timestamps,
          directorySource: pane.sourceRef === directorySource.id ? directorySource : undefined,
          lifecycleState: getPaneHeaderLifecycleState(fileSource),
        };
      }),
    [
      directoryFileSources,
      directorySource,
      fileSources,
      state.panes,
      timestampService,
    ],
  );
  const synchronizedPaneData = React.useMemo(
    () =>
      paneSourceData.map((entry) => ({
        ...entry,
        pane: {
          ...entry.pane,
          timeOffset: getPaneOffset(syncOffsets, entry.pane.id),
          syncEnabled: synchronizationEnabled,
        },
      })),
    [paneSourceData, syncOffsets, synchronizationEnabled],
  );
  const sessionSnapshot = React.useMemo(
    () =>
      synchronizedPaneData.length === 0
        ? null
        : createSessionSnapshot({
            panes: synchronizedPaneData.map((entry) => entry.pane),
            fileSources: Object.values(fileSources),
            directorySources: [directorySource],
            synchronizationEnabled,
          }),
    [directorySource, fileSources, synchronizedPaneData, synchronizationEnabled],
  );
  const handleSessionSnapshotWriteFailed = React.useCallback(
    (error: unknown, failedSession: Session) => {
      writeDiagnosticEvent(
        "error",
        "desktop.session.snapshot_write_failed",
        compactDiagnosticFields({
          ...serializeErrorForDiagnosticLog(error),
          paneCount: failedSession.panes.length,
          sourceCount: failedSession.sources.length,
        }),
      );
    },
    [writeDiagnosticEvent],
  );

  const sessionSnapshotStatus = useSessionSnapshotWriter(
    platform.sessionStore,
    sessionSnapshot,
    restoreState.status === "ready" && synchronizedPaneData.length > 0,
    handleSessionSnapshotWriteFailed,
  );
  const panes = synchronizedPaneData.map((entry) => ({
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
    const uiTestBridge = platform.uiTestBridge;

    if (!uiTestEnabled || !uiTestBridge?.publishSynchronizationTargetLine) {
      return undefined;
    }

    return useSynchronizationStore.subscribe((store, previousStore) => {
      if (store.targets === previousStore.targets) {
        return;
      }

      const firstTarget = Object.values(store.targets)[0] ?? null;

      void uiTestBridge.publishSynchronizationTargetLine?.(firstTarget?.lineNumber ?? null);
    });
  }, [platform.uiTestBridge, uiTestEnabled]);

  const uiTestPaneTitlesRef = React.useRef<readonly string[]>([]);
  uiTestPaneTitlesRef.current = panes.map((entry) => entry.pane.title);
  const publishUiTestPaneNavigationEvidence = React.useCallback(() => {
    const uiTestBridge = platform.uiTestBridge;

    if (!uiTestEnabled || !uiTestBridge?.publishPaneNavigation) {
      return;
    }

    void uiTestBridge.publishPaneNavigation(
      getPublishedPaneNavigationEvidence(uiTestPaneTitlesRef.current),
    );
  }, [platform.uiTestBridge, uiTestEnabled]);

  React.useEffect(() => {
    paneSourceData.forEach((entry) => setPaneSearchLines(entry.pane.id, entry.lines));
  }, [paneSourceData, setPaneSearchLines]);

  const scheduleSynchronizationNavigationLog = React.useCallback(
    (input: {
      readonly paneId: string;
      readonly lineNumber: number;
      readonly timestamp: Date | null;
      readonly visualLineOffset: number;
      readonly navigationKind: LogViewportNavigationKind;
      readonly targets: readonly { readonly paneId: string; readonly lineNumber: number }[];
      readonly excludedPaneIds: readonly string[];
      readonly syncApplied: boolean;
    }) => {
      if (!platform.diagnosticLogger) {
        return;
      }

      const now = Date.now();

      if (now - lastSynchronizationNavigationLogAtRef.current < synchronizationNavigationLogThrottleMs) {
        return;
      }

      lastSynchronizationNavigationLogAtRef.current = now;

      if (synchronizationNavigationLogTimeoutRef.current !== null) {
        globalThis.clearTimeout(synchronizationNavigationLogTimeoutRef.current);
      }

      synchronizationNavigationLogTimeoutRef.current = globalThis.setTimeout(() => {
        synchronizationNavigationLogTimeoutRef.current = null;
        writeDiagnosticEvent(
          "info",
          "desktop.sync.navigation_sampled",
          buildSynchronizationNavigationLogFields({
            ...input,
            directorySource,
            fileSources,
            paneData: synchronizedPaneData,
          }),
        );
      }, 0);
    },
    [directorySource, fileSources, platform.diagnosticLogger, synchronizedPaneData, writeDiagnosticEvent],
  );

  const handleAnchorChange = (
    paneId: string,
    lineNumber: number,
    timestamp: Date | null,
    visualLineOffset: number,
    navigationKind: LogViewportNavigationKind,
  ) => {
    const anchor = createTimeAnchorPane(paneId, timestamp, "scroll");
    setSynchronizationAnchor(anchor);

    if (!anchor || !synchronizationEnabled) {
      setPlanResult([], [], null);
      scheduleSynchronizationNavigationLog({
        paneId,
        lineNumber,
        timestamp,
        visualLineOffset,
        navigationKind,
        targets: [],
        excludedPaneIds: [],
        syncApplied: false,
      });
      return;
    }

    const plan = createSynchronizationPlan({
      enabled: synchronizationEnabled,
      anchorPaneId: anchor.paneId,
      anchorTimestamp: anchor.anchorTimestamp,
      panes: synchronizedPaneData.map((entry) => ({
        paneId: entry.pane.id,
        timeOffset: entry.pane.timeOffset,
        syncEnabled: entry.pane.syncEnabled,
        lines: entry.synchronizationLines,
        timeline: entry.synchronizationTimeline,
      })),
    });

    setPlanResult(plan.targets, plan.excludedPaneIds, visualLineOffset);
    scheduleSynchronizationNavigationLog({
      paneId,
      lineNumber,
      timestamp,
      visualLineOffset,
      navigationKind,
      targets: plan.targets,
      excludedPaneIds: plan.excludedPaneIds,
      syncApplied: plan.targets.length > 0,
    });
  };

  const handleSynchronizationEnabledChange = React.useCallback((enabled: boolean) => {
    if (enabled !== synchronizationEnabled) {
      writeDiagnosticEvent("info", "desktop.sync.enabled_changed", {
        enabled,
        activePaneCount: paneCountRef.current,
      });
    }

    setSynchronizationEnabled(enabled);

    if (!enabled) {
      setPlanResult([], [], null);
    }
  }, [setPlanResult, setSynchronizationEnabled, synchronizationEnabled, writeDiagnosticEvent]);

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

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isPaneSearchShortcutEvent(event, shellPresentation.platformShellVariant)) {
        return;
      }

      event.preventDefault();
      requestActivePaneSearch();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [requestActivePaneSearch, shellPresentation.platformShellVariant]);

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
  const resetUiTestWorkspace = React.useCallback(() => {
    dispatch({ type: "replaceState", state: createLogPaneState() });
    resetSynchronizationState();
    resetPaneSearchState();
    setThemePreference(defaultThemePreference);
    setUiTestCopiedPaneTitle(null);
    setSourceOpeningEvidence(initialSourceOpeningEvidence);
    setUiTestCopyActionPublishSequence(0);
    setOpenSearchPaneId(null);
    setOpenTimeOffsetPaneId(null);
    setSettingsOpen(false);
    setSearchFocusRequestSequence(0);
    setFileSources(createInitialFileSources(platform.kind));
    setDirectoryFileSources({});
    restoredFileSourceRequestRef.current += 1;
    liveAppendCounter.current = 1;
    dispatchDirectorySource({
      type: "replaceSource",
      source: createInitialDirectorySource(platform),
    });
  }, [platform, resetPaneSearchState, resetSynchronizationState]);

  const executeUiTestAction = React.useCallback(
    (action: UiTestAction) => {
      switch (action) {
        case "resetWorkspace":
          resetUiTestWorkspace();
          break;
        case "openSampleLogs":
          // Reset the hidden fixture workspace so grouped WDIO specs remain
          // independent while sharing one stable tauri-driver session.
          resetUiTestWorkspace();
          dispatch({
            type: "replaceState",
            state: createLogPaneState(
              samplePanes.map((pane, index) => ({
                ...pane,
                active: index === samplePanes.length - 1,
              })),
            ),
          });
          resetSynchronizationState();
          resetPaneSearchState();
          setOpenSearchPaneId(null);
          setOpenTimeOffsetPaneId(null);
          setFileSources(createInitialFileSources(platform.kind));
          setDirectoryFileSources({});
          dispatchDirectorySource({
            type: "replaceSource",
            source: createInitialDirectorySource(platform),
          });
          setSourceOpeningEvidence((current) => ({
            ...current,
            status: "opened",
            entryPoint: "ui-test-fixture",
            selectedSourceKind: "mixed",
            fixtureSamplePaneCount: samplePanes.length,
          }));
          break;
        case "openLargeLog":
          void openUiTestLargeLogSource(
            openDroppedSourcesRef.current,
            (title) => {
              dispatch({
                type: "addPane",
                pane: {
                  title,
                  sourceRef: null,
                  width: 520,
                  status: "error",
                },
              });
            },
          );
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
      resetUiTestWorkspace,
      resetPaneSearchState,
      resetSynchronizationState,
      setPaneOffset,
      platform,
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

  const allocatePaneId = () => {
    const paneId = `pane-${nextPaneNumberRef.current}`;
    nextPaneNumberRef.current += 1;

    return paneId;
  };

  const addOpenedPane = (
    pane: Partial<LogPaneModel> & {
      readonly title: string;
      readonly width: number;
      readonly status: LogPaneModel["status"];
    },
    fields: Record<string, DiagnosticLogFieldValue | undefined>,
  ) => {
    const paneId = pane.id ?? allocatePaneId();
    const activePaneCountAfter = paneCountRef.current + 1;

    paneCountRef.current = activePaneCountAfter;
    activePaneIdRef.current = paneId;

    dispatch({ type: "addPane", pane: { ...pane, id: paneId } });
    writeDiagnosticEvent(
      "info",
      "desktop.pane.opened",
      compactDiagnosticFields({
        paneId,
        title: pane.title,
        status: pane.status,
        sourceRef: pane.sourceRef ?? null,
        activePaneCountAfter,
        ...fields,
      }),
    );
  };

  const handleClosePane = (paneId: string) => {
    const pane = state.panes.find((candidate) => candidate.id === paneId);

    if (!pane) {
      return;
    }

    const activePaneCountAfter = Math.max(0, paneCountRef.current - 1);
    paneCountRef.current = activePaneCountAfter;

    if (activePaneIdRef.current === paneId) {
      activePaneIdRef.current = chooseNextActivePaneIdAfterClose(state.panes, paneId, state.activePaneId);
    }

    dispatch({ type: "closePane", paneId });
    writeDiagnosticEvent(
      "info",
      "desktop.pane.closed",
      compactDiagnosticFields({
        paneId,
        title: pane.title,
        sourceRef: pane.sourceRef ?? null,
        path: getPaneDiagnosticPath(pane, fileSources, directorySource),
        activePaneCountAfter,
      }),
    );
  };

  const handleActivatePane = (paneId: string) => {
    const pane = state.panes.find((candidate) => candidate.id === paneId);

    if (!pane || activePaneIdRef.current === paneId) {
      return;
    }

    const previousPaneId = activePaneIdRef.current;
    const previousPane = previousPaneId
      ? state.panes.find((candidate) => candidate.id === previousPaneId) ?? null
      : null;

    activePaneIdRef.current = paneId;
    dispatch({ type: "setActivePane", paneId });
    writeDiagnosticEvent(
      "info",
      "desktop.pane.focus_changed",
      compactDiagnosticFields({
        paneId,
        title: pane.title,
        sourceRef: pane.sourceRef ?? null,
        path: getPaneDiagnosticPath(pane, fileSources, directorySource),
        previousPaneId,
        previousTitle: previousPane?.title ?? null,
        previousPath: previousPane ? getPaneDiagnosticPath(previousPane, fileSources, directorySource) : null,
        activePaneCount: paneCountRef.current,
      }),
    );
  };

  const openFileSource = async (sourceRef: FileSourceRef) => {
    const openedAtMs = getMonotonicNowMs();
    const result = await platform.fileAccess.openFileReadOnly(sourceRef, defaultFileOpenPolicy);
    const openDurationMs = getElapsedMs(openedAtMs);

    if (!result.ok) {
      writeDiagnosticEvent("warn", "desktop.source.open_policy_decision", {
        decision: "rejected",
        sourceKind: "file",
        path: sourceRef.path ?? null,
        title: sourceRef.name,
        errorCode: result.error.code,
        message: result.error.message,
        maxFileSizeBytes: defaultFileOpenPolicy.maxFileSizeBytes,
        availableMemoryBytes: defaultFileOpenPolicy.availableMemoryBytes,
        openDurationMs,
      });
      writeDiagnosticEvent("warn", "desktop.source.open_failed", {
        sourceKind: "file",
        path: sourceRef.path ?? null,
        title: sourceRef.name,
        errorCode: result.error.code,
        message: result.error.message,
        openDurationMs,
      });
      addOpenedPane(
        {
          title: sourceRef.name,
          sourceRef: null,
          width: 520,
          status: result.error.code === "FileTooLarge" ? "memory-limited" : "error",
        },
        {
          sourceKind: "file",
          path: sourceRef.path ?? null,
          errorCode: result.error.code,
          openDurationMs,
        },
      );
      return;
    }

    writeDiagnosticEvent("info", "desktop.source.open_policy_decision", {
      decision: "accepted",
      sourceKind: "file",
      path: getFileSourceDiagnosticPath(result.source) ?? sourceRef.path ?? null,
      title: result.source.displayName,
      sizeBytes: result.source.sizeBytes,
      maxFileSizeBytes: defaultFileOpenPolicy.maxFileSizeBytes,
      availableMemoryBytes: defaultFileOpenPolicy.availableMemoryBytes,
      openDurationMs,
    });
    if (result.source.sizeBytes >= largeFileOpenLogThresholdBytes) {
      writeDiagnosticEvent("info", "desktop.source.large_open_completed", {
        sourceKind: "file",
        path: getFileSourceDiagnosticPath(result.source) ?? sourceRef.path ?? null,
        title: result.source.displayName,
        sizeBytes: result.source.sizeBytes,
        lineCount: countSourceLines(result.source),
        openDurationMs,
      });
    }
    setFileSources((current) => ({
      ...current,
      [result.source.id]: result.source,
    }));
    addOpenedPane(
      {
        title: result.source.displayName,
        sourceRef: result.source.id,
        width: 520,
        status: "ready",
      },
      {
        sourceKind: "file",
        path: getFileSourceDiagnosticPath(result.source) ?? sourceRef.path ?? null,
        sizeBytes: result.source.sizeBytes,
        lineCount: countSourceLines(result.source),
        readError: result.source.readError,
        openDurationMs,
      },
    );
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
    addOpenedPane(
      {
        title: sourceRef.name,
        sourceRef: directorySource.id,
        width: 520,
        status: files.length === 0 ? "empty" : "ready",
      },
      {
        sourceKind: "directory",
        path: sourceRef.path ?? null,
        fileCount: files.length,
      },
    );
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
    } catch (error) {
      writeDiagnosticEvent(
        "error",
        "desktop.source_selection.failed",
        serializeErrorForDiagnosticLog(error),
      );
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
        onClosePane={handleClosePane}
        onActivatePane={handleActivatePane}
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
        onUiTestNavigationEvidenceChange={publishUiTestPaneNavigationEvidence}
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

const synchronizationNavigationLogThrottleMs = 5_000;
const blankShellHealthCheckIntervalMs = 5_000;
const largeFileOpenLogThresholdBytes = 5 * 1024 * 1024;

interface SynchronizationNavigationLogInput {
  readonly paneId: string;
  readonly lineNumber: number;
  readonly timestamp: Date | null;
  readonly visualLineOffset: number;
  readonly navigationKind: LogViewportNavigationKind;
  readonly targets: readonly { readonly paneId: string; readonly lineNumber: number }[];
  readonly excludedPaneIds: readonly string[];
  readonly syncApplied: boolean;
  readonly directorySource: DirectorySource;
  readonly fileSources: FileSourceMap;
  readonly paneData: readonly {
    readonly pane: LogPaneModel;
    readonly timestamps: readonly (Date | null)[];
  }[];
}

function buildSynchronizationNavigationLogFields(
  input: SynchronizationNavigationLogInput,
): ReturnType<typeof compactDiagnosticFields> {
  const targetLineNumbers = new Map(input.targets.map((target) => [target.paneId, target.lineNumber]));
  const excludedPaneIds = new Set(input.excludedPaneIds);
  const anchorPane = input.paneData.find((entry) => entry.pane.id === input.paneId)?.pane ?? null;
  const panes = input.paneData.map((entry) => {
    const isAnchorPane = entry.pane.id === input.paneId;
    const targetLineNumber = targetLineNumbers.get(entry.pane.id) ?? null;
    const lineNumber = isAnchorPane ? input.lineNumber : targetLineNumber;
    const timestamp = isAnchorPane
      ? input.timestamp
      : lineNumber
        ? entry.timestamps[lineNumber - 1] ?? null
        : null;
    const timeOffsetMilliseconds = timeOffsetToMilliseconds(entry.pane.timeOffset);

    return compactDiagnosticFields({
      paneId: entry.pane.id,
      title: entry.pane.title,
      path: getPaneDiagnosticPath(entry.pane, input.fileSources, input.directorySource),
      role: getSynchronizationDiagnosticPaneRole(isAnchorPane, targetLineNumber, excludedPaneIds.has(entry.pane.id)),
      lineNumber,
      timestamp: formatDiagnosticTimestamp(timestamp),
      timeOffsetMilliseconds,
      timeOffsetLabel: formatTimeOffset(entry.pane.timeOffset),
      screenRow: lineNumber ? getPaneLineScreenRow(entry.pane.id, lineNumber) : null,
    });
  });

  return compactDiagnosticFields({
    navigationKind: input.navigationKind,
    syncApplied: input.syncApplied,
    anchorPaneId: input.paneId,
    anchorTitle: anchorPane?.title ?? null,
    anchorPath: anchorPane ? getPaneDiagnosticPath(anchorPane, input.fileSources, input.directorySource) : null,
    anchorLineNumber: input.lineNumber,
    anchorTimestamp: formatDiagnosticTimestamp(input.timestamp),
    anchorVisualLineOffset: input.visualLineOffset,
    targetCount: input.targets.length,
    excludedPaneIds: input.excludedPaneIds,
    panes,
  });
}

function getSynchronizationDiagnosticPaneRole(
  isAnchorPane: boolean,
  targetLineNumber: number | null,
  excluded: boolean,
): string {
  if (isAnchorPane) {
    return "anchor";
  }

  if (excluded) {
    return "excluded";
  }

  return targetLineNumber === null ? "unmatched" : "target";
}

function formatDiagnosticTimestamp(timestamp: Date | null): string | null {
  return timestamp ? timestamp.toISOString() : null;
}

function getPaneLineScreenRow(paneId: string, lineNumber: number): number | null {
  if (typeof document === "undefined") {
    return null;
  }

  const pane = queryLogPaneElementById(paneId);
  const viewport = pane?.querySelector<HTMLElement>(`[data-testid="${redesignedShellTestIds.logViewport}"]`) ?? null;
  const row = pane?.querySelector<HTMLElement>(`[data-line-number="${lineNumber}"]`) ?? null;

  if (!viewport || !row) {
    return null;
  }

  const rows = Array.from(viewport.querySelectorAll<HTMLElement>(".crosslog-log-viewport__row"));
  const visibleRows = getVisibleViewportRows(viewport, rows);
  const rowIndex = visibleRows.indexOf(row);

  if (rowIndex >= 0) {
    return rowIndex + 1;
  }

  const renderedIndex = rows.indexOf(row);

  return renderedIndex >= 0 ? renderedIndex + 1 : null;
}

function getVisibleViewportRows(
  viewport: HTMLElement,
  rows: readonly HTMLElement[],
): readonly HTMLElement[] {
  const viewportRect = viewport.getBoundingClientRect();
  const visibleRows = rows.filter((row) => {
    const rowRect = row.getBoundingClientRect();

    return rowRect.bottom > viewportRect.top && rowRect.top < viewportRect.bottom;
  });

  return visibleRows.length > 0 ? visibleRows : rows;
}

function queryLogPaneElementById(paneId: string): HTMLElement | null {
  if (typeof document === "undefined") {
    return null;
  }

  return (
    Array.from(document.querySelectorAll<HTMLElement>(`[data-testid="${redesignedShellTestIds.logPane}"]`)).find(
      (pane) => pane.dataset.paneId === paneId,
    ) ?? null
  );
}

function getBlankShellDiagnosticFields(expectedPaneCount: number): ReturnType<typeof compactDiagnosticFields> | null {
  if (expectedPaneCount <= 0 || typeof document === "undefined") {
    return null;
  }

  const shell = queryTestElement(redesignedShellTestIds.crosslogShell);
  const workspace = queryTestElement(redesignedShellTestIds.paneWorkspace);
  const actualPaneCount = queryAllTestElements(redesignedShellTestIds.logPane).length;

  if (shell && workspace && actualPaneCount > 0) {
    return null;
  }

  return compactDiagnosticFields({
    expectedPaneCount,
    actualPaneCount,
    shellPresent: shell !== null,
    workspacePresent: workspace !== null,
    bodyChildCount: document.body?.children.length ?? null,
  });
}

function getMonotonicNowMs(): number {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

function getElapsedMs(startedAtMs: number): number {
  return Math.max(0, Math.round(getMonotonicNowMs() - startedAtMs));
}

function getPaneDiagnosticPath(
  pane: LogPaneModel,
  fileSources: FileSourceMap,
  directorySource: DirectorySource,
): string | null {
  if (!pane.sourceRef) {
    return null;
  }

  if (pane.sourceRef === directorySource.id) {
    return directorySource.directoryIdentity.platform === "desktop"
      ? directorySource.directoryIdentity.value
      : directorySource.displayName;
  }

  return getFileSourceDiagnosticPath(fileSources[pane.sourceRef]);
}

function getFileSourceDiagnosticPath(source: FileSource | null | undefined): string | null {
  if (!source) {
    return null;
  }

  return source.fileIdentity.platform === "desktop" ? source.fileIdentity.value : source.pathLabel;
}

function chooseNextActivePaneIdAfterClose(
  panes: readonly LogPaneModel[],
  closedPaneId: string,
  activePaneId: string | null,
): string | null {
  if (activePaneId && activePaneId !== closedPaneId && panes.some((pane) => pane.id === activePaneId)) {
    return activePaneId;
  }

  const closedIndex = panes.findIndex((pane) => pane.id === closedPaneId);
  const nextPanes = panes.filter((pane) => pane.id !== closedPaneId);

  return nextPanes[Math.min(Math.max(0, closedIndex), nextPanes.length - 1)]?.id ?? null;
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

function isPaneSearchShortcutEvent(
  event: KeyboardEvent,
  platformShellVariant: ShellPresentation["platformShellVariant"],
): boolean {
  if (event.defaultPrevented || event.altKey || event.shiftKey || event.key.toLowerCase() !== "f") {
    return false;
  }

  const shortcutModifier = resolvePaneSearchShortcutModifier(platformShellVariant);

  return shortcutModifier === "meta"
    ? event.metaKey && !event.ctrlKey
    : event.ctrlKey && !event.metaKey;
}

function resolvePaneSearchShortcutModifier(
  platformShellVariant: ShellPresentation["platformShellVariant"],
): "meta" | "control" {
  if (macSearchShortcutPlatforms.includes(platformShellVariant as (typeof macSearchShortcutPlatforms)[number])) {
    return "meta";
  }

  if (
    controlSearchShortcutPlatforms.includes(
      platformShellVariant as (typeof controlSearchShortcutPlatforms)[number],
    )
  ) {
    return "control";
  }

  const platformText =
    typeof navigator === "undefined" ? "" : `${navigator.platform ?? ""} ${navigator.userAgent ?? ""}`.toLowerCase();

  return platformText.includes("mac") || platformText.includes("darwin") ? "meta" : "control";
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
  const activeRows = activeViewport
    ? Array.from(activeViewport.querySelectorAll<HTMLElement>(".crosslog-log-viewport__row"))
    : [];
  const viewportRect = activeViewport?.getBoundingClientRect() ?? null;
  const visibleRowCount = viewportRect
    ? activeRows.filter((row) => {
        const rowRect = row.getBoundingClientRect();

        return rowRect.bottom > viewportRect.top && rowRect.top < viewportRect.bottom;
      }).length
    : null;
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
    renderedRowCount: activeViewport ? activeRows.length : null,
    visibleRowCount,
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
  renderedRowCount: null,
  visibleRowCount: null,
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

  viewport.scrollTop = Math.min(viewport.scrollHeight - viewport.clientHeight, viewport.scrollTop + 120);
  viewport.dispatchEvent(new Event("scroll", { bubbles: true }));
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
const macSearchShortcutPlatforms = ["macos"] as const;
const controlSearchShortcutPlatforms = ["windows", "linux"] as const;

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

async function openUiTestLargeLogSource(
  openDroppedSources: (sources: readonly DragDropSource[]) => Promise<void>,
  onOpenError: (title: string) => void,
): Promise<void> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const path = await invoke<string | null>("ui_test_large_log_path");

    if (!path) {
      onOpenError("large-log-path-missing");
      return;
    }

    await openDroppedSources([
      {
        type: "file",
        source: {
          id: "ui-test-large-log",
          name: getPathBasename(path),
          path,
        },
      },
    ]);
  } catch {
    onOpenError("large-log-open-error");
  }
}

function getPathBasename(path: string): string {
  const normalizedPath = path.replace(/[\\/]+$/g, "");
  const pathSegments = normalizedPath.split(/[\\/]+/);
  const basename = pathSegments.at(-1);

  return basename && basename.length > 0 ? basename : "large.log";
}

function getSampleLines(title: string): readonly string[] {
  return Array.from({ length: 250 }, (_, index) => {
    const lineNumber = index + 1;
    const secondsAfterStart = index;
    const minute = Math.floor(secondsAfterStart / 60);
    const second = secondsAfterStart % 60;

    if (lineNumber === 181) {
      return `2026-06-16T09:03:00.000Z ${title} ${"wide-column ".repeat(18)}line 180 token=outside-viewport`;
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

function createInitialDirectorySource(platform: CrosslogPlatform): DirectorySource {
  return createDirectorySource({
    id: "source-directory",
    directoryIdentity: { value: "source-directory", platform: platform.kind },
    displayName: "logs/2026",
    files: sampleDirectoryFiles,
    watchState: platform.capabilities.canDiscoverNewDirectoryFiles ? "watching" : "unsupported",
  });
}

function shouldRestoreSessionIntoWorkspace(session: Session, platform: CrosslogPlatform): boolean {
  if (platform.kind !== "web") {
    return true;
  }

  return session.panes.length === 0 && session.sources.length === 0;
}

function createRestoredFileSourcePlaceholders(session: Session): FileSourceMap {
  return Object.fromEntries(
    session.sources
      .filter((source): source is SessionFileSource => source.kind === "file")
      .map((source) => [source.id, createRestoredFileSourcePlaceholder(source)]),
  );
}

async function readRestoredFileSourcesFromSession(
  session: Session,
  platform: CrosslogPlatform,
): Promise<FileSourceMap> {
  const restoredSources = await Promise.all(
    session.sources
      .filter((source): source is SessionFileSource => source.kind === "file")
      .map(async (source) => [source.id, await readRestoredFileSource(source, platform)] as const),
  );

  return Object.fromEntries(restoredSources);
}

async function readRestoredFileSource(
  source: SessionFileSource,
  platform: CrosslogPlatform,
): Promise<FileSource> {
  const placeholder = createRestoredFileSourcePlaceholder(source);

  if (platform.kind !== "desktop" || source.fileIdentity.platform !== "desktop") {
    return placeholder;
  }

  let result: Awaited<ReturnType<CrosslogPlatform["fileAccess"]["openFileReadOnly"]>>;

  try {
    result = await platform.fileAccess.openFileReadOnly(
      {
        id: source.id,
        name: source.displayName,
        path: source.fileIdentity.value,
      },
      defaultFileOpenPolicy,
    );
  } catch (error) {
    return {
      ...placeholder,
      watchState: "failed",
      readError: error instanceof Error ? error.message : String(error),
    };
  }

  if (result.ok) {
    return result.source;
  }

  return {
    ...placeholder,
    watchState: "failed",
    readError: result.error.message,
  };
}

function createRestoredFileSourcePlaceholder(source: SessionFileSource): FileSource {
  return {
    id: source.id,
    fileIdentity: source.fileIdentity,
    displayName: source.displayName,
    pathLabel: source.pathLabel,
    sizeBytes: source.sizeBytes,
    encoding: source.encoding,
    lineChunks: [],
    watchState: source.fileIdentity.platform === "desktop" ? "watching" : "unsupported",
    deleted: false,
    replaced: false,
    readError: null,
  };
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

function getDirectoryFileLines(
  currentFile: DirectoryFileEntry,
  source: DirectorySource,
  fileSource: FileSource | null,
): readonly string[] {
  if (isSampleDirectorySource(source)) {
    return getSampleLines(currentFile.name);
  }

  return fileSource ? flattenLineChunkText(fileSource.lineChunks) : [];
}

function getDirectoryFileSourceId(directorySourceId: string, fileIdentity: string): string {
  return `${directorySourceId}:${fileIdentity}`;
}

function getRestorableDirectoryFilePath(
  identity: string,
  identityPlatform: DirectoryFileEntry["identity"]["platform"],
): string | null {
  if (identityPlatform !== "desktop") {
    return null;
  }

  return parseTauriDirectoryFileIdentityPath(identity);
}

function parseTauriDirectoryFileIdentityPath(identity: string): string | null {
  const parts = identity.split(":");

  if (parts.length < 3) {
    return null;
  }

  const modifiedAt = parts.at(-1);
  const sizeBytes = parts.at(-2);
  const path = parts.slice(0, -2).join(":");

  if (!path || !isUnsignedIntegerToken(sizeBytes) || !isUnsignedIntegerToken(modifiedAt)) {
    return null;
  }

  return path;
}

function isUnsignedIntegerToken(value: string | undefined): boolean {
  return value !== undefined && /^\d+$/u.test(value);
}

function isSampleDirectorySource(source: DirectorySource): boolean {
  return isSampleDirectorySourceIdentity(source.id, source.directoryIdentity.value);
}

function isSampleDirectorySourceIdentity(sourceId: string, directoryIdentity: string): boolean {
  return sourceId === "source-directory" && directoryIdentity === "source-directory";
}
