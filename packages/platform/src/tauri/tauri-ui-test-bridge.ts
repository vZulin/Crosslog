import { invoke } from "@tauri-apps/api/core";
import type { UiTestAction, UiTestBridge, UiTestShellState } from "../ports/ui-test-bridge-port";

export class TauriUiTestBridge implements UiTestBridge {
  private enabled: Promise<boolean> | null = null;

  isEnabled(): Promise<boolean> {
    this.enabled ??= invoke<boolean>("is_ui_test_mode").catch(() => false);
    return this.enabled;
  }

  async publishShellState(state: UiTestShellState): Promise<void> {
    if (!(await this.isEnabled())) {
      return;
    }

    const formattedState = formatUiTestShellState(state);
    document.title = `Crosslog UI Test | ${formattedState}`;
    await invoke("publish_ui_test_state", { state: formattedState });
  }

  async consumePendingAction(): Promise<UiTestAction | null> {
    if (!(await this.isEnabled())) {
      return null;
    }

    return parseUiTestAction(await invoke<string | null>("consume_ui_test_action"));
  }
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
    `obsolete=${hasVisibleObsoleteControls(state) ? "visible" : "absent"}`,
    `workspaceOverflow=${state.workspaceLayout.horizontalOverflow ? "on" : "off"}`,
    `rightEdgeAligned=${formatNullableBoolean(state.workspaceLayout.rightmostPaneAlignedToWorkspace)}`,
    `workspaceWidth=${formatNullableNumber(state.workspaceLayout.workspaceWidthPx)}`,
    `workspaceContentWidth=${formatNullableNumber(state.workspaceLayout.workspaceContentWidthPx)}`,
    `workspaceRight=${formatNullableNumber(state.workspaceLayout.workspaceRightPx)}`,
    `rightmostPaneRight=${formatNullableNumber(state.workspaceLayout.rightmostPaneRightPx)}`,
    `rightEdgeGap=${formatNullableNumber(state.workspaceLayout.rightEdgeGapPx)}`,
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

function parseUiTestAction(action: string | null): UiTestAction | null {
  switch (action) {
    case "openSampleLogs":
    case "copyFirstPane":
    case "toggleSynchronization":
    case "openActivePaneSearch":
    case "setActivePaneInvalidSearch":
    case "openEmptyDirectory":
    case "navigatePreviousDirectoryFile":
    case "navigateNextDirectoryFile":
    case "discoverNewerDirectoryFile":
    case "openActivePaneTimeOffset":
    case "setActivePaneTimeOffset":
    case "appendActiveFile":
    case "deleteActiveFile":
    case "replaceActiveFile":
      return action;
    default:
      return null;
  }
}
