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
}

export type UiTestAction =
  | "openSampleLogs"
  | "copyFirstPane"
  | "toggleSynchronization"
  | "openActivePaneSearch"
  | "setActivePaneInvalidSearch"
  | "openEmptyDirectory"
  | "navigatePreviousDirectoryFile"
  | "navigateNextDirectoryFile"
  | "discoverNewerDirectoryFile"
  | "openActivePaneTimeOffset"
  | "setActivePaneTimeOffset"
  | "appendActiveFile"
  | "deleteActiveFile"
  | "replaceActiveFile";

export interface UiTestBridge {
  readonly isEnabled: () => Promise<boolean>;
  readonly publishShellState: (state: UiTestShellState) => Promise<void>;
  readonly consumePendingAction: () => Promise<UiTestAction | null>;
}
