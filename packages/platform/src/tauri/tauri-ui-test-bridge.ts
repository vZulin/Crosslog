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
    `regions=${state.redesignedRegions.length > 0 ? state.redesignedRegions.join(",") : "none"}`,
  ].join(";");
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
      return action;
    default:
      return null;
  }
}
