export interface UiTestShellState {
  readonly status: "empty" | "logs";
  readonly paneCount: number;
  readonly paneTitles: readonly string[];
  readonly activePaneTitle: string | null;
  readonly synchronizationEnabled: boolean;
  readonly copiedPaneTitle: string | null;
}

export type UiTestAction = "openSampleLogs" | "copyFirstPane" | "toggleSynchronization";

export interface UiTestBridge {
  readonly isEnabled: () => Promise<boolean>;
  readonly publishShellState: (state: UiTestShellState) => Promise<void>;
  readonly consumePendingAction: () => Promise<UiTestAction | null>;
}
