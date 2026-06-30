export type UiTestThemeVariant = "light" | "dark";
export type UiTestPlatformShellVariant = "macos" | "windows" | "linux" | "web";

export interface UiTestObsoleteControlVisibility {
  readonly workspaceToolbar: boolean;
  readonly paneCopyToolbar: boolean;
  readonly discoverNewerDirectoryFile: boolean;
  readonly appendLiveLine: boolean;
  readonly deleteActiveFile: boolean;
  readonly replaceActiveFile: boolean;
  readonly splitButton: boolean;
  readonly synchronizeByTimeText: boolean;
  readonly syncStateText: boolean;
  readonly resizeDecreaseButton: boolean;
  readonly resizeIncreaseButton: boolean;
  readonly paneReadyFooter: boolean;
}

export interface UiTestWorkspaceLayoutMeasurements {
  readonly workspaceWidthPx: number | null;
  readonly workspaceContentWidthPx: number | null;
  readonly workspaceRightPx: number | null;
  readonly rightmostPaneRightPx: number | null;
  readonly rightEdgeGapPx: number | null;
  readonly rightmostPaneAlignedToWorkspace: boolean | null;
  readonly horizontalOverflow: boolean;
}

export interface UiTestPaneNavigationEvidence {
  readonly paneOrder: readonly string[];
  readonly selectedLineNumber: number | null;
  readonly maxGutterDigitCount: number | null;
  readonly lastNavigation: "none" | "click" | "keyboard" | "wheel";
  readonly syncTargetLineNumber: number | null;
}

export interface UiTestSearchHighlightEvidence {
  readonly visible: boolean;
  readonly count: number;
}

export interface UiTestCopyActionEvidence {
  readonly visible: boolean;
  readonly pointerAnchored: boolean | null;
  readonly viewportBounded: boolean | null;
  readonly copiedProductTextVisible: boolean;
}

export type UiTestSourceOpeningStatus = "idle" | "pending" | "cancelled" | "opened" | "error";
export type UiTestSourceOpeningEntryPoint =
  | "none"
  | "empty-workspace"
  | "topbar-add-pane"
  | "drag-drop"
  | "ui-test-fixture";
export type UiTestSourceKind = "none" | "file" | "directory" | "mixed";

export interface UiTestSourceOpeningEvidence {
  readonly status: UiTestSourceOpeningStatus;
  readonly entryPoint: UiTestSourceOpeningEntryPoint;
  readonly selectedSourceKind: UiTestSourceKind;
  readonly openedSourceCount: number;
  readonly pickerRequestCount: number;
  readonly cancelledPickerCount: number;
  readonly fixtureSamplePaneCount: number;
}

export type UiTestControlAvailability = "enabled" | "disabled" | "hidden";

export interface UiTestFutureControlState {
  readonly activityRailOpenSources: UiTestControlAvailability;
  readonly activityRailSearch: UiTestControlAvailability;
  readonly topbarCommandField: UiTestControlAvailability;
  readonly activityRailSettings: UiTestControlAvailability;
}

export interface UiTestShellState {
  readonly status: "empty" | "logs";
  readonly themeVariant: UiTestThemeVariant;
  readonly platformShellVariant: UiTestPlatformShellVariant;
  readonly paneCount: number;
  readonly paneTitles: readonly string[];
  readonly activePaneTitle: string | null;
  readonly synchronizationEnabled: boolean;
  readonly paneSearchStatus: "closed" | "open" | "error";
  readonly paneSearchPaneTitle: string | null;
  readonly timeOffsetPopoverStatus: "closed" | "open";
  readonly timeOffsetPaneTitle: string | null;
  readonly activePaneOffsetLabel: string | null;
  readonly copiedPaneTitle: string | null;
  readonly sessionSnapshotStatus: "idle" | "pending" | "written" | "error";
  readonly redesignedRegions: readonly string[];
  readonly directoryName: string | null;
  readonly directorySelectedFileTitle: string | null;
  readonly directoryPreviousAvailable: boolean;
  readonly directoryNextAvailable: boolean;
  readonly directoryFileCount: number;
  readonly directoryEmptyVisible: boolean;
  readonly fileLifecycleSummary: string;
  readonly obsoleteControlVisibility: UiTestObsoleteControlVisibility;
  readonly workspaceLayout: UiTestWorkspaceLayoutMeasurements;
  readonly paneNavigation: UiTestPaneNavigationEvidence;
  readonly searchHighlights: UiTestSearchHighlightEvidence;
  readonly copyAction: UiTestCopyActionEvidence;
  readonly sourceOpening: UiTestSourceOpeningEvidence;
  readonly futureControls: UiTestFutureControlState;
}

export const uiTestActions = [
  "openSampleLogs",
  "copyFirstPane",
  "toggleSynchronization",
  "reorderFirstPaneAfterSecond",
  "keyboardNavigateActivePaneDown",
  "wheelNavigateActivePaneDown",
  "openActivePaneSearch",
  "setActivePaneSearchQuery",
  "setActivePaneInvalidSearch",
  "closeActivePaneSearch",
  "showFirstPaneCopyMenu",
  "dismissCopyMenu",
  "openEmptyDirectory",
  "navigatePreviousDirectoryFile",
  "navigateNextDirectoryFile",
  "discoverNewerDirectoryFile",
  "openActivePaneTimeOffset",
  "setActivePaneTimeOffset",
  "appendActiveFile",
  "deleteActiveFile",
  "replaceActiveFile",
] as const;

export type UiTestAction = (typeof uiTestActions)[number];

export interface UiTestBridge {
  readonly isEnabled: () => Promise<boolean>;
  readonly publishShellState: (state: UiTestShellState) => Promise<void>;
  readonly consumePendingAction: () => Promise<UiTestAction | null>;
}

const uiTestActionSet: ReadonlySet<string> = new Set(uiTestActions);

export function isUiTestAction(action: string | null | undefined): action is UiTestAction {
  return action !== null && action !== undefined && uiTestActionSet.has(action);
}

export function formatUiTestShellState(state: UiTestShellState): string {
  return [
    `state=${state.status}`,
    `theme=${state.themeVariant}`,
    `platform=${state.platformShellVariant}`,
    `panes=${state.paneCount}`,
    `sync=${state.synchronizationEnabled ? "on" : "off"}`,
    `search=${state.paneSearchStatus}`,
    `searchPane=${state.paneSearchPaneTitle ?? "none"}`,
    `timeOffset=${state.timeOffsetPopoverStatus}`,
    `timeOffsetPane=${state.timeOffsetPaneTitle ?? "none"}`,
    `activeOffset=${state.activePaneOffsetLabel ?? "none"}`,
    `session=${state.sessionSnapshotStatus}`,
    `copied=${state.copiedPaneTitle ?? "none"}`,
    `active=${state.activePaneTitle ?? "none"}`,
    `files=${state.paneTitles.length > 0 ? state.paneTitles.join(",") : "none"}`,
    `directory=${state.directoryName ?? "none"}`,
    `directoryFile=${state.directorySelectedFileTitle ?? "none"}`,
    `directoryPrevious=${state.directoryPreviousAvailable ? "on" : "off"}`,
    `directoryNext=${state.directoryNextAvailable ? "on" : "off"}`,
    `directoryFiles=${state.directoryFileCount}`,
    `emptyDirectory=${state.directoryEmptyVisible ? "on" : "off"}`,
    `lifecycle=${state.fileLifecycleSummary}`,
    `sourceOpening=${state.sourceOpening.status}`,
    `sourceEntry=${state.sourceOpening.entryPoint}`,
    `sourceKind=${state.sourceOpening.selectedSourceKind}`,
    `sourceOpened=${state.sourceOpening.openedSourceCount}`,
    `sourcePickerRequests=${state.sourceOpening.pickerRequestCount}`,
    `sourcePickerCancels=${state.sourceOpening.cancelledPickerCount}`,
    `fixtureSamplePanes=${state.sourceOpening.fixtureSamplePaneCount}`,
    `futureFiles=${state.futureControls.activityRailOpenSources}`,
    `futureSearch=${state.futureControls.activityRailSearch}`,
    `futureCommand=${state.futureControls.topbarCommandField}`,
    `settings=${state.futureControls.activityRailSettings}`,
    `obsolete=${hasVisibleObsoleteControls(state) ? "visible" : "absent"}`,
    `workspaceOverflow=${state.workspaceLayout.horizontalOverflow ? "on" : "off"}`,
    `rightEdgeAligned=${formatNullableBoolean(state.workspaceLayout.rightmostPaneAlignedToWorkspace)}`,
    `workspaceWidth=${formatNullableNumber(state.workspaceLayout.workspaceWidthPx)}`,
    `workspaceContentWidth=${formatNullableNumber(state.workspaceLayout.workspaceContentWidthPx)}`,
    `workspaceRight=${formatNullableNumber(state.workspaceLayout.workspaceRightPx)}`,
    `rightmostPaneRight=${formatNullableNumber(state.workspaceLayout.rightmostPaneRightPx)}`,
    `rightEdgeGap=${formatNullableNumber(state.workspaceLayout.rightEdgeGapPx)}`,
    `paneOrder=${state.paneNavigation.paneOrder.length > 0 ? state.paneNavigation.paneOrder.join(",") : "none"}`,
    `selectedLine=${formatNullableNumber(state.paneNavigation.selectedLineNumber)}`,
    `maxGutterDigits=${formatNullableNumber(state.paneNavigation.maxGutterDigitCount)}`,
    `lastNavigation=${state.paneNavigation.lastNavigation}`,
    `syncTargetLine=${formatNullableNumber(state.paneNavigation.syncTargetLineNumber)}`,
    `searchHighlights=${state.searchHighlights.visible ? "visible" : "hidden"}`,
    `searchHighlightCount=${state.searchHighlights.count}`,
    `copyAction=${state.copyAction.visible ? "visible" : "hidden"}`,
    `copyActionAnchored=${formatNullableBoolean(state.copyAction.pointerAnchored)}`,
    `copyActionBounded=${formatNullableBoolean(state.copyAction.viewportBounded)}`,
    `copiedText=${state.copyAction.copiedProductTextVisible ? "visible" : "absent"}`,
    `regions=${state.redesignedRegions.length > 0 ? state.redesignedRegions.join(",") : "none"}`,
  ].join(";");
}

function hasVisibleObsoleteControls(state: UiTestShellState): boolean {
  return Object.values(state.obsoleteControlVisibility).some(Boolean);
}

function formatNullableBoolean(value: boolean | null): string {
  if (value === null) {
    return "unknown";
  }

  return value ? "on" : "off";
}

function formatNullableNumber(value: number | null): string {
  return value === null ? "unknown" : String(value);
}
