export interface UiTestShellState {
  readonly status: "empty" | "logs";
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
